"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { hasRouteAccess, getRoleBasedDashboard } from "@/lib/role-utils"

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
  fallbackRoute?: string
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  allowedRoles, 
  fallbackRoute 
}: RouteGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    const userRole = session?.user?.role
    const currentPath = window.location.pathname

    // If not authenticated and trying to access protected route
    if (!session && (currentPath.startsWith("/dashboard") || currentPath.startsWith("/admin") || currentPath.startsWith("/submit"))) {
      router.push("/auth/login")
      return
    }

    // If authenticated, check role-based access
    if (session) {
      // Check if user has access to current route
      if (!hasRouteAccess(userRole, currentPath)) {
        // Redirect to appropriate dashboard based on role
        const redirectTo = fallbackRoute || getRoleBasedDashboard(userRole)
        router.push(redirectTo)
        return
      }

      // Check specific role requirements
      if (requiredRole && userRole !== requiredRole) {
        const redirectTo = fallbackRoute || getRoleBasedDashboard(userRole)
        router.push(redirectTo)
        return
      }

      // Check allowed roles
      if (allowedRoles && !allowedRoles.includes(userRole || "")) {
        const redirectTo = fallbackRoute || getRoleBasedDashboard(userRole)
        router.push(redirectTo)
        return
      }
    }
  }, [session, status, router, requiredRole, allowedRoles, fallbackRoute])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // If not authenticated and trying to access protected route, don't render children
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  if (!session && (currentPath.startsWith("/dashboard") || currentPath.startsWith("/admin") || currentPath.startsWith("/submit"))) {
    return null
  }

  // If authenticated but doesn't have access, don't render children
  if (session) {
    const userRole = session.user?.role

    if (!hasRouteAccess(userRole, currentPath)) {
      return null
    }

    if (requiredRole && userRole !== requiredRole) {
      return null
    }

    if (allowedRoles && !allowedRoles.includes(userRole || "")) {
      return null
    }
  }

  return <>{children}</>
}

export default RouteGuard
