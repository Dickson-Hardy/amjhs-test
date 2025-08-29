"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { getPostAuthRedirect } from "@/lib/role-utils"
import Image from "next/image"

export default function LoginPage() {
  const { success, error: showErrorToast } = useToast()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || null
  const returnUrl = searchParams.get('returnUrl') || null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Redirect to editorial assistant login if the callback URL is for editorial assistant
  useEffect(() => {
    if (callbackUrl && callbackUrl.includes('/editorial-assistant')) {
      const redirectUrl = `/editorial-assistant/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      router.replace(redirectUrl)
    }
  }, [callbackUrl, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
 try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const errorMessage = "Invalid email or password"
        setError(errorMessage)
        showErrorToast("Sign In Failed", errorMessage);
      } else {
        // Force session refresh and get user session to determine role-based redirect
        const session = await getSession()
        
        // Debug logging
        console.log("Login session:", session)
        console.log("User role:", session?.user?.role)
        
        success("Welcome back!", "You have been successfully signed in.")
        
        // Use return URL if provided, otherwise use role-based routing
        const redirectUrl = returnUrl || getPostAuthRedirect(session)
        
        console.log("Redirecting to:", redirectUrl)
        
        // Force a hard refresh to ensure session is properly loaded
        window.location.href = redirectUrl
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again."
      setError(errorMessage)
      showErrorToast("Sign In Failed", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg border shadow-sm">
              <Image
                src="/logo-amhsj.png"
                alt="AMHSJ Logo"
                width={32}
                height={32}
                className="object-contain"
              />
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

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your AMHSJ account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john.smith@university.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>            <div className="mt-6 text-center text-sm">
              <Link 
                href="/auth/forgot-password" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-center text-gray-600">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
