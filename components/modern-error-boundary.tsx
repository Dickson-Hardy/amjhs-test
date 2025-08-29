"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  resetError: () => void
  errorId: string
}

class ModernErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({
      error,
      errorInfo,
      errorId
    })

    // Log error to monitoring service
    this.logError(error, errorInfo, errorId)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Show user-friendly toast notification
    toast.error(
      'Something went wrong. Our team has been notified and is working on a fix.',
      {
        title: 'Application Error',
        action: {
          label: 'Retry',
          onClick: () => this.handleReset()
        }
      }
    )
  }

  private logError = async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
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
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (logError) {
      logger.error('Failed to log error:', logError)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          resetError={this.handleReset}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`)
    const body = encodeURIComponent(
      `Error ID: ${errorId}\n\nError Message: ${error.message}\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:\n\nAdditional context:\n`
    )
    window.open(`process.env.EMAIL_FROMsupport@amhsj.com?subject=${subject}&body=${body}`)
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            We're sorry for the inconvenience. Our team has been automatically notified.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Error ID</span>
              <Badge variant="outline" className="font-mono text-xs">
                {errorId}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Reference this ID when contacting support for faster assistance.
            </p>
          </div>

          {isDevelopment && (
            <details className="bg-red-50 rounded-lg p-4 border border-red-200">
              <summary className="cursor-pointer font-medium text-red-800 mb-2">
                Developer Details
              </summary>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                    {error.stack}
                  </pre>
                </div>
                {errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleReportBug}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </Button>
            
            <Button
              onClick={() => window.open('process.env.EMAIL_FROMsupport@amhsj.com')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p>
              If this problem persists, please contact our support team at{' '}
              <a 
                href="process.env.EMAIL_FROMsupport@amhsj.com" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                support@amhsj.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<ErrorFallbackProps>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  }
) {
  const WrappedComponent = (props: P) => (
    <ModernErrorBoundary fallback={options?.fallback} onError={options?.onError}>
      <Component {...props} />
    </ModernErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ModernErrorBoundary
export type { ErrorBoundaryProps, ErrorFallbackProps }
