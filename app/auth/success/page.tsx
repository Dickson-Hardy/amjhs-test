"use client"

import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, ArrowRight, Cpu, Wifi } from "lucide-react"
import { getRoleBasedDashboard } from "@/lib/role-utils"

export default function AuthSuccessPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const type = searchParams.get("type") || "registration"
  const email = searchParams.get("email")

  const getContent = () => {
    switch (type) {
      case "registration":
        return {
          icon: <Mail className="h-16 w-16 text-green-500" />,
          title: "Registration Successful!",
          description: "Thank you for joining AMHSJ",
          message: email            ? `We've sent a verification email to ${email}. Please check your inbox and click the verification link to activate your account.`
            : "We've sent a verification email to your email address. Please check your inbox and click the verification link to activate your account.",
          actionText: "Continue to Login",
          actionHref: "/auth/login"
        };
        
        case "verification":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Email Verified!",
          description: "Your account has been successfully verified",
          message: "You can now sign in to your AMHSJ account and start submitting your medical research.",
          actionText: session ? "Go to Dashboard" : "Sign In Now",
          actionHref: session ? getRoleBasedDashboard(session.user?.role) : "/auth/login"
        }
      case "password-reset":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Password Reset Successful!",
          description: "Your password has been updated",
          message: "You can now sign in with your new password.",
          actionText: session ? "Go to Dashboard" : "Sign In",
          actionHref: session ? getRoleBasedDashboard(session.user?.role) : "/auth/login"
        }
      default:
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Success!",
          description: "Action completed successfully",
          message: "Your request has been processed.",
          actionText: "Continue",
          actionHref: "/"
        }
    }
  }

  const content = getContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
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

        <Card className="border-green-200">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {content.icon}
            </div>
            <div>
              <CardTitle className="text-2xl text-green-700">{content.title}</CardTitle>
              <CardDescription className="text-green-600">
                {content.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 leading-relaxed">
                {content.message}
              </p>
            </div>

            {type === "registration" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Check your email</p>
                    <p className="text-blue-600">
                      Don't see the email? Check your spam folder or{" "}
                      <button className="underline hover:no-underline">
                        resend verification email
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                asChild 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Link href={content.actionHref}>
                  {content.actionText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
