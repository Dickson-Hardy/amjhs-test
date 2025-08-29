/**
 * Enterprise Security Hardening System
 * Comprehensive security implementation for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { createHash, randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto'
import { promisify } from 'util'
import { z } from 'zod'
import { Redis } from 'ioredis'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// Security configuration
const SECURITY_CONFIG = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 64,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const,
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || 'Academic Journal',
    digits: 6,
    step: 30,
    window: 2,
  },
  session: {
    cookieName: 'secure-session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    standardHeaders: true,
    legacyHeaders: false,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordMinLength: 12,
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    csrfTokenLength: 32,
  }
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_BLOCKED = 'login_blocked',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_VIOLATION = 'csrf_violation',
}

// Security audit log schema
const SecurityAuditSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  eventType: z.nativeEnum(SecurityEventType),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  resource: z.string(),
  details: z.record(z.any()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean().default(false),
})

type SecurityAudit = z.infer<typeof SecurityAuditSchema>

// Multi-factor authentication schema
const MFASetupSchema = z.object({
  secret: z.string(),
  qrCodeUrl: z.string(),
  backupCodes: z.array(z.string()),
})

type MFASetup = z.infer<typeof MFASetupSchema>

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

class EnterpriseSecuritySystem {
  private redis: Redis | null = null
  private scryptAsync = promisify(scrypt)

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_SECURITY_DB || '1'),
      })
      // Security Redis initialized
    } catch (error) {
      logger.warn('⚠️ Security Redis unavailable:', error)
    }
  }

  /**
   * Security middleware for API routes
   */
  async securityMiddleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // Apply security headers
      const response = new NextResponse()
      this.applySecurityHeaders(response)

      // Rate limiting
      const rateLimitResult = await this.checkRateLimit(req)
      if (!rateLimitResult.success) {
        await this.logSecurityEvent({
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          ipAddress: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          resource: req.nextUrl.pathname,
          details: { limit: rateLimitResult.limit, remaining: rateLimitResult.remaining },
          severity: 'medium',
        })
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers: response.headers }
        )
      }

      // CORS validation
      const corsResult = this.validateCORS(req)
      if (!corsResult.valid) {
        await this.logSecurityEvent({
          eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
          ipAddress: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          resource: req.nextUrl.pathname,
          details: { reason: 'Invalid CORS origin', origin: req.headers.get('origin') },
          severity: 'high',
        })
        return NextResponse.json(
          { error: 'CORS policy violation' },
          { status: 403, headers: response.headers }
        )
      }

      // Input validation and security scanning
      const securityScanResult = await this.scanForThreats(req)
      if (securityScanResult.threatDetected) {
        await this.logSecurityEvent({
          eventType: securityScanResult.threatType!,
          ipAddress: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          resource: req.nextUrl.pathname,
          details: securityScanResult.details,
          severity: 'critical',
        })
        return NextResponse.json(
          { error: 'Security threat detected' },
          { status: 400, headers: response.headers }
        )
      }

      return null // Continue processing
    } catch (error) {
      logger.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }

  /**
   * Advanced encryption utilities
   */
  async encrypt(text: string, password?: string): Promise<string> {
    try {
      const salt = randomBytes(SECURITY_CONFIG.encryption.saltLength)
      const key = await this.scryptAsync(
        password || SECURITY_CONFIG.jwt.secret,
        salt,
        SECURITY_CONFIG.encryption.keyLength
      ) as Buffer

      const iv = randomBytes(SECURITY_CONFIG.encryption.ivLength)
      const cipher = createCipheriv(SECURITY_CONFIG.encryption.algorithm, key, iv)

      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      // Combine salt, iv, tag, and encrypted data
      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64')
    } catch (error) {
      throw new AppError(`Encryption failed: ${error}`)
    }
  }

  async decrypt(encryptedData: string, password?: string): Promise<string> {
    try {
      const buffer = Buffer.from(encryptedData, 'base64')
      
      const salt = buffer.subarray(0, SECURITY_CONFIG.encryption.saltLength)
      const iv = buffer.subarray(
        SECURITY_CONFIG.encryption.saltLength,
        SECURITY_CONFIG.encryption.saltLength + SECURITY_CONFIG.encryption.ivLength
      )
      const tag = buffer.subarray(
        SECURITY_CONFIG.encryption.saltLength + SECURITY_CONFIG.encryption.ivLength,
        SECURITY_CONFIG.encryption.saltLength + SECURITY_CONFIG.encryption.ivLength + SECURITY_CONFIG.encryption.tagLength
      )
      const encrypted = buffer.subarray(
        SECURITY_CONFIG.encryption.saltLength + SECURITY_CONFIG.encryption.ivLength + SECURITY_CONFIG.encryption.tagLength
      )

      const key = await this.scryptAsync(
        password || SECURITY_CONFIG.jwt.secret,
        salt,
        SECURITY_CONFIG.encryption.keyLength
      ) as Buffer

      const decipher = createDecipheriv(SECURITY_CONFIG.encryption.algorithm, key, iv)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new AppError(`Decryption failed: ${error}`)
    }
  }

  /**
   * Multi-Factor Authentication (MFA) system
   */
  async setupMFA(userId: string, serviceName?: string): Promise<MFASetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${serviceName || SECURITY_CONFIG.mfa.issuer}:${userId}`,
        issuer: SECURITY_CONFIG.mfa.issuer,
        length: 32,
      })

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        randomBytes(4).toString('hex').toUpperCase()
      )

      // Store encrypted secret and backup codes
      const encryptedSecret = await this.encrypt(secret.base32!)
      const encryptedBackupCodes = await Promise.all(
        backupCodes.map(code => this.encrypt(code))
      )

      if (this.redis) {
        await this.redis.hset(`mfa:${userId}`, {
          secret: encryptedSecret,
          backupCodes: JSON.stringify(encryptedBackupCodes),
          enabled: 'false',
          setupTimestamp: Date.now(),
        })
      }

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes,
      }
    } catch (error) {
      throw new AppError(`MFA setup failed: ${error}`)
    }
  }

  async verifyMFA(userId: string, token: string, isBackupCode = false): Promise<boolean> {
    try {
      if (!this.redis) return false

      const mfaData = await this.redis.hgetall(`mfa:${userId}`)
      if (!mfaData.secret) return false

      if (isBackupCode) {
        // Verify backup code
        const encryptedBackupCodes = JSON.parse(mfaData.backupCodes || '[]')
        const backupCodes = await Promise.all(
          encryptedBackupCodes.map((code: string) => this.decrypt(code))
        )

        const codeIndex = backupCodes.indexOf(token.toUpperCase())
        if (codeIndex === -1) return false

        // Remove used backup code
        encryptedBackupCodes.splice(codeIndex, 1)
        await this.redis.hset(`mfa:${userId}`, 'backupCodes', JSON.stringify(encryptedBackupCodes))

        return true
      } else {
        // Verify TOTP token
        const secret = await this.decrypt(mfaData.secret)
        return speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token,
          step: SECURITY_CONFIG.mfa.step,
          window: SECURITY_CONFIG.mfa.window,
        })
      }
    } catch (error) {
      logger.error('MFA verification error:', error)
      return false
    }
  }

  async enableMFA(userId: string): Promise<boolean> {
    try {
      if (!this.redis) return false
      await this.redis.hset(`mfa:${userId}`, 'enabled', 'true')
      
      await this.logSecurityEvent({
        eventType: SecurityEventType.MFA_ENABLED,
        userId,
        ipAddress: 'system',
        userAgent: 'system',
        resource: 'mfa',
        details: {},
        severity: 'low',
      })

      return true
    } catch (error) {
      logger.error('MFA enable error:', error)
      return false
    }
  }

  /**
   * Advanced JWT token management
   */
  generateTokens(payload: unknown): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      SECURITY_CONFIG.jwt.secret,
      {
        expiresIn: SECURITY_CONFIG.jwt.accessTokenExpiry,
        algorithm: SECURITY_CONFIG.jwt.algorithm,
      }
    )

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      SECURITY_CONFIG.jwt.secret,
      {
        expiresIn: SECURITY_CONFIG.jwt.refreshTokenExpiry,
        algorithm: SECURITY_CONFIG.jwt.algorithm,
      }
    )

    return { accessToken, refreshToken }
  }

  verifyToken(token: string, type: 'access' | 'refresh' = 'access'): unknown {
    try {
      const decoded = jwt.verify(token, SECURITY_CONFIG.jwt.secret) as unknown
      if (decoded.type !== type) {
        throw new ValidationError('Invalid token type')
      }
      return decoded
    } catch (error) {
      throw new AuthenticationError(`Token verification failed: ${error}`)
    }
  }

  /**
   * Security audit logging
   */
  async logSecurityEvent(event: Omit<SecurityAudit, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: SecurityAudit = {
        id: randomBytes(16).toString('hex'),
        timestamp: new Date(),
        ...event,
      }

      // Store in Redis for real-time monitoring
      if (this.redis) {
        await this.redis.lpush('security:audit', JSON.stringify(auditLog))
        await this.redis.ltrim('security:audit', 0, 9999) // Keep last 10k events
      }

      // Log critical events immediately
      if (event.severity === 'critical') {
        logger.error('🚨 CRITICAL SECURITY EVENT:', auditLog)
        // In production, this should trigger immediate alerts
      }

              // Security Event logged
    } catch (error) {
      logger.error('Security logging error:', error)
    }
  }

  /**
   * Get security analytics and reports
   */
  async getSecurityReport(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<unknown> {
    try {
      if (!this.redis) return { error: 'Redis unavailable' }

      const auditLogs = await this.redis.lrange('security:audit', 0, -1)
      const events = auditLogs.map(log => JSON.parse(log) as SecurityAudit)

      const now = new Date()
      const timeframeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[timeframe]

      const filteredEvents = events.filter(event => 
        new Date(event.timestamp).getTime() > (now.getTime() - timeframeMs)
      )

      // Generate analytics
      const eventsByType = filteredEvents.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsBySeverity = filteredEvents.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topIPs = filteredEvents.reduce((acc, event) => {
        acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        timeframe,
        totalEvents: filteredEvents.length,
        eventsByType,
        eventsBySeverity,
        topIPs: Object.entries(topIPs)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [ip, count]) => ({ ...acc, [ip]: count }), {}),
        criticalEvents: filteredEvents.filter(e => e.severity === 'critical').length,
        unresolvedEvents: filteredEvents.filter(e => !e.resolved).length,
      }
    } catch (error) {
      logger.error('Security report error:', error)
      return { error: 'Failed to generate security report' }
    }
  }

  // Private helper methods
  private applySecurityHeaders(response: NextResponse): void {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  private async checkRateLimit(req: NextRequest): Promise<unknown> {
    const ip = this.getClientIP(req)
    return await rateLimit.check(ip, {
      windowMs: SECURITY_CONFIG.rateLimit.windowMs,
      max: SECURITY_CONFIG.rateLimit.max,
    })
  }

  private validateCORS(req: NextRequest): { valid: boolean; origin?: string } {
    const origin = req.headers.get('origin')
    if (!origin) return { valid: true } // Same-origin requests

    const isAllowed = SECURITY_CONFIG.cors.allowedOrigins.includes(origin) ||
                     SECURITY_CONFIG.cors.allowedOrigins.includes('*')

    return { valid: isAllowed, origin }
  }

  private async scanForThreats(req: NextRequest): Promise<{
    threatDetected: boolean;
    threatType?: SecurityEventType;
    details?: unknown;
  }> {
    try {
      const url = req.nextUrl.toString()
      const body = req.method === 'POST' ? await req.clone().text() : ''
      const userAgent = req.headers.get('user-agent') || ''

      // SQL Injection patterns
      const sqlPatterns = [
        /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
        /(\bINSERT\b.*\bINTO\b)|(\bUPDATE\b.*\bSET\b)|(\bDELETE\b.*\bFROM\b)/i,
        /(\bDROP\b.*\bTABLE\b)|(\bCREATE\b.*\bTABLE\b)/i,
        /(--|\#|\/\*|\*\/)/,
        /(\bOR\b.*=.*\bOR\b)|(\bAND\b.*=.*\bAND\b)/i,
      ]

      // XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>.*?<\/iframe>/i,
        /vbscript:/i,
      ]

      const testString = `${url} ${body} ${userAgent}`

      // Check SQL injection
      if (sqlPatterns.some(pattern => pattern.test(testString))) {
        return {
          threatDetected: true,
          threatType: SecurityEventType.SQL_INJECTION_ATTEMPT,
          details: { pattern: 'SQL injection pattern detected' },
        }
      }

      // Check XSS
      if (xssPatterns.some(pattern => pattern.test(testString))) {
        return {
          threatDetected: true,
          threatType: SecurityEventType.XSS_ATTEMPT,
          details: { pattern: 'XSS pattern detected' },
        }
      }

      // Check for suspicious user agents
      const suspiciousAgents = ['sqlmap', 'nikto', 'dirb', 'burp', 'nmap']
      if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
        return {
          threatDetected: true,
          threatType: SecurityEventType.SUSPICIOUS_ACTIVITY,
          details: { userAgent: 'Suspicious user agent detected' },
        }
      }

      return { threatDetected: false }
    } catch (error) {
      logger.error('Threat scanning error:', error)
      return { threatDetected: false }
    }
  }

  private getClientIP(req: NextRequest): string {
    const xForwardedFor = req.headers.get('x-forwarded-for')
    const xRealIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    return (
      cfConnectingIP ||
      xRealIP ||
      (xForwardedFor ? xForwardedFor.split(',')[0].trim() : '') ||
      'unknown'
    )
  }
}

// Singleton instance
export const securitySystem = new EnterpriseSecuritySystem()

// Security decorators
export function RequireMFA(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (req: NextRequest, ...args: unknown[]) {
    // Check if user has MFA enabled and verified
    const userId = req.headers.get('x-user-id')
    const mfaVerified = req.headers.get('x-mfa-verified')

    if (!userId || mfaVerified !== 'true') {
      return NextResponse.json(
        { error: 'MFA verification required' },
        { status: 401 }
      )
    }

    return originalMethod.apply(this, [req, ...args])
  }

  return descriptor
}

export function RequireRole(roles: string[]) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (req: NextRequest, ...args: unknown[]) {
      const userRole = req.headers.get('x-user-role')

      if (!userRole || !roles.includes(userRole)) {
        await securitySystem.logSecurityEvent({
          eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
          userId: req.headers.get('x-user-id') || undefined,
          ipAddress: securitySystem['getClientIP'](req),
          userAgent: req.headers.get('user-agent') || '',
          resource: req.nextUrl.pathname,
          details: { requiredRoles: roles, userRole },
          severity: 'medium',
        })

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return originalMethod.apply(this, [req, ...args])
    }

    return descriptor
  }
}

// Export security system
export default securitySystem
