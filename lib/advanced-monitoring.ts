/**
 * Enterprise Advanced Monitoring & Observability System
 * Real-time application monitoring, metrics, and alerting
 */

import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'
import { z } from 'zod'
import { performance } from 'perf_hooks'
import os from 'os'
import { createHash } from 'crypto'

// Monitoring configuration
const ADVANCED_MONITORING_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_MONITORING_DB || '2'),
  },
  metrics: {
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    aggregationInterval: 60 * 1000, // 1 minute
    alertThresholds: {
      responseTime: 2000, // 2 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.80, // 80%
      diskUsage: 0.90, // 90%
    },
  },
  alerts: {
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    slackChannel: process.env.SLACK_ALERTS_CHANNEL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
  },
  tracing: {
    enabled: process.env.TRACING_ENABLED === 'true',
    sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '0.1'),
  },
}

// Metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Metric data schema
const MetricSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(MetricType),
  value: z.number(),
  timestamp: z.number(),
  tags: z.record(z.string()).optional(),
  unit: z.string().optional(),
})

type Metric = z.infer<typeof MetricSchema>

// Performance trace schema
const TraceSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  operationName: z.string(),
  startTime: z.number(),
  endTime: z.number().optional(),
  duration: z.number().optional(),
  tags: z.record(z.any()).optional(),
  logs: z.array(z.object({
    timestamp: z.number(),
    level: z.string(),
    message: z.string(),
    fields: z.record(z.any()).optional(),
  })).optional(),
  status: z.enum(['ok', 'error', 'timeout']).optional(),
})

type Trace = z.infer<typeof TraceSchema>

// Alert schema
const AlertSchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.nativeEnum(AlertSeverity),
  message: z.string(),
  timestamp: z.number(),
  source: z.string(),
  tags: z.record(z.string()).optional(),
  resolved: z.boolean().default(false),
  resolvedAt: z.number().optional(),
  resolvedBy: z.string().optional(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.number().optional(),
})

type Alert = z.infer<typeof AlertSchema>

// System health data
interface SystemHealth {
  timestamp: number
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    usage: number
    heap: {
      used: number
      total: number
    }
  }
  disk: {
    usage: number
    free: number
    total: number
  }
  network: {
    connections: number
    bytesIn: number
    bytesOut: number
  }
  application: {
    uptime: number
    version: string
    nodeVersion: string
    pid: number
  }
}

class AdvancedMonitoringSystem {
  private redis: Redis | null = null
  private metricsBuffer: Metric[] = []
  private tracesBuffer: Trace[] = []
  private alertsBuffer: Alert[] = []
  private systemHealthCache: SystemHealth | null = null
  private flushInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeRedis()
    this.startBackgroundTasks()
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis(ADVANCED_MONITORING_CONFIG.redis)
      
      this.redis.on('connect', () => {
        logger.info('✅ Advanced Monitoring Redis connected')
      })

      this.redis.on('error', (err) => {
        logger.warn('⚠️ Advanced Monitoring Redis error:', err.message)
      })

      logger.error('🚀 Advanced enterprise monitoring system initialized')
    } catch (error) {
      logger.warn('⚠️ Advanced Monitoring Redis unavailable:', error)
    }
  }

  private startBackgroundTasks(): void {
    // Flush metrics to Redis periodically
    this.flushInterval = setInterval(() => {
      this.flushBuffers()
    }, ADVANCED_MONITORING_CONFIG.metrics.aggregationInterval)

    // Collect system health metrics
    this.healthCheckInterval = setInterval(() => {
      this.collectSystemHealth()
    }, 30000) // Every 30 seconds

    // Cleanup old metrics
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.GAUGE,
    tags?: Record<string, string>,
    unit?: string
  ): void {
    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags,
      unit,
    }

    this.metricsBuffer.push(metric)

    // Check for immediate alerts
    this.checkMetricThresholds(metric)
  }

  /**
   * Start a new performance trace
   */
  startTrace(operationName: string, parentSpanId?: string): Trace {
    const trace: Trace = {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId,
      operationName,
      startTime: performance.now(),
      tags: {},
      logs: [],
    }

    return trace
  }

  /**
   * End a performance trace
   */
  endTrace(trace: Trace, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
    trace.endTime = performance.now()
    trace.duration = trace.endTime - trace.startTime
    trace.status = status

    this.tracesBuffer.push(trace)

    // Check for slow operations
    if (trace.duration && trace.duration > ADVANCED_MONITORING_CONFIG.metrics.alertThresholds.responseTime) {
      this.createAlert({
        name: 'Slow Operation',
        severity: AlertSeverity.WARNING,
        message: `Operation "${trace.operationName}" took ${trace.duration.toFixed(2)}ms`,
        source: 'performance_monitor',
        tags: {
          operation: trace.operationName,
          traceId: trace.traceId,
          duration: trace.duration.toString(),
        },
      })
    }
  }

  /**
   * Add log to trace
   */
  addTraceLog(
    trace: Trace,
    level: string,
    message: string,
    fields?: Record<string, any>
  ): void {
    if (!trace.logs) trace.logs = []
    
    trace.logs.push({
      timestamp: performance.now(),
      level,
      message,
      fields,
    })
  }

  /**
   * Create an alert
   */
  createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: Date.now(),
      resolved: false,
      ...alertData,
    }

    this.alertsBuffer.push(alert)

    // Send immediate notification for critical alerts
    if (alert.severity === AlertSeverity.CRITICAL) {
      this.sendImmediateAlert(alert)
    }

    logger.info(`🚨 Alert [${alert.severity.toUpperCase()}]: ${alert.message}`)
  }

  /**
   * Middleware for automatic request monitoring
   */
  monitoringMiddleware() {
    return async (req: NextRequest, handler: () => Promise<Response>) => {
      const trace = this.startTrace(`${req.method} ${req.nextUrl.pathname}`)
      trace.tags = {
        method: req.method,
        path: req.nextUrl.pathname,
        userAgent: req.headers.get('user-agent') || 'unknown',
        ip: this.getClientIP(req),
      }

      let response: Response
      let status = 'ok'

      try {
        response = await handler()
        
        // Record response metrics
        this.recordMetric('http_requests_total', 1, MetricType.COUNTER, {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status.toString(),
        })

        this.recordMetric('http_response_status', response.status, MetricType.GAUGE, {
          method: req.method,
          path: req.nextUrl.pathname,
        })

        if (response.status >= 400) {
          status = 'error'
          this.addTraceLog(trace, 'error', `HTTP ${response.status}`, {
            status: response.status,
            statusText: response.statusText,
          })
        }

      } catch (error) {
        status = 'error'
        this.addTraceLog(trace, 'error', error instanceof Error ? error.message : 'Unknown error', {
          error: error instanceof Error ? error.stack : String(error),
        })

        // Create error alert
        this.createAlert({
          name: 'Request Error',
          severity: AlertSeverity.ERROR,
          message: `Error in ${req.method} ${req.nextUrl.pathname}: ${error}`,
          source: 'request_monitor',
          tags: {
            method: req.method,
            path: req.nextUrl.pathname,
            error: isAppError(error) ? error.message : (isAppError(error) ? error.message : (error instanceof Error ? error.message : String(error))),
          },
        })

        throw error
      } finally {
        this.endTrace(trace, status)
        
        // Record response time
        if (trace.duration) {
          this.recordMetric('http_request_duration', trace.duration, MetricType.HISTOGRAM, {
            method: req.method,
            path: req.nextUrl.pathname,
          }, 'ms')
        }
      }

      return response
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(): Promise<unknown> {
    try {
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      // Get recent metrics
      const recentMetrics = await this.getMetrics('*', oneHourAgo, now)
      
      // Get active alerts
      const activeAlerts = await this.getActiveAlerts()
      
      // Get system health
      const systemHealth = await this.getSystemHealth()
      
      // Calculate key performance indicators
      const kpis = this.calculateKPIs(recentMetrics)

      return {
        timestamp: now,
        systemHealth,
        activeAlerts,
        kpis,
        recentMetrics: this.aggregateMetrics(recentMetrics),
        performance: {
          avgResponseTime: kpis.avgResponseTime,
          errorRate: kpis.errorRate,
          requestsPerMinute: kpis.requestsPerMinute,
          uptime: systemHealth?.application.uptime || 0,
        },
      }
    } catch (error) {
      logger.error('Dashboard data error:', error)
      return { error: 'Failed to load dashboard data' }
    }
  }

  /**
   * Get metrics by pattern and time range
   */
  async getMetrics(pattern: string, startTime: number, endTime: number): Promise<Metric[]> {
    if (!this.redis) return []

    try {
      const keys = await this.redis.keys(`metrics:${pattern}`)
      const metrics: Metric[] = []

      for (const key of keys) {
        const metricData = await this.redis.zrangebyscore(
          key,
          startTime,
          endTime,
          'WITHSCORES'
        )

        for (let i = 0; i < metricData.length; i += 2) {
          const data = JSON.parse(metricData[i])
          const timestamp = parseInt(metricData[i + 1])
          metrics.push({ ...data, timestamp })
        }
      }

      return metrics.sort((a, b) => a.timestamp - b.timestamp)
    } catch (error) {
      logger.error('Get metrics error:', error)
      return []
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    if (!this.redis) return []

    try {
      const alertData = await this.redis.lrange('alerts:active', 0, -1)
      return alertData.map(data => JSON.parse(data) as Alert)
    } catch (error) {
      logger.error('Get alerts error:', error)
      return []
    }
  }

  /**
   * Collect system health metrics
   */
  private async collectSystemHealth(): Promise<void> {
    try {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      const loadAvg = os.loadavg()

      const health: SystemHealth = {
        timestamp: Date.now(),
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to percentage estimate
          loadAverage: loadAvg,
        },
        memory: {
          used: memUsage.rss,
          total: os.totalmem(),
          usage: memUsage.rss / os.totalmem(),
          heap: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
          },
        },
        disk: {
          usage: 0, // Would need additional package for disk stats
          free: 0,
          total: 0,
        },
        network: {
          connections: 0, // Would need additional monitoring
          bytesIn: 0,
          bytesOut: 0,
        },
        application: {
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          nodeVersion: process.version,
          pid: process.pid,
        },
      }

      this.systemHealthCache = health

      // Record key metrics
      this.recordMetric('system_cpu_usage', health.cpu.usage, MetricType.GAUGE, {}, '%')
      this.recordMetric('system_memory_usage', health.memory.usage, MetricType.GAUGE, {}, '%')
      this.recordMetric('system_uptime', health.application.uptime, MetricType.GAUGE, {}, 's')

      // Check thresholds
      if (health.memory.usage > ADVANCED_MONITORING_CONFIG.metrics.alertThresholds.memoryUsage) {
        this.createAlert({
          name: 'High Memory Usage',
          severity: AlertSeverity.WARNING,
          message: `Memory usage is ${(health.memory.usage * 100).toFixed(1)}%`,
          source: 'system_monitor',
          tags: { usage: (health.memory.usage * 100).toFixed(1) },
        })
      }

      if (this.redis) {
        await this.redis.setex('system:health', 300, JSON.stringify(health))
      }
    } catch (error) {
      logger.error('System health collection error:', error)
    }
  }

  private async getSystemHealth(): Promise<SystemHealth | null> {
    if (this.systemHealthCache) {
      return this.systemHealthCache
    }

    if (!this.redis) return null

    try {
      const data = await this.redis.get('system:health')
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Get system health error:', error)
      return null
    }
  }

  private calculateKPIs(metrics: Metric[]): unknown {
    const responseTimeMetrics = metrics.filter(m => m.name === 'http_request_duration')
    const requestMetrics = metrics.filter(m => m.name === 'http_requests_total')
    const errorMetrics = metrics.filter(m => m.name === 'http_requests_total' && m.tags?.status?.startsWith('4') || m.tags?.status?.startsWith('5'))

    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0

    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0)
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0

    const requestsPerMinute = requestMetrics.length > 0
      ? totalRequests / (60 * 60) // Approximate for 1 hour
      : 0

    return {
      avgResponseTime,
      errorRate,
      requestsPerMinute,
      totalRequests,
      totalErrors,
    }
  }

  private aggregateMetrics(metrics: Metric[]): Record<string, any> {
    const aggregated: Record<string, any> = {}

    metrics.forEach(metric => {
      const key = `${metric.name}${metric.tags ? ':' + JSON.stringify(metric.tags) : ''}`
      
      if (!aggregated[key]) {
        aggregated[key] = {
          name: metric.name,
          type: metric.type,
          values: [],
          tags: metric.tags,
          unit: metric.unit,
        }
      }

      aggregated[key].values.push({
        timestamp: metric.timestamp,
        value: metric.value,
      })
    })

    return aggregated
  }

  private async flushBuffers(): Promise<void> {
    if (!this.redis) return

    try {
      // Flush metrics
      for (const metric of this.metricsBuffer) {
        const key = `metrics:${metric.name}`
        await this.redis.zadd(key, metric.timestamp, JSON.stringify(metric))
      }

      // Flush traces
      for (const trace of this.tracesBuffer) {
        await this.redis.lpush('traces', JSON.stringify(trace))
        await this.redis.ltrim('traces', 0, 9999) // Keep last 10k traces
      }

      // Flush alerts
      for (const alert of this.alertsBuffer) {
        await this.redis.lpush('alerts:active', JSON.stringify(alert))
      }

      // Clear buffers
      this.metricsBuffer = []
      this.tracesBuffer = []
      this.alertsBuffer = []
    } catch (error) {
      logger.error('Buffer flush error:', error)
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    if (!this.redis) return

    try {
      const cutoff = Date.now() - ADVANCED_MONITORING_CONFIG.metrics.retentionPeriod
      const keys = await this.redis.keys('metrics:*')

      for (const key of keys) {
        await this.redis.zremrangebyscore(key, 0, cutoff)
      }

      logger.error(`🧹 Cleaned up metrics older than ${new Date(cutoff).toISOString()}`)
    } catch (error) {
      logger.error('Metrics cleanup error:', error)
    }
  }

  private checkMetricThresholds(metric: Metric): void {
    // Add custom threshold checking logic here
    const thresholds = ADVANCED_MONITORING_CONFIG.metrics.alertThresholds

    if (metric.name === 'http_request_duration' && metric.value > thresholds.responseTime) {
      this.createAlert({
        name: 'Slow Response Time',
        severity: AlertSeverity.WARNING,
        message: `Response time of ${metric.value}ms exceeds threshold`,
        source: 'metric_monitor',
        tags: { metric: metric.name, value: metric.value.toString() },
      })
    }
  }

  private async sendImmediateAlert(alert: Alert): Promise<void> {
    try {
      // In production, implement actual alerting mechanisms:
      // - Webhook notifications
      // - Slack/Teams messages
      // - Email alerts
      // - PagerDuty integration
      
      logger.info(`🚨 IMMEDIATE ALERT: ${alert.message}`)
      
      // Example webhook notification
      if (ADVANCED_MONITORING_CONFIG.alerts.webhookUrl) {
        // await fetch(ADVANCED_MONITORING_CONFIG.alerts.webhookUrl, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(alert),
        // })
      }
    } catch (error) {
      logger.error('Alert sending error:', error)
    }
  }

  private generateTraceId(): string {
    return createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex')
  }

  private generateSpanId(): string {
    return createHash('md5').update(`${Date.now()}-${Math.random()}-span`).digest('hex').substring(0, 16)
  }

  private generateAlertId(): string {
    return createHash('md5').update(`${Date.now()}-${Math.random()}-alert`).digest('hex')
  }

  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] ||
           req.headers.get('x-real-ip') ||
           req.headers.get('cf-connecting-ip') ||
           'unknown'
  }
}

// Singleton instance
export const advancedMonitoringSystem = new AdvancedMonitoringSystem()

// Monitoring decorators
export function MonitorPerformance(operationName?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const trace = advancedMonitoringSystem.startTrace(operationName || `${target.constructor.name}.${propertyKey}`)
      
      try {
        const result = await originalMethod.apply(this, args)
        advancedMonitoringSystem.endTrace(trace, 'ok')
        return result
      } catch (error) {
        advancedMonitoringSystem.addTraceLog(trace, 'error', isAppError(error) ? error.message : (isAppError(error) ? error.message : (error instanceof Error ? error.message : String(error))))
        advancedMonitoringSystem.endTrace(trace, 'error')
        throw error
      }
    }

    return descriptor
  }
}

export function RecordMetric(metricName: string, type: MetricType = MetricType.COUNTER) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const startTime = performance.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - startTime
        
        advancedMonitoringSystem.recordMetric(metricName, type === MetricType.TIMER ? duration : 1, type)
        return result
      } catch (error) {
        advancedMonitoringSystem.recordMetric(`${metricName}_error`, 1, MetricType.COUNTER)
        throw error
      }
    }

    return descriptor
  }
}

// Export advanced monitoring system
export default advancedMonitoringSystem
