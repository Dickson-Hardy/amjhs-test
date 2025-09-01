"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Session Status:</h3>
            <p className="text-sm text-gray-600">Status: {status}</p>
            <p className="text-sm text-gray-600">
              Authenticated: {session ? "✅ Yes" : "❌ No"}
            </p>
          </div>

          {session ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">User Info:</h3>
                <p className="text-sm text-gray-600">Email: {session.user?.email}</p>
                <p className="text-sm text-gray-600">Name: {session.user?.name}</p>
                <p className="text-sm text-gray-600">Role: {session.user?.role}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Quick Navigation:</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Dashboard
                  </Button>
                  
                  {["admin", "editor-in-chief"].includes(session.user?.role || "") && (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin")}
                    >
                      Admin Dashboard
                    </Button>
                  )}
                  
                  {["editorial-assistant", "admin", "editor-in-chief", "managing-editor"].includes(session.user?.role || "") && (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/editorial-assistant")}
                    >
                      Editorial Assistant
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                  >
                    Home
                  </Button>
                </div>
              </div>

              <Button 
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Sign In Options:</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use your credentials to sign in and test the authentication flow.
                </p>
                
                <Button
                  onClick={() => signIn("credentials", { callbackUrl: "/auth-test" })}
                >
                  Sign In with Credentials
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Sign in with your credentials</li>
              <li>2. Try navigating to different dashboards based on your role</li>
              <li>3. Check the debug info in the bottom-right corner</li>
              <li>4. Verify no redirect loops occur</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}