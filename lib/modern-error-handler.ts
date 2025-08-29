/**
 * Modern Error Handling Utility
 * Replaces console.error with user-friendly notifications and proper logging
 */

import { toast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface ErrorOptions {
  showToast?: boolean
  toastTitle?: string
  toastMessage?: string
  logLevel?: 'error' | 'warn' | 'info'
  reportToService?: boolean
}

class ModernErrorHandler {
  private static instance: ModernErrorHandler
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = []
  private maxQueueSize = 100

  static getInstance(): ModernErrorHandler {
    if (!ModernErrorHandler.instance) {
      ModernErrorHandler.instance = new ModernErrorHandler()
    }
    return ModernErrorHandler.instance
  }

  /**
   * Handle errors with modern UX and proper logging
   */
  public handleError(
    error: Error | string | unknown,
    context: ErrorContext = {},
    options: ErrorOptions = {}
  ): void {
    const {
      showToast = true,
      toastTitle = 'Something went wrong',
      toastMessage,
      logLevel = 'error',
      reportToService = true
    } = options

    // Convert to Error object if needed
    const errorObj = this.normalizeError(error)
    
    // Generate error ID
    const errorId = this.generateErrorId()
    
    // Add to error queue
    this.addToQueue(errorObj, context)
    
    // Log to structured logger
    this.logError(errorObj, context, errorId, logLevel)
    
    // Show user-friendly notification
    if (showToast) {
      this.showErrorToast(errorObj, toastTitle, toastMessage, errorId)
    }
    
    // Report to error service
    if (reportToService && process.env.NODE_ENV === 'production') {
      this.reportToService(errorObj, context, errorId)
    }
  }

  /**
   * Handle API errors specifically
   */
  public handleApiError(
    response: Response,
    context: ErrorContext = {},
    customMessage?: string
  ): void {
    const statusCode = response.status
    const statusText = response.statusText
    
    let userMessage = customMessage
    let toastTitle = 'Request Failed'
    
    // Map status codes to user-friendly messages
    switch (statusCode) {
      case 400:
        userMessage = userMessage || 'Please check your input and try again'
        toastTitle = 'Invalid Request'
        break
      case 401:
        userMessage = userMessage || 'Please sign in to continue'
        toastTitle = 'Authentication Required'
        break
      case 403:
        userMessage = userMessage || 'You don\'t have permission to perform this action'
        toastTitle = 'Access Denied'
        break
      case 404:
        userMessage = userMessage || 'The requested resource was not found'
        toastTitle = 'Not Found'
        break
      case 429:
        userMessage = userMessage || 'Too many requests. Please try again later'
        toastTitle = 'Rate Limited'
        break
      case 500:
        userMessage = userMessage || 'Internal server error. Our team has been notified'
        toastTitle = 'Server Error'
        break
      default:
        userMessage = userMessage || 'An unexpected error occurred'
    }

    const error = new Error(`API Error ${statusCode}: ${statusText}`)
    
    this.handleError(error, {
      ...context,
      action: 'api_request',
      metadata: {
        ...context.metadata,
        statusCode,
        statusText,
        url: response.url
      }
    }, {
      showToast: true,
      toastTitle,
      toastMessage: userMessage
    })
  }

  /**
   * Handle promise rejections
   */
  public handlePromiseRejection(
    reason: unknown,
    context: ErrorContext = {}
  ): void {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    
    this.handleError(error, {
      ...context,
      action: 'promise_rejection'
    }, {
      showToast: true,
      toastTitle: 'Operation Failed',
      toastMessage: 'The operation could not be completed. Please try again.'
    })
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(
    error: Error,
    context: ErrorContext = {}
  ): void {
    this.handleError(error, {
      ...context,
      action: 'network_error'
    }, {
      showToast: true,
      toastTitle: 'Connection Problem',
      toastMessage: 'Please check your internet connection and try again.'
    })
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    fieldErrors: Record<string, string[]>,
    context: ErrorContext = {}
  ): void {
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ')
    
    const error = new Error(`Validation failed: ${errorMessage}`)
    
    this.handleError(error, {
      ...context,
      action: 'validation_error',
      metadata: { fieldErrors }
    }, {
      showToast: true,
      toastTitle: 'Validation Error',
      toastMessage: 'Please correct the highlighted fields and try again.'
    })
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error
    }
    
    if (typeof error === 'string') {
      return new Error(error)
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error((error as unknown).message)
    }
    
    return new Error('Unknown error occurred')
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private addToQueue(error: Error, context: ErrorContext): void {
    this.errorQueue.unshift({
      error,
      context,
      timestamp: new Date()
    })
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize)
    }
  }

  private logError(
    error: Error,
    context: ErrorContext,
    errorId: string,
    level: 'error' | 'warn' | 'info'
  ): void {
    const logData = {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (level === 'error') {
      logger.error('Application Error', logData)
    } else if (level === 'warn') {
      logger.warn('Application Warning', logData)
    } else {
      logger.info('Application Info', logData)
    }
  }

  private showErrorToast(
    error: Error,
    title: string,
    customMessage?: string,
    errorId?: string
  ): void {
    const message = customMessage || this.getGenericErrorMessage(error.message)
    
    toast.error(message, {
      title,
      description: errorId ? `Error ID: ${errorId}` : undefined,
      action: {
        label: 'Report Issue',
        onClick: () => this.openReportDialog(error, errorId)
      }
    })
  }

  private getGenericErrorMessage(originalMessage: string): string {
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'fetch': 'Network connection failed. Please check your internet connection.',
      'timeout': 'The request took too long. Please try again.',
      'parse': 'There was a problem processing the response.',
      'validation': 'Please check your input and try again.',
      'authentication': 'Please sign in to continue.',
      'authorization': 'You don\'t have permission to perform this action.',
      'not found': 'The requested resource was not found.',
      'rate limit': 'Too many requests. Please try again later.'
    }

    const lowerMessage = originalMessage.toLowerCase()
    
    for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
      if (lowerMessage.includes(key)) {
        return friendlyMessage
      }
    }

    return 'An unexpected error occurred. Our team has been notified.'
  }

  private async reportToService(
    error: Error,
    context: ErrorContext,
    errorId: string
  ): Promise<void> {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (reportError) {
      // Silent fail for error reporting
      logger.error('Failed to report error:', reportError)
    }
  }

  private openReportDialog(error: Error, errorId?: string): void {
    const subject = encodeURIComponent(`Error Report - ${errorId || 'Unknown'}`)
    const body = encodeURIComponent(
      `Error ID: ${errorId || 'Unknown'}\n` +
      `Error Message: ${error.message}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Steps to reproduce:\n1. \n2. \n3. \n\n` +
      `Expected behavior:\n\n` +
      `Actual behavior:\n\n` +
      `Additional context:\n`
    )
    
    window.open(`process.env.EMAIL_FROMsupport@amhsj.com?subject=${subject}&body=${body}`)
  }

  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(limit = 10): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    return this.errorQueue.slice(0, limit)
  }

  /**
   * Clear error queue
   */
  public clearErrors(): void {
    this.errorQueue = []
  }
}

// Singleton instance
export const errorHandler = ModernErrorHandler.getInstance()

// Convenience functions
export const handleError = (error: unknown, context?: ErrorContext, options?: ErrorOptions) => {
  errorHandler.handleError(error, context, options)
}

export const handleApiError = (response: Response, context?: ErrorContext, message?: string) => {
  errorHandler.handleApiError(response, context, message)
}

export const handleNetworkError = (error: Error, context?: ErrorContext) => {
  errorHandler.handleNetworkError(error, context)
}

export const handleValidationError = (errors: Record<string, string[]>, context?: ErrorContext) => {
  errorHandler.handleValidationError(errors, context)
}

// Setup global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handlePromiseRejection(event.reason, {
      action: 'unhandled_promise_rejection'
    })
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), {
      action: 'global_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })
}

export default ModernErrorHandler
