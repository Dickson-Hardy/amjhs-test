import * as Sentry from "@sentry/nextjs"

export function initializeMonitoring() {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out sensitive information
        if (event.request?.headers) {
          delete event.request.headers.authorization
          delete event.request.headers.cookie
        }
        return event
      },
    })
  }
}

export function captureException(error: Error, context?: unknown) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || "unknown",
        action: context?.action || "unknown",
      },
      extra: context,
    })
  } else {
    logger.error("Error captured:", error, context)
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, level)
  } else {
    logger.info(`[${level.toUpperCase()}] ${message}`)
  }
}

export function setUserContext(user: { id: string; email: string; role: string }) {
  if (process.env.NODE_ENV === "production") {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }
}
