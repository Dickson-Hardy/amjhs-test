/**
 * Production Monitoring & Analytics Service
 * Integrates with Sentry, Google Analytics, and custom monitoring
 */

import { logError, logInfo } from './logger'

// Lazy Sentry initialization
let Sentry: unknown = null
let sentryInitialized = false

async function initSentry() {
  if (sentryInitialized) return Sentry
  
  sentryInitialized = true
  
  if (typeof window !== 'undefined' || (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN)) {
    try {
      const module = await import('@sentry/nextjs')
      Sentry = module.default || module
    } catch (error) {
      logger.warn('Sentry not available:', error)
      Sentry = null
    }
  }
  
  return Sentry
}

// Analytics Events
export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp?: Date
  category?: 'user' | 'article' | 'review' | 'system' | 'performance'
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: Date
  metadata?: Record<string, any>
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: boolean
    redis: boolean
    email: boolean
    files: boolean
    external: boolean
  }
  metrics: {
    responseTime: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  timestamp: Date
}

/**
 * Sentry Error Tracking Integration
 */
class SentryService {
  static async initialize() {
    const sentry = await initSentry()
    if (sentry && process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
      sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1, // 10% sampling for performance
        beforeSend(event: unknown) {
          // Filter out non-critical errors in production
          if (event.exception) {
            const error = event.exception.values?.[0]
            if (error?.type === 'AbortError' || error?.value?.includes('Network request failed')) {
              return null // Don't send network errors
            }
          }
          return event
        }
      })
      
      logInfo('Sentry initialized for error tracking')
    }
  }

  static async captureError(error: Error, context?: Record<string, any>) {
    const sentry = await initSentry()
    if (sentry && process.env.NODE_ENV === 'production') {
      sentry.withScope((scope: unknown) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value))
          })
        }
        sentry.captureException(error)
      })
    } else {
      logger.error('Development Error:', error, context)
    }
  }

  static async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    const sentry = await initSentry()
    if (sentry && process.env.NODE_ENV === 'production') {
      sentry.withScope((scope: unknown) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value))
          })
        }
        sentry.captureMessage(message, level)
      })
    } else {
      logger.info(`Development ${level.toUpperCase()}:`, message, context)
    }
  }

  static async setUser(user: { id: string; email?: string; username?: string }) {
    const sentry = await initSentry()
    if (sentry) {
      sentry.setUser(user)
    }
  }

  static async addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    const sentry = await initSentry()
    if (sentry) {
      sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000
      })
    }
  }
}

/**
 * Google Analytics Integration
 */
class GoogleAnalyticsService {
  private static gaId = typeof process !== 'undefined' ? process.env.GOOGLE_ANALYTICS_ID : ''

  static initialize() {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    if (this.gaId) {
      // Load GA4 script
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`
      script.async = true
      document.head.appendChild(script)

      // Initialize gtag
      window.gtag = window.gtag || function(...args: unknown[]) {
        (window.gtag as unknown).q = (window.gtag as any).q || [];
        (window.gtag as unknown).q.push(args)
      }

      window.gtag('js', new Date())
      window.gtag('config', this.gaId, {
        page_title: document.title,
        page_location: window.location.href
      })

      logInfo('Google Analytics initialized')
    }
  }

  static trackEvent(event: AnalyticsEvent) {
    if (this.gaId && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.event, {
        event_category: event.category || 'general',
        event_label: event.properties?.label,
        value: event.properties?.value,
        user_id: event.userId,
        custom_parameters: event.properties
      })
    }
  }

  static trackPageView(path: string, title?: string) {
    if (this.gaId && typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', this.gaId, {
        page_title: title,
        page_location: `${window.location.origin}${path}`
      })
    }
  }

  static trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent({
      event: action,
      category: category as unknown,
      properties: {
        label,
        value
      }
    })
  }
}

/**
 * Custom Analytics Service
 */
class CustomAnalyticsService {
  private static events: AnalyticsEvent[] = []
  private static metrics: PerformanceMetric[] = []

  static async trackEvent(event: AnalyticsEvent) {
    try {
      // Add timestamp if not provided
      const enrichedEvent: AnalyticsEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || this.getSessionId()
      }

      // Store locally for batching
      this.events.push(enrichedEvent)

      // Send to Google Analytics
      GoogleAnalyticsService.trackEvent(enrichedEvent)

      // Send to backend for custom analytics
      if (process.env.ENABLE_ANALYTICS === 'true') {
        await this.sendToBackend('events', enrichedEvent)
      }

      // Batch send every 10 events or 30 seconds
      if (this.events.length >= 10) {
        await this.flushEvents()
      }
    } catch (error) {
      logError(error as Error, { context: 'trackEvent', event })
    }
  }

  static async trackPerformance(metric: PerformanceMetric) {
    try {
      this.metrics.push(metric)

      // Send critical performance metrics immediately
      if (metric.name === 'page_load_time' || metric.value > 5000) {
        await this.sendToBackend('performance', metric)
      }

      // Batch send performance metrics
      if (this.metrics.length >= 5) {
        await this.flushMetrics()
      }
    } catch (error) {
      logError(error as Error, { context: 'trackPerformance', metric })
    }
  }

  static async trackUserJourney(step: string, userId?: string, metadata?: Record<string, any>) {
    await this.trackEvent({
      event: 'user_journey_step',
      category: 'user',
      userId,
      properties: {
        step,
        ...metadata
      }
    })
  }

  static async trackArticleInteraction(action: string, articleId: string, userId?: string) {
    await this.trackEvent({
      event: 'article_interaction',
      category: 'article',
      userId,
      properties: {
        action,
        articleId
      }
    })
  }

  static async trackReviewActivity(action: string, reviewId: string, userId?: string) {
    await this.trackEvent({
      event: 'review_activity',
      category: 'review',
      userId,
      properties: {
        action,
        reviewId
      }
    })
  }

  static async trackSystemEvent(event: string, metadata?: Record<string, any>) {
    await this.trackEvent({
      event: `system_${event}`,
      category: 'system',
      properties: metadata
    })
  }

  // Flush batched events
  private static async flushEvents() {
    if (this.events.length === 0) return

    try {
      await this.sendToBackend('events/batch', { events: this.events })
      this.events = []
    } catch (error) {
      logError(error as Error, { context: 'flushEvents' })
    }
  }

  // Flush batched metrics
  private static async flushMetrics() {
    if (this.metrics.length === 0) return

    try {
      await this.sendToBackend('performance/batch', { metrics: this.metrics })
      this.metrics = []
    } catch (error) {
      logError(error as Error, { context: 'flushMetrics' })
    }
  }

  private static async sendToBackend(endpoint: string, data: unknown) {
    try {
      const response = await fetch(`/api/analytics/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new AppError(`Analytics API error: ${response.statusText}`)
      }
    } catch (error) {
      // Fail silently for analytics to avoid disrupting user experience
      logError(error as Error, { context: 'sendToBackend', endpoint })
    }
  }

  private static getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('analytics_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('analytics_session_id', sessionId)
      }
      return sessionId
    }
    return `server_session_${Date.now()}`
  }
}

/**
 * System Health Monitoring
 */
class SystemHealthService {
  private static healthChecks: Map<string, () => Promise<boolean>> = new Map()

  static registerHealthCheck(name: string, checkFunction: () => Promise<boolean>) {
    this.healthChecks.set(name, checkFunction)
  }

  static async checkSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now()
    
    try {
      // Run all health checks
      const healthPromises = Array.from(this.healthChecks.entries()).map(async ([name, check]) => {
        try {
          const result = await Promise.race([
            check(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
          ])
          return { name, healthy: result }
        } catch (error) {
          logError(error as Error, { context: 'healthCheck', service: name })
          return { name, healthy: false }
        }
      })

      const healthResults = await Promise.all(healthPromises)
      const responseTime = Date.now() - startTime

      // Calculate system metrics
      const services = {
        database: healthResults.find(r => r.name === 'database')?.healthy ?? false,
        redis: healthResults.find(r => r.name === 'redis')?.healthy ?? false,
        email: healthResults.find(r => r.name === 'email')?.healthy ?? false,
        files: healthResults.find(r => r.name === 'files')?.healthy ?? false,
        external: healthResults.find(r => r.name === 'external')?.healthy ?? false
      }

      const healthyServices = Object.values(services).filter(Boolean).length
      const totalServices = Object.values(services).length
      const healthPercentage = (healthyServices / totalServices) * 100

      let status: SystemHealth['status'] = 'healthy'
      if (healthPercentage < 50) status = 'down'
      else if (healthPercentage < 90) status = 'degraded'

      // Get system metrics
      const metrics = await this.getSystemMetrics()

      const health: SystemHealth = {
        status,
        services,
        metrics: {
          responseTime,
          ...metrics
        },
        timestamp: new Date()
      }

      // Track system health
      await CustomAnalyticsService.trackSystemEvent('health_check', {
        status,
        responseTime,
        healthyServices,
        totalServices
      })

      return health
    } catch (error) {
      logError(error as Error, { context: 'checkSystemHealth' })
      
      return {
        status: 'down',
        services: {
          database: false,
          redis: false,
          email: false,
          files: false,
          external: false
        },
        metrics: {
          responseTime: Date.now() - startTime,
          memoryUsage: 0,
          cpuUsage: 0,
          diskUsage: 0
        },
        timestamp: new Date()
      }
    }
  }

  private static async getSystemMetrics(): Promise<{
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }> {
    try {
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage()
        return {
          memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
          cpuUsage: 0, // Would need additional libraries for CPU monitoring
          diskUsage: 0 // Would need additional libraries for disk monitoring
        }
      }
      
      return { memoryUsage: 0, cpuUsage: 0, diskUsage: 0 }
    } catch (error) {
      return { memoryUsage: 0, cpuUsage: 0, diskUsage: 0 }
    }
  }
}

/**
 * Main Production Monitoring Service
 */
class ProductionMonitoringService {
  
  static async initialize() {
    // Initialize all monitoring services
    await SentryService.initialize()
    GoogleAnalyticsService.initialize()

    // Register default health checks
    this.registerDefaultHealthChecks()

    // Set up periodic health checks
    if (typeof window === 'undefined') { // Server-side only
      setInterval(async () => {
        const health = await SystemHealthService.checkSystemHealth()
        if (health.status !== 'healthy') {
          await SentryService.captureMessage(
            `System health degraded: ${health.status}`,
            'warning',
            { health }
          )
        }
      }, 60000) // Check every minute
    }

    // Set up periodic metric flushing
    setInterval(() => {
      CustomAnalyticsService['flushEvents']?.()
      CustomAnalyticsService['flushMetrics']?.()
    }, 30000) // Flush every 30 seconds

    logInfo('Production monitoring initialized')
  }

  static async trackError(error: Error, context?: Record<string, any>) {
    await SentryService.captureError(error, context)
    await CustomAnalyticsService.trackSystemEvent('error', {
      error: error.message,
      stack: error.stack,
      ...context
    })
  }

  static async trackPerformance(name: string, value: number, unit: PerformanceMetric['unit'] = 'ms') {
    await CustomAnalyticsService.trackPerformance({
      name,
      value,
      unit,
      timestamp: new Date()
    })
  }

  static async trackUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
    await CustomAnalyticsService.trackEvent({
      event: action,
      category: 'user',
      userId,
      properties: metadata
    })
  }

  static async setUser(user: { id: string; email?: string; name?: string }) {
    await SentryService.setUser({
      id: user.id,
      email: user.email,
      username: user.name
    })
  }

  private static registerDefaultHealthChecks() {
    // Database health check
    SystemHealthService.registerHealthCheck('database', async () => {
      try {
        // This would check database connectivity
        // await db.query.users.findFirst()
        return true
      } catch {
        return false
      }
    })

    // Redis health check  
    SystemHealthService.registerHealthCheck('redis', async () => {
      try {
        // This would check Redis connectivity
        // await redis.ping()
        return true
      } catch {
        return false
      }
    })

    // Email service health check
    SystemHealthService.registerHealthCheck('email', async () => {
      try {
        // This would check email service
        // await checkEmailServiceHealth()
        return true
      } catch {
        return false
      }
    })

    // File storage health check
    SystemHealthService.registerHealthCheck('files', async () => {
      try {
        // This would check ImageKit connectivity
        return true
      } catch {
        return false
      }
    })

    // External APIs health check
    SystemHealthService.registerHealthCheck('external', async () => {
      try {
        // This would check ORCID, CrossRef, etc.
        return true
      } catch {
        return false
      }
    })
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

// Export all services
export { SentryService, GoogleAnalyticsService, CustomAnalyticsService, SystemHealthService }

export default ProductionMonitoringService
