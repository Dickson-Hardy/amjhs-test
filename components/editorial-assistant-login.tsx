"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ClipboardCheck, Users, FileText, Shield } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import Image from "next/image"

interface EditorialAssistantLoginProps {
  onSuccess?: () => void
  redirectTo?: string
}

export default function EditorialAssistantLogin({ onSuccess, redirectTo }: EditorialAssistantLoginProps) {
  const { success, error: showErrorToast } = useToast()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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
        showErrorToast("Sign In Failed", errorMessage)
      } else {
        // Force session refresh and get user session
        const session = await getSession()
        
        // Check if user is actually an editorial assistant
        if (session?.user?.role !== "editorial-assistant") {
          const errorMessage = "Access denied. This login is for editorial assistants only."
          setError(errorMessage)
          showErrorToast("Access Denied", errorMessage)
          return
        }

        success("Welcome back!", "You have been successfully signed in as Editorial Assistant.")
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
        
        // Redirect to editorial assistant dashboard or specified redirect
        const targetUrl = redirectTo || callbackUrl || "/editorial-assistant"
        router.push(targetUrl)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3">
            <div className="bg-white p-3 rounded-xl border shadow-lg">
              <ClipboardCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-3xl text-gray-800">Editorial Assistant</div>
              <div className="text-sm text-gray-600">AMHSJ Manuscript Screening</div>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-800">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in to access manuscript screening and editorial workflow management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="editorial.assistant@amhsj.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? "Signing In..." : "Sign In to Editorial Assistant"}
              </Button>
            </form>

            {/* Editorial Assistant Features */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Editorial Assistant Capabilities:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClipboardCheck className="h-4 w-4 text-blue-500" />
                  <span>Initial manuscript screening</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>Associate editor assignment</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>Quality assessment</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <span>Workflow management</span>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500">
              <p>Need help? Contact the managing editor</p>
              <p className="mt-1">
                <a 
                  href="mailto:managing@amhsj.org" 
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  managing@amhsj.org
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
