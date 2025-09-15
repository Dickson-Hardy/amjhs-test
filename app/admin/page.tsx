"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import ModernAdminDashboard from './dashboard/page'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    // If not authenticated, redirect to login
    if (!session) {
      router.push("/auth/login?callbackUrl=/admin")
      return
    }
    const userRole = session.user?.role
    if (!["admin", "editor-in-chief"].includes(userRole || "")) {
      const dashboardMap: Record<string, string> = {
        "editorial-assistant": "/editorial-assistant",
        "managing-editor": "/editor/dashboard",
        "section-editor": "/editor/dashboard",
        "production-editor": "/editor/dashboard",
        "guest-editor": "/editor/dashboard",
        "editor": "/editor/dashboard",
        "reviewer": "/reviewer/dashboard",
        "author": "/dashboard",
        "user": "/dashboard",
      }
      const targetDashboard = dashboardMap[userRole || ""] || "/dashboard"
      router.push(targetDashboard)
      return
    }
  }, [session, status, router])

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Temporarily allow rendering for debugging
  // if (!session || !["admin", "editor-in-chief"].includes(session.user?.role || "")) {
  //   return null
  // }

  return <ModernAdminDashboard />
}
