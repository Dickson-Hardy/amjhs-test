"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user?.role) {
      router.push("/auth/login")
      return
    }

    // Redirect to role-specific dashboard
    const role = session.user.role
    
    if (role === "author") {
      router.push("/author/dashboard")
    } else if (["editor", "section-editor", "managing-editor", "editor-in-chief"].includes(role)) {
      router.push("/editor/dashboard")
    } else if (role === "reviewer") {
      router.push("/reviewer/dashboard")
    } else if (role === "admin") {
      router.push("/admin/dashboard")
    } else {
      // Default to author dashboard for unknown roles
      router.push("/author/dashboard")
    }
  }, [session, status, router])

  return (
    <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
            <p className="text-slate-600">Redirecting to your personalized dashboard...</p>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  )
}