/**
 * Advanced Security System
 * Provides comprehensive security measures including threat detection, compliance, and protection
 */

import { sql } from '@vercel/postgres'
import { logger } from './logger'
import { hash, compare } from 'bcryptjs'
import crypto from 'crypto'

// Types for security system
export interface SecurityEvent {
  id: string
  type: 'login_attempt' | 'access_violation' | 'data_breach' | 'suspicious_activity' | 'ddos_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ipAddress: string
  userAgent: string
  details: SecurityEventDetails
  timestamp: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface SecurityEventDetails {
  action: string
  resource?: string
  failureReason?: string
  attemptCount?: number
  geolocation?: {
    country: string
    city: string
    coordinates: [number, number]
  }
  threatScore: number
  indicators: string[]
}

export interface SecurityPolicy {
  id: string
  name: string
  type: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance'
  rules: SecurityRule[]
  enabled: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface SecurityRule {
  condition: string
  action: 'allow' | 'deny' | 'log' | 'alert' | 'block'
  parameters: Record<string, any>
}

export interface ComplianceReport {
  id: string
  standard: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO27001'
  status: 'compliant' | 'non_compliant' | 'partial'
  score: number
  findings: ComplianceFinding[]
  recommendations: string[]
  generatedAt: Date
  validUntil: Date
}

export interface ComplianceFinding {
  category: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  evidence: string[]
  remediation: string
}

export interface ThreatIntelligence {
  ipAddress: string
  threatScore: number
  categories: string[]
  lastSeen: Date
  sources: string[]
  blocked: boolean
}

export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  keyRotationDays: number
  backupEnabled: boolean
}

/**
 * Advanced Security Service
 */
export class SecurityService {
  private static encryptionKey: string
  private static securityPolicies = new Map<string, SecurityPolicy>()
  private static threatIntelligence = new Map<string, ThreatIntelligence>()

  /**
   * Initialize security service
   */
  static initialize(): void {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey()
    this.loadSecurityPolicies()
    this.loadThreatIntelligence()
    this.setupSecurityHeaders()
    logger.info('Security service initialized')
  }

  /**
   * Generate secure encryption key
   */
  private static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Load security policies from database
   */
  private static async loadSecurityPolicies(): Promise<void> {
    try {
      const { rows } = await sql`
        SELECT * FROM security_policies WHERE enabled = true
        ORDER BY priority DESC
      `

      rows.forEach(row => {
        const policy: SecurityPolicy = {
          id: row.id,
          name: row.name,
          type: row.type,
          rules: row.rules,
          enabled: row.enabled,
          priority: row.priority,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
        this.securityPolicies.set(policy.id, policy)
      })

      logger.info(`Loaded ${rows.length} security policies`)
    } catch (error) {
      logger.error('Error loading security policies:', error)
    }
  }

  /**
   * Load threat intelligence data
   */
  private static async loadThreatIntelligence(): Promise<void> {
    try {
      const { rows } = await sql`
        SELECT * FROM threat_intelligence 
        WHERE last_seen > NOW() - INTERVAL '30 days'
        AND blocked = true
      `

      rows.forEach(row => {
        const intel: ThreatIntelligence = {
          ipAddress: row.ip_address,
          threatScore: row.threat_score,
          categories: row.categories,
          lastSeen: row.last_seen,
          sources: row.sources,
          blocked: row.blocked
        }
        this.threatIntelligence.set(intel.ipAddress, intel)
      })

      logger.info(`Loaded ${rows.length} threat intelligence entries`)
    } catch (error) {
      logger.error('Error loading threat intelligence:', error)
    }
  }

  /**
   * Set up security headers
   */
  private static setupSecurityHeaders(): void {
    // Security headers are typically set in middleware
    // This method would configure the headers for the application
  }

  /**
   * Record security event
   */
  static async recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const eventId = crypto.randomUUID()

      await sql`
        INSERT INTO security_events (
          id, type, severity, user_id, ip_address, user_agent,
          details, timestamp, resolved
        ) VALUES (
          ${eventId}, ${event.type}, ${event.severity}, ${event.userId || null},
          ${event.ipAddress}, ${event.userAgent}, ${JSON.stringify(event.details)},
          NOW(), false
        )
      `

      // Trigger automated response if critical
      if (event.severity === 'critical') {
        await this.triggerAutomatedResponse(eventId, event)
      }

      logger.info(`Security event recorded: ${event.type} (${event.severity})`)
    } catch (error) {
      logger.error('Error recording security event:', error)
    }
  }

  /**
   * Analyze request for security threats
   */
  static async analyzeRequest(
    ipAddress: string,
    userAgent: string,
    url: string,
    headers: Record<string, string>,
    userId?: string
  ): Promise<{ allowed: boolean; threatScore: number; reasons: string[] }> {
    const threatScore = await this.calculateThreatScore(ipAddress, userAgent, headers)
    const reasons: string[] = []
    let allowed = true

    // Check threat intelligence
    const threatIntel = this.threatIntelligence.get(ipAddress)
    if (threatIntel && threatIntel.blocked) {
      allowed = false
      reasons.push(`IP ${ipAddress} is in threat intelligence blocklist`)
    }

    // Check for SQL injection patterns
    if (this.detectSQLInjection(url)) {
      allowed = false
      reasons.push('SQL injection pattern detected in URL')
      await this.recordSecurityEvent({
        type: 'access_violation',
        severity: 'high',
        userId,
        ipAddress,
        userAgent,
        details: {
          action: 'SQL injection attempt',
          resource: url,
          threatScore,
          indicators: ['sql_injection']
        }
      })
    }

    // Check for XSS patterns
    if (this.detectXSS(url)) {
      allowed = false
      reasons.push('XSS pattern detected in URL')
      await this.recordSecurityEvent({
        type: 'access_violation',
        severity: 'high',
        userId,
        ipAddress,
        userAgent,
        details: {
          action: 'XSS attempt',
          resource: url,
          threatScore,
          indicators: ['xss']
        }
      })
    }

    // Check rate limiting
    const rateLimit = await this.checkRateLimit(ipAddress, userId)
    if (!rateLimit.allowed) {
      allowed = false
      reasons.push('Rate limit exceeded')
    }

    // Check geolocation
    const geoCheck = await this.checkGeolocation(ipAddress)
    if (!geoCheck.allowed) {
      allowed = false
      reasons.push(`Access denied from ${geoCheck.country}`)
    }

    return { allowed, threatScore, reasons }
  }

  /**
   * Calculate threat score for request
   */
  private static async calculateThreatScore(
    ipAddress: string,
    userAgent: string,
    headers: Record<string, string>
  ): Promise<number> {
    let score = 0

    // Check known threat IPs
    const threatIntel = this.threatIntelligence.get(ipAddress)
    if (threatIntel) {
      score += threatIntel.threatScore
    }

    // Analyze user agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      score += 30
    }

    // Check for bot indicators
    if (this.detectBot(userAgent, headers)) {
      score += 20
    }

    // Check for proxy/VPN indicators
    if (await this.detectProxyVPN(ipAddress)) {
      score += 15
    }

    // Check for unusual headers
    if (this.analyzeHeaders(headers).suspicious) {
      score += 25
    }

    return Math.min(score, 100)
  }

  /**
   * Detect SQL injection patterns
   */
  private static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bselect\b.*\bfrom\b)/i,
      /(\binsert\b.*\binto\b)/i,
      /(\bdelete\b.*\bfrom\b)/i,
      /(\bdrop\b.*\btable\b)/i,
      /(\bupdate\b.*\bset\b)/i,
      /(\balter\b.*\btable\b)/i,
      /(\bcreate\b.*\btable\b)/i,
      /('.*or.*'.*=.*')/i,
      /(\bor\b.*\b1\b.*=.*\b1\b)/i,
      /(--)/,
      /(\bexec\b)/i,
      /(\bexecute\b)/i
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Detect XSS patterns
   */
  private static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
      /<.*\bon\w+\s*=.*>/gi
    ]

    return xssPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Check rate limiting
   */
  private static async checkRateLimit(ipAddress: string, userId?: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const identifier = userId || ipAddress
      const window = 3600 // 1 hour
      const limit = userId ? 1000 : 100 // Higher limit for authenticated users

      const { rows } = await sql`
        SELECT COUNT(*) as request_count
        FROM request_logs
        WHERE identifier = ${identifier}
        AND timestamp > NOW() - INTERVAL '1 hour'
      `

      const requestCount = parseInt(rows[0].request_count) || 0
      const allowed = requestCount < limit
      const remaining = Math.max(0, limit - requestCount)

      if (!allowed) {
        await this.recordSecurityEvent({
          type: 'ddos_attempt',
          severity: 'medium',
          userId,
          ipAddress,
          userAgent: '',
          details: {
            action: 'Rate limit exceeded',
            attemptCount: requestCount,
            threatScore: 50,
            indicators: ['rate_limit_exceeded']
          }
        })
      }

      return { allowed, remaining }
    } catch (error) {
      logger.error('Error checking rate limit:', error)
      return { allowed: true, remaining: 100 }
    }
  }

  /**
   * Check geolocation restrictions
   */
  private static async checkGeolocation(ipAddress: string): Promise<{ allowed: boolean; country: string }> {
    try {
      // In production, this would use a geolocation service
      const mockGeoData = { country: 'US' } // Placeholder

      // Check blocked countries
      const blockedCountries = ['CN', 'RU', 'KP'] // Example blocked countries
      const allowed = !blockedCountries.includes(mockGeoData.country)

      return { allowed, country: mockGeoData.country }
    } catch (error) {
      logger.error('Error checking geolocation:', error)
      return { allowed: true, country: 'Unknown' }
    }
  }

  /**
   * Detect suspicious user agents
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i,
      /java/i,
      /scanner/i,
      /hack/i,
      /exploit/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Detect bot indicators
   */
  private static detectBot(userAgent: string, headers: Record<string, string>): boolean {
    // Missing common browser headers
    const browserHeaders = ['accept', 'accept-language', 'accept-encoding']
    const missingHeaders = browserHeaders.filter(header => !headers[header])

    if (missingHeaders.length > 1) return true

    // Common bot user agents
    const botPatterns = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i
    ]

    return botPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Detect proxy/VPN usage
   */
  private static async detectProxyVPN(ipAddress: string): Promise<boolean> {
    try {
      // In production, this would use a proxy detection service
      // For now, return false as placeholder
      return false
    } catch (error) {
      logger.error('Error detecting proxy/VPN:', error)
      return false
    }
  }

  /**
   * Analyze HTTP headers for suspicious patterns
   */
  private static analyzeHeaders(headers: Record<string, string>): { suspicious: boolean; indicators: string[] } {
    const indicators: string[] = []
    let suspicious = false

    // Check for missing standard headers
    if (!headers['user-agent']) {
      indicators.push('missing_user_agent')
      suspicious = true
    }

    // Check for unusual header values
    if (headers['x-forwarded-for'] && headers['x-forwarded-for'].split(',').length > 5) {
      indicators.push('multiple_proxies')
      suspicious = true
    }

    // Check for automated tool headers
    const automatedHeaders = ['x-requested-with', 'x-automated-tool', 'x-scanner']
    automatedHeaders.forEach(header => {
      if (headers[header]) {
        indicators.push(`automated_tool_${header}`)
        suspicious = true
      }
    })

    return { suspicious, indicators }
  }

  /**
   * Trigger automated security response
   */
  private static async triggerAutomatedResponse(eventId: string, event: unknown): Promise<void> {
    try {
      // Block IP if critical threat
      if (event.severity === 'critical') {
        await this.blockIP(event.ipAddress, 'Automated block due to critical security event')
      }

      // Send alert to security team
      await this.sendSecurityAlert(event)

      // Create incident ticket
      await this.createIncidentTicket(eventId, event)

      logger.info(`Automated security response triggered for event ${eventId}`)
    } catch (error) {
      logger.error('Error in automated security response:', error)
    }
  }

  /**
   * Block IP address
   */
  private static async blockIP(ipAddress: string, reason: string): Promise<void> {
    await sql`
      INSERT INTO blocked_ips (ip_address, reason, blocked_at, expires_at)
      VALUES (${ipAddress}, ${reason}, NOW(), NOW() + INTERVAL '24 hours')
      ON CONFLICT (ip_address) DO UPDATE SET
      reason = EXCLUDED.reason,
      blocked_at = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'
    `

    // Update threat intelligence
    this.threatIntelligence.set(ipAddress, {
      ipAddress,
      threatScore: 100,
      categories: ['blocked'],
      lastSeen: new Date(),
      sources: ['automated_security'],
      blocked: true
    })
  }

  /**
   * Send security alert
   */
  private static async sendSecurityAlert(event: unknown): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    logger.warn(`SECURITY ALERT: ${event.type} (${event.severity}) from ${event.ipAddress}`)
  }

  /**
   * Create incident ticket
   */
  private static async createIncidentTicket(eventId: string, event: unknown): Promise<void> {
    await sql`
      INSERT INTO security_incidents (
        event_id, title, description, severity, status, created_at
      ) VALUES (
        ${eventId},
        ${`Security Event: ${event.type}`},
        ${`Automated incident created for ${event.type} from ${event.ipAddress}`},
        ${event.severity},
        'open',
        NOW()
      )
    `
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      logger.error('Error encrypting data:', error)
      throw new AppError('Encryption failed')
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':')
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (error) {
      logger.error('Error decrypting data:', error)
      throw new AppError('Decryption failed')
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(standard: ComplianceReport['standard']): Promise<ComplianceReport> {
    try {
      const findings = await this.assessCompliance(standard)
      const score = this.calculateComplianceScore(findings)
      const recommendations = this.generateComplianceRecommendations(findings)

      const report: ComplianceReport = {
        id: crypto.randomUUID(),
        standard,
        status: score >= 80 ? 'compliant' : score >= 60 ? 'partial' : 'non_compliant',
        score,
        findings,
        recommendations,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }

      // Save report
      await sql`
        INSERT INTO compliance_reports (
          id, standard, status, score, findings, recommendations,
          generated_at, valid_until
        ) VALUES (
          ${report.id}, ${report.standard}, ${report.status}, ${report.score},
          ${JSON.stringify(report.findings)}, ${JSON.stringify(report.recommendations)},
          ${report.generatedAt}, ${report.validUntil}
        )
      `

      return report
    } catch (error) {
      logger.error('Error generating compliance report:', error)
      throw new AppError('Failed to generate compliance report')
    }
  }

  /**
   * Assess compliance against standard
   */
  private static async assessCompliance(standard: string): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = []

    switch (standard) {
      case 'GDPR':
        findings.push(...await this.assessGDPRCompliance())
        break
      case 'HIPAA':
        findings.push(...await this.assessHIPAACompliance())
        break
      case 'SOX':
        findings.push(...await this.assessSOXCompliance())
        break
      case 'PCI_DSS':
        findings.push(...await this.assessPCIDSSCompliance())
        break
      case 'ISO27001':
        findings.push(...await this.assessISO27001Compliance())
        break
    }

    return findings
  }

  /**
   * Assess GDPR compliance
   */
  private static async assessGDPRCompliance(): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = []

    // Check data processing lawfulness
    const { rows: consentRows } = await sql`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN consent_given = true THEN 1 END) as with_consent
      FROM user_consents
    `

    if (consentRows[0].with_consent / consentRows[0].total < 0.95) {
      findings.push({
        category: 'Consent Management',
        description: 'Insufficient consent coverage for data processing',
        severity: 'high',
        evidence: [`Only ${(consentRows[0].with_consent / consentRows[0].total * 100).toFixed(1)}% of users have provided consent`],
        remediation: 'Implement comprehensive consent management system'
      })
    }

    // Check data retention policies
    const { rows: retentionRows } = await sql`
      SELECT COUNT(*) as old_data
      FROM user_data
      WHERE created_at < NOW() - INTERVAL '3 years'
      AND deleted_at IS NULL
    `

    if (retentionRows[0].old_data > 0) {
      findings.push({
        category: 'Data Retention',
        description: 'Data retained beyond reasonable period',
        severity: 'medium',
        evidence: [`${retentionRows[0].old_data} records older than 3 years`],
        remediation: 'Implement automated data retention and deletion policies'
      })
    }

    return findings
  }

  /**
   * Assess HIPAA compliance
   */
  private static async assessHIPAACompliance(): Promise<ComplianceFinding[]> {
    // Implementation would check HIPAA-specific requirements
    return []
  }

  /**
   * Assess SOX compliance
   */
  private static async assessSOXCompliance(): Promise<ComplianceFinding[]> {
    // Implementation would check SOX-specific requirements
    return []
  }

  /**
   * Assess PCI DSS compliance
   */
  private static async assessPCIDSSCompliance(): Promise<ComplianceFinding[]> {
    // Implementation would check PCI DSS-specific requirements
    return []
  }

  /**
   * Assess ISO 27001 compliance
   */
  private static async assessISO27001Compliance(): Promise<ComplianceFinding[]> {
    // Implementation would check ISO 27001-specific requirements
    return []
  }

  /**
   * Calculate compliance score
   */
  private static calculateComplianceScore(findings: ComplianceFinding[]): number {
    if (findings.length === 0) return 100

    const weights = { low: 1, medium: 3, high: 5, critical: 10 }
    const totalDeductions = findings.reduce((sum, finding) => sum + weights[finding.severity], 0)
    const maxPossibleDeductions = findings.length * weights.critical

    return Math.max(0, 100 - (totalDeductions / maxPossibleDeductions) * 100)
  }

  /**
   * Generate compliance recommendations
   */
  private static generateComplianceRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations = new Set<string>()

    findings.forEach(finding => {
      recommendations.add(finding.remediation)
    })

    return Array.from(recommendations)
  }

  /**
   * Get security dashboard data
   */
  static async getSecurityDashboard(): Promise<unknown> {
    try {
      const [eventsData, threatsData, complianceData] = await Promise.all([
        this.getSecurityEventsStats(),
        this.getThreatStats(),
        this.getComplianceStats()
      ])

      return {
        events: eventsData,
        threats: threatsData,
        compliance: complianceData,
        generatedAt: new Date()
      }
    } catch (error) {
      logger.error('Error getting security dashboard:', error)
      throw new AppError('Failed to get security dashboard')
    }
  }

  private static async getSecurityEventsStats(): Promise<unknown> {
    const { rows } = await sql`
      SELECT 
        type,
        severity,
        COUNT(*) as count,
        COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
      FROM security_events
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY type, severity
      ORDER BY count DESC
    `

    return rows
  }

  private static async getThreatStats(): Promise<unknown> {
    const { rows } = await sql`
      SELECT 
        COUNT(*) as total_threats,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_threats,
        AVG(threat_score) as avg_threat_score
      FROM threat_intelligence
      WHERE last_seen > NOW() - INTERVAL '30 days'
    `

    return rows[0]
  }

  private static async getComplianceStats(): Promise<unknown> {
    const { rows } = await sql`
      SELECT 
        standard,
        status,
        score,
        generated_at
      FROM compliance_reports
      WHERE generated_at > NOW() - INTERVAL '90 days'
      ORDER BY generated_at DESC
    `

    return rows
  }
}

export default SecurityService
