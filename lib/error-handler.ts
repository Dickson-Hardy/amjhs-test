// lib/error-handler.ts - Centralized error handling

import { logger } from './logger'

export interface ErrorContext {
  operation?: string
  userId?: string
  resourceId?: string
  endpoint?: string
  metadata?: Record<string, any>
}

export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static handleError(error: Error | unknown, context: ErrorContext = {}): void {
    const errorMessage = isAppError(error) ? error.message : (isAppError(error) ? error.message : (error instanceof Error ? error.message : String(error)))
    
    logger.error(`Error in ${context.operation || 'unknown operation'}: ${errorMessage}`, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    message: string, 
    statusCode: number = 500, 
    context: ErrorContext = {}
  ): { success: false; error: string; statusCode: number } {
    this.handleError(new Error(message), context)
    
    return {
      success: false,
      error: message,
      statusCode
    }
  }

  /**
   * Handle async operations with consistent error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const result = await operation()
      return { success: true, data: result }
    } catch (error) {
      this.handleError(error, context)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Validate required environment variables
   */
  static validateEnvironment(requiredVars: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = []
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    }
  }

  /**
   * Create user-friendly error messages
   */
  static getUserFriendlyMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      // Map technical errors to user-friendly messages
      const errorMap: Record<string, string> = {
        'ValidationError': 'The provided data is invalid. Please check your input and try again.',
        'AuthenticationError': 'Authentication failed. Please log in again.',
        'AuthorizationError': 'You do not have permission to perform this action.',
        'NotFoundError': 'The requested resource was not found.',
        'DatabaseError': 'A database error occurred. Please try again later.',
        'NetworkError': 'A network error occurred. Please check your connection and try again.'
      }
      
      return errorMap[error.name] || 'An unexpected error occurred. Please try again later.'
    }
    
    return 'An unexpected error occurred. Please try again later.'
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handleError.bind(ErrorHandler)
export const createErrorResponse = ErrorHandler.createErrorResponse.bind(ErrorHandler)
export const handleAsync = ErrorHandler.handleAsync.bind(ErrorHandler)
export const validateEnvironment = ErrorHandler.validateEnvironment.bind(ErrorHandler)
export const getUserFriendlyMessage = ErrorHandler.getUserFriendlyMessage.bind(ErrorHandler) 