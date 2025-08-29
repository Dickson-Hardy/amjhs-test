"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft, Cpu, Wifi } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "general"
  const error = searchParams.get("error")
  const email = searchParams.get("email")

  const getContent = () => {
    switch (type) {
      case "registration":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Registration Failed",
          description: "We couldn't create your account",
          message: error || "There was an error creating your account. Please try again.",
          actionText: "Try Again",
          actionHref: "/auth/signup",
          showRetry: true
        }
      case "verification":
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: "Verification Failed",
          description: "Email verification unsuccessful",
          message: error || "The verification link is invalid or has expired. Please request a new verification email.",
          actionText: "Resend Verification",
          actionHref: "/auth/resend-verification",
          showRetry: true
        }
      case "login":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Sign In Failed",
          description: "Unable to sign you in",
          message: error || "Invalid email or password. Please check your credentials and try again.",
          actionText: "Try Again",
          actionHref: "/auth/login",
          showRetry: true
        }
      case "password-reset":
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: "Password Reset Failed",
          description: "Unable to reset your password",
          message: error || "The password reset link is invalid or has expired. Please request a new reset link.",
          actionText: "Request New Link",
          actionHref: "/auth/reset-password",
          showRetry: true
        }
      case "expired":
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: "Link Expired",
          description: "This link is no longer valid",
          message: "The verification or reset link has expired. Please request a new one.",
          actionText: "Get New Link",
          actionHref: "/auth/resend-verification",
          showRetry: true
        }
      default:
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Something Went Wrong",
          description: "An unexpected error occurred",
          message: error || "We encountered an unexpected error. Please try again later.",
          actionText: "Go Home",
          actionHref: "/",
          showRetry: false
        }
    }
  }

  const content = getContent()

  const getErrorDetails = () => {
    const commonErrors: Record<string, string> = {
      "CredentialsSignin": "Invalid email or password. Please check your credentials.",
      "EmailNotVerified": "Please verify your email address before signing in.",
      "UserNotFound": "No account found with this email address.",
      "EmailInUse": "An account with this email already exists.",
      "WeakPassword": "Password must be at least 8 characters long.",
      "InvalidToken": "The verification link is invalid or has expired.",
      "TokenExpired": "The verification link has expired. Please request a new one.",
      "NetworkError": "Connection error. Please check your internet connection.",
    }

    if (error && commonErrors[error]) {
      return commonErrors[error]
    }
    return null
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Cpu className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="font-bold text-2xl text-gray-800">AMHSJ</div>
              <div className="text-sm text-gray-600 flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                Medical Research Journal
              </div>
            </div>
          </Link>
        </div>

        <Card className="border-red-200">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {content.icon}
            </div>
            <div>
              <CardTitle className="text-2xl text-red-700">{content.title}</CardTitle>
              <CardDescription className="text-red-600">
                {content.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 leading-relaxed">
                {errorDetails || content.message}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error code: {error}
                </AlertDescription>
              </Alert>
            )}

            {type === "verification" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Need a new verification email?</p>
                  <p className="text-blue-600">
                    {email ? `We can send a new verification email to ${email}` : "Enter your email to receive a new verification link"}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {content.showRetry && (
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Link href={content.actionHref}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {content.actionText}
                  </Link>
                </Button>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {type === "login" && (
              <div className="text-center text-sm space-y-2">
                <Link 
                  href="/auth/reset-password" 
                  className="text-indigo-600 hover:text-indigo-700 block"
                >
                  Forgot your password?
                </Link>
                <div>
                  <span className="text-gray-500">Don't have an account? </span>
                  <Link 
                    href="/auth/signup" 
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Still having trouble?{" "}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
