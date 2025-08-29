/**
 * Client-side logging utility for browser environments
 * Safe to use in React components and client-side code
 */

interface ClientLogContext {
  userId?: string
  component?: string
  operation?: string
  [key: string]: unknown
}

interface ClientLogger {
  error: (message: string, context?: ClientLogContext) => void
  warn: (message: string, context?: ClientLogContext) => void
  info: (message: string, context?: ClientLogContext) => void
  debug: (message: string, context?: ClientLogContext) => void
}

// Client-side logger that only works in the browser
export const clientLogger: ClientLogger = {
  error: (message: string, context?: ClientLogContext) => {
    if (typeof window !== 'undefined') {
      if (context) {
        console.error(`[ERROR] ${message}`, context)
      } else {
        console.error(`[ERROR] ${message}`)
      }
    }
  },

  warn: (message: string, context?: ClientLogContext) => {
    if (typeof window !== 'undefined') {
      if (context) {
        console.warn(`[WARN] ${message}`, context)
      } else {
        console.warn(`[WARN] ${message}`)
      }
    }
  },

  info: (message: string, context?: ClientLogContext) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (context) {
        console.log(`[INFO] ${message}`, context)
      } else {
        console.log(`[INFO] ${message}`)
      }
    }
  },

  debug: (message: string, context?: ClientLogContext) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (context) {
        console.debug(`[DEBUG] ${message}`, context)
      } else {
        console.debug(`[DEBUG] ${message}`)
      }
    }
  }
}

// Export as default for easier importing
export default clientLogger