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

let logger: Logger

// Only initialize winston on the server side
if (typeof window === 'undefined') {
  try {
    const winston = require('winston')
    
    const winstonLogger = winston.createLogger({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, ...meta }: unknown) => {
          const contextStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${level.toUpperCase()}]: ${message}${contextStr}`
        })
      ),
      defaultMeta: { 
        service: "amhsj",
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: [
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
        new winston.transports.File({ filename: "logs/audit.log", level: "info" }),
        new winston.transports.File({ filename: "logs/auth.log", level: "info" }),
        new winston.transports.File({ filename: "logs/security.log", level: "warn" }),
      ],
    })

    if (process.env.NODE_ENV !== "production") {
      winstonLogger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      )
    }

    logger = {
      error: (message: string, context?: LogContext) => {
        winstonLogger.error(message, context)
      },
      warn: (message: string, context?: LogContext) => {
        winstonLogger.warn(message, context)
      },
      info: (message: string, context?: LogContext) => {
        winstonLogger.info(message, context)
      },
      debug: (message: string, context?: LogContext) => {
        winstonLogger.debug(message, context)
      },
      auth: (message: string, userId?: string, action?: string) => {
        winstonLogger.info(`[AUTH] ${message}`, { userId, action, category: 'authentication' })
      },
      api: (message: string, context?: LogContext) => {
        winstonLogger.info(`[API] ${message}`, { ...context, category: 'api' })
      },
      security: (message: string, context?: LogContext) => {
        winstonLogger.warn(`[SECURITY] ${message}`, { ...context, category: 'security' })
      }
    }
  } catch (error) {
    // Fallback if winston is not available
    logger = {
      error: (message: string, context?: LogContext) => console.error(`[ERROR] ${message}`, context),
      warn: (message: string, context?: LogContext) => console.warn(`[WARN] ${message}`, context),
      info: (message: string, context?: LogContext) => console.log(`[INFO] ${message}`, context),
      debug: (message: string, context?: LogContext) => console.log(`[DEBUG] ${message}`, context),
      auth: (message: string, userId?: string, action?: string) => console.log(`[AUTH] ${message}`, { userId, action }),
      api: (message: string, context?: LogContext) => console.log(`[API] ${message}`, context),
      security: (message: string, context?: LogContext) => console.warn(`[SECURITY] ${message}`, context)
    }
  }
} else {
  // Client-side logger - only log in development
  const isDev = process.env.NODE_ENV === 'development'
  
  logger = {
    error: (message: string, context?: LogContext) => {
      if (isDev) console.error(`[ERROR] ${message}`, context)
    },
    warn: (message: string, context?: LogContext) => {
      if (isDev) console.warn(`[WARN] ${message}`, context)
    },
    info: (message: string, context?: LogContext) => {
      if (isDev) console.log(`[INFO] ${message}`, context)
    },
    debug: (message: string, context?: LogContext) => {
      if (isDev) console.log(`[DEBUG] ${message}`, context)
    },
    auth: (message: string, userId?: string, action?: string) => {
      if (isDev) console.log(`[AUTH] ${message}`, { userId, action })
    },
    api: (message: string, context?: LogContext) => {
      if (isDev) console.log(`[API] ${message}`, context)
    },
    security: (message: string, context?: LogContext) => {
      if (isDev) console.warn(`[SECURITY] ${message}`, context)
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
