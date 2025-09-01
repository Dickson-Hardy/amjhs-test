"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
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
  const pathname = usePathname()
  const redirectingRef = useRef(false)

  useEffect(() => {
    // Prevent redirect loops
    if (redirectingRef.current || status === "loading") return

    const userRole = session?.user?.role
    const currentPath = pathname

    console.log('RouteGuard:', { 
      status, 
      userRole, 
      currentPath, 
      isAuthenticated: !!session 
    })

    // If not authenticated and trying to access protected route
    if (!session && isProtectedRoute(currentPath)) {
      const loginUrl = currentPath.startsWith("/editorial-assistant") 
        ? "/editorial-assistant/login" 
        : "/auth/login"
      
      if (currentPath !== loginUrl) {
        console.log('Redirecting to login:', loginUrl)
        redirectingRef.current = true
        router.push(loginUrl)
        return
      }
    }

    // If authenticated, check role-based access
    if (session && userRole) {
      // Skip redirect if user is already on their correct dashboard
      const targetDashboard = getRoleBasedDashboard(userRole)
      if (currentPath === targetDashboard) {
        return
      }

      // Check if user has access to current route
      if (!hasRouteAccess(userRole, currentPath)) {
        const redirectTo = fallbackRoute || targetDashboard
        if (currentPath !== redirectTo) {
          console.log('No route access, redirecting to:', redirectTo)
          redirectingRef.current = true
          router.push(redirectTo)
          return
        }
      }

      // Check specific role requirements
      if (requiredRole && userRole !== requiredRole) {
        const redirectTo = fallbackRoute || targetDashboard
        if (currentPath !== redirectTo) {
          console.log('Role requirement not met, redirecting to:', redirectTo)
          redirectingRef.current = true
          router.push(redirectTo)
          return
        }
      }

      // Check allowed roles
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        const redirectTo = fallbackRoute || targetDashboard
        if (currentPath !== redirectTo) {
          console.log('Role not in allowed list, redirecting to:', redirectTo)
          redirectingRef.current = true
          router.push(redirectTo)
          return
        }
      }
    }

    // Reset redirecting flag after successful check
    redirectingRef.current = false
  }, [session, status, pathname, router, requiredRole, allowedRoles, fallbackRoute])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // If not authenticated and trying to access protected route, don't render children
  if (!session && isProtectedRoute(pathname)) {
    return null
  }

  // If authenticated but doesn't have access, don't render children during redirect
  if (session && redirectingRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // If authenticated but doesn't have access, don't render children
  if (session) {
    const userRole = session.user?.role

    if (!hasRouteAccess(userRole, pathname)) {
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

function isProtectedRoute(path: string): boolean {
  return path.startsWith("/dashboard") || 
         path.startsWith("/admin") || 
         path.startsWith("/submit") || 
         path.startsWith("/editorial-assistant") ||
         path.startsWith("/editor") ||
         path.startsWith("/reviewer")
}

export default RouteGuard
