/**
 * Standardized Logging Utility for AMHSJ
 * Provides consistent logging across all API routes and services
 */

interface LogContext {
  userId?: string
  endpoint?: string
  operation?: string
  requestId?: string
  ip?: string
  userAgent?: string
  duration?: number
  error?: unknown
  [key: string]: unknown
}

interface Logger {
  error: (message: string, context?: LogContext) => void
  warn: (message: string, context?: LogContext) => void
  info: (message: string, context?: LogContext) => void
  debug: (message: string, context?: LogContext) => void
  auth: (message: string, userId?: string, action?: string) => void
  api: (message: string, context?: LogContext) => void
  security: (message: string, context?: LogContext) => void
}

// Edge Runtime compatible logger using console methods
function formatLogMessage(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context && Object.keys(context).length ? ` | ${JSON.stringify(context)}` : ''
  return `${timestamp} [${level.toUpperCase()}]: ${message}${contextStr}`
}

function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug"
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }
  return levels[level] >= levels[logLevel as keyof typeof levels]
}

const logger: Logger = {
  error: (message: string, context?: LogContext) => {
    if (shouldLog('error')) {
      console.error(formatLogMessage('error', message, context))
    }
  },
  warn: (message: string, context?: LogContext) => {
    if (shouldLog('warn')) {
      console.warn(formatLogMessage('warn', message, context))
    }
  },
  info: (message: string, context?: LogContext) => {
    if (shouldLog('info')) {
      console.log(formatLogMessage('info', message, context))
    }
  },
  debug: (message: string, context?: LogContext) => {
    if (shouldLog('debug')) {
      console.log(formatLogMessage('debug', message, context))
    }
  },
  auth: (message: string, userId?: string, action?: string) => {
    if (shouldLog('info')) {
      console.log(formatLogMessage('info', `[AUTH] ${message}`, { userId, action, category: 'authentication' }))
    }
  },
  api: (message: string, context?: LogContext) => {
    if (shouldLog('info')) {
      console.log(formatLogMessage('info', `[API] ${message}`, { ...context, category: 'api' }))
    }
  },
  security: (message: string, context?: LogContext) => {
    if (shouldLog('warn')) {
      console.warn(formatLogMessage('warn', `[SECURITY] ${message}`, { ...context, category: 'security' }))
    }
  }
}

export { logger }

// Backward compatibility functions
export function logError(error: Error, context?: unknown) {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  })
}

export function logInfo(message: string, data?: unknown) {
  logger.info(message, {
    ...(typeof data === 'object' && data !== null ? data as Record<string, unknown> : { data }),
    timestamp: new Date().toISOString()
  })
}

export function logWarn(message: string, data?: unknown) {
  logger.warn(message, {
    ...(typeof data === 'object' && data !== null ? data as Record<string, unknown> : { data }),
    timestamp: new Date().toISOString()
  })
}

// Additional convenience logging functions
export function logAuth(message: string, userId?: string, action?: string) {
  logger.auth(message, userId, action)
}

export function logEmail(message: string, recipient?: string, status?: string) {
  logger.info(`EMAIL: ${message}`, { 
    recipient, 
    status, 
    category: 'email' 
  })
}

export function logSystem(message: string, metric?: string, value?: unknown) {
  logger.info(`SYSTEM: ${message}`, { 
    metric, 
    value, 
    category: 'system' 
  })
}

export function logSecurity(message: string, context?: LogContext) {
  logger.security(message, context)
}

export function logApi(message: string, context?: LogContext) {
  logger.api(message, context)
}

// Default export for easy importing
export default logger

export function logAdmin(message: string, adminId?: string, action?: string, target?: string) {
  logInfo(`ADMIN: ${message}`, { adminId, action, target, type: 'admin_action' })
}
