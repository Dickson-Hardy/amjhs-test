"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { handleError, handleApiError, handleNetworkError, handleValidationError } from '@/lib/modern-error-handler'
import { PageLoading, SectionLoading, AILoading, MedicalLoading, ContentSkeleton } from '@/components/modern-loading'
import ModernNotificationSystem from '@/components/modern-notification-system'

const ModernUXDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showSkeletons, setShowSkeletons] = useState(false)

  const demoToasts = () => {
    toast.success("Operation completed successfully!")
    
    setTimeout(() => {
      toast.warning("This is a warning message")
    }, 1000)
    
    setTimeout(() => {
      toast.error("This is an error message")
    }, 2000)
    
    setTimeout(() => {
      toast.info("Here's some helpful information")
    }, 3000)
    
    setTimeout(() => {
      toast.loading("Processing your request...")
    }, 4000)
  }

  const demoPromiseToast = async () => {
    const fakePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject(new Error("Failed!"))
      }, 3000)
    })

    toast.promise(fakePromise, {
      loading: "Processing manuscript...",
      success: "Manuscript processed successfully!",
      error: "Failed to process manuscript"
    })
  }

  const demoErrorHandling = () => {
    // Simulate different types of errors
    const errorTypes = [
      () => handleError(new Error("Sample application error"), {
        component: 'demo',
        action: 'simulate_error'
      }),
      () => handleApiError(new Response(null, { status: 404, statusText: 'Not Found' }), {
        component: 'demo',
        action: 'api_error'
      }),
      () => handleNetworkError(new Error("Network connection failed"), {
        component: 'demo',
        action: 'network_error'
      }),
      () => handleValidationError({
        email: ['Email is required', 'Email format is invalid'],
        password: ['Password must be at least 8 characters']
      }, {
        component: 'demo',
        action: 'validation_error'
      })
    ]

    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]
    randomError()
  }

  const simulateThrowError = () => {
    throw new AppError("This is a simulated error to test the error boundary!")
  }

  const demoLoadingStates = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 3000)
  }

  const toggleSkeletons = () => {
    setShowSkeletons(!showSkeletons)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Modernized UX Components Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Showcasing enhanced notifications, error handling, and loading states
          </p>
          <Badge className="bg-green-100 text-green-800">
            ✅ All Legacy logger.error() & alert() calls replaced
          </Badge>
        </div>

        {/* Notification System Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🔔 Modern Notification System
              <ModernNotificationSystem />
            </CardTitle>
            <CardDescription>
              Smart notifications with priority levels, categories, and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={demoToasts} className="w-full">
                Demo Toast Variants
              </Button>
              <Button onClick={demoPromiseToast} variant="outline" className="w-full">
                Demo Promise Toast
              </Button>
              <Button onClick={() => toast.success("Custom success message with action!", {
                action: {
                  label: "View Details",
                  onClick: () => toast.info("Action was clicked!")
                }
              })} variant="secondary" className="w-full">
                Toast with Action
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling Demo */}
        <Card>
          <CardHeader>
            <CardTitle>🚨 Modern Error Handling</CardTitle>
            <CardDescription>
              User-friendly error messages with automatic logging and reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={demoErrorHandling} variant="destructive" className="w-full">
                Random Error Demo
              </Button>
              <Button onClick={simulateThrowError} variant="outline" className="w-full">
                Test Error Boundary
              </Button>
              <Button onClick={() => {
                fetch('/api/nonexistent').catch(error => {
                  handleNetworkError(error, { component: 'demo' })
                })
              }} variant="secondary" className="w-full">
                Network Error Demo
              </Button>
              <Button onClick={() => {
                handleValidationError({
                  title: ['Title is required'],
                  content: ['Content must be at least 100 characters']
                })
              }} variant="outline" className="w-full">
                Validation Error Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading States Demo */}
        <Card>
          <CardHeader>
            <CardTitle>⏳ Modern Loading Components</CardTitle>
            <CardDescription>
              Beautiful loading states for different contexts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 mb-6">
              <Button onClick={demoLoadingStates}>
                Demo Loading States
              </Button>
              <Button onClick={toggleSkeletons} variant="outline">
                Toggle Skeletons
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <SectionLoading text="Loading..." />
                  <p className="mt-2 text-sm text-gray-600">Section Loading</p>
                </div>
                <div className="text-center">
                  <AILoading />
                  <p className="mt-2 text-sm text-gray-600">AI Processing</p>
                </div>
                <div className="text-center">
                  <MedicalLoading />
                  <p className="mt-2 text-sm text-gray-600">Medical Data</p>
                </div>
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Custom Skeleton</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Card</CardTitle>
                    <CardDescription>Normal content display</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {showSkeletons ? (
                      <ContentSkeleton />
                    ) : (
                      <div>
                        <h4 className="font-medium mb-2">Research Article Title</h4>
                        <p className="text-gray-600 mb-3">
                          This is sample content that would normally appear in a research article card.
                          It includes various elements like titles, descriptions, and metadata.
                        </p>
                        <div className="flex gap-2">
                          <Badge>Medical Research</Badge>
                          <Badge variant="outline">Peer Reviewed</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>System performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Page Load Time</span>
                        <Badge className="bg-green-100 text-green-800">1.2s</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Error Rate</span>
                        <Badge className="bg-blue-100 text-blue-800">0.1%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>User Satisfaction</span>
                        <Badge className="bg-purple-100 text-purple-800">98%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Summary */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Modernization Summary</CardTitle>
            <CardDescription>What's been improved in the UX</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ Notifications</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Smart toast system with variants</li>
                  <li>• Priority-based notifications</li>
                  <li>• Real-time notification center</li>
                  <li>• Sound & desktop alerts</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🛡️ Error Handling</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• User-friendly error messages</li>
                  <li>• Automatic error reporting</li>
                  <li>• Error boundary protection</li>
                  <li>• Structured error logging</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">⚡ Loading States</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Context-specific loaders</li>
                  <li>• Skeleton components</li>
                  <li>• AI & Medical variants</li>
                  <li>• Smooth transitions</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">🔧 Technical Improvements</h4>
              <ul className="text-sm text-amber-700 grid grid-cols-1 md:grid-cols-2 gap-1">
                <li>• Replaced all logger.error() calls</li>
                <li>• Enhanced NextAuth error handling</li>
                <li>• Modernized rate limiting</li>
                <li>• Improved API error responses</li>
                <li>• Added health check endpoints</li>
                <li>• Better TypeScript error types</li>
                <li>• Structured logging system</li>
                <li>• User-centric error messages</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ModernUXDemo
