"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Stethoscope } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { getPostAuthRedirect } from "@/lib/role-utils"

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
    <div className="min-h-screen flex">
      {/* Left Side - Purple Gradient with Curves */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800">
        {/* Flowing Curves Background */}
        <div className="absolute inset-0">
          <svg className="absolute w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                <stop offset="100%" stopColor="rgba(196, 181, 253, 0.3)" />
              </linearGradient>
            </defs>
            
            {/* Flowing curves */}
            <path d="M0,200 Q200,100 400,200 T800,200 L800,400 Q600,300 400,400 T0,400 Z" fill="url(#gradient1)" />
            <path d="M0,400 Q200,300 400,400 T800,400 L800,600 Q600,500 400,600 T0,600 Z" fill="url(#gradient2)" />
            <path d="M0,600 Q200,500 400,600 T800,600 L800,800 L0,800 Z" fill="rgba(147, 51, 234, 0.2)" />
          </svg>
        </div>
        
        {/* Logo and branding on left side */}
        <div className="relative z-10 flex flex-col justify-center items-start p-16 h-full text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">AMHSJ</div>
                <div className="text-lg font-semibold">MEDICAL RESEARCH</div>
                <div className="text-lg font-semibold">JOURNAL</div>
                <div className="text-sm opacity-90 mt-1">Advanced Healthcare Sciences</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - White Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          </div>

          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-base"
              >
                {isLoading ? "Signing In..." : "Login"}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              <span>Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign up
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500 mt-8">
              ©2025 AMHSJ
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
