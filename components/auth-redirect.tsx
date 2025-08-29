"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getRoleBasedDashboard } from "@/lib/role-utils"
import { useToast } from "@/components/toast-provider"

interface AuthRedirectProps {
  successMessage?: string
  redirectTo?: string
  delay?: number
}

/**
 * Automatically redirects authenticated users to their role-based dashboard
 * This can be used in auth success/error pages or after actions
 */
export function AuthRedirect({ 
  successMessage = "Redirecting to your dashboard...", 
  redirectTo,
  delay = 3000 
}: AuthRedirectProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { info } = useToast()

  useEffect(() => {
    if (status === "loading") return

    if (session) {
      const targetUrl = redirectTo || getRoleBasedDashboard(session.user?.role)
      
      info("Redirecting...", successMessage)
      
      const timer = setTimeout(() => {
        router.push(targetUrl)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [session, status, router, redirectTo, successMessage, delay, info])

  return null
}

/**
 * Hook to get role-based navigation utilities
 */
export function useRoleNavigation() {
  const { data: session } = useSession()
  const router = useRouter()

  const navigateToDashboard = () => {
    if (session) {
      const dashboardUrl = getRoleBasedDashboard(session.user?.role)
      router.push(dashboardUrl)
    } else {
      router.push("/auth/login")
    }
  }

  const navigateToAdmin = () => {
    if (session?.user?.role === "admin" || session?.user?.role === "editor") {
      router.push("/admin")
    } else {
      // Fallback to user dashboard if not admin
      navigateToDashboard()
    }
  }

  const canAccessAdmin = session?.user?.role === "admin" || session?.user?.role === "editor"
  const canAccessDashboard = !!session
  
  return {
    navigateToDashboard,
    navigateToAdmin,
    canAccessAdmin,
    canAccessDashboard,
    userRole: session?.user?.role,
    isAuthenticated: !!session,
    dashboardUrl: session ? getRoleBasedDashboard(session.user?.role) : "/auth/login"
  }
}

export default AuthRedirect
