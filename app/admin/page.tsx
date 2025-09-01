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

    // Debug: Log the user role
    const userRole = session.user?.role
    console.log('Admin page - User role:', userRole, 'Session:', session.user)
    
    // Debug: Show user role and allow access temporarily
    console.log('User role check:', {
      userRole,
      isAdmin: userRole === 'admin',
      isEditorInChief: userRole === 'editor-in-chief',
      allowedRoles: ['admin', 'editor-in-chief'],
      hasAccess: ["admin", "editor-in-chief"].includes(userRole || "")
    })
    
    // Temporarily commented out redirect to debug
    // if (!["admin", "editor-in-chief"].includes(userRole || "")) {
    //   console.log('Access denied - redirecting user with role:', userRole)
    //   const dashboardMap: Record<string, string> = {
    //     "editorial-assistant": "/editorial-assistant",
    //     "managing-editor": "/editor/dashboard",
    //     "section-editor": "/editor/dashboard",
    //     "production-editor": "/editor/dashboard",
    //     "guest-editor": "/editor/dashboard",
    //     "editor": "/editor/dashboard",
    //     "reviewer": "/reviewer/dashboard",
    //     "author": "/dashboard",
    //     "user": "/dashboard"
    //   }
    //   
    //   const targetDashboard = dashboardMap[userRole || ""] || "/dashboard"
    //   router.push(targetDashboard)
    //   return
    // }
    
    console.log('Admin access granted for role:', userRole)
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

  return (
    <div>
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded mb-4">
        <h3 className="font-bold">Debug Info:</h3>
        <p>User Role: {session?.user?.role}</p>
        <p>User Email: {session?.user?.email}</p>
        <p>Session: {JSON.stringify(session?.user, null, 2)}</p>
      </div>
      <ModernAdminDashboard />
    </div>
  )
}
