"use client"

import { logger } from "@/lib/logger";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useCallback } from "react"
import { getRoleBasedDashboard } from "@/lib/role-utils"

/**
 * Custom hook to handle session refresh and role-based redirects
 */
export function useSessionRefresh() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  // Force session refresh
  const refreshSession = useCallback(async () => {
    try {
      logger.info("Refreshing session...")
      await update()
    } catch (error) {
      logger.error("Failed to refresh session:", error)
    }
  }, [update])

  // Check for role changes and redirect if necessary
  const checkRoleAndRedirect = useCallback(() => {
    if (session?.user?.role) {
      const currentPath = window.location.pathname
      const expectedDashboard = getRoleBasedDashboard(session.user.role)
      
      // If we're on a dashboard route but not the correct one for this role
      if (currentPath.startsWith('/dashboard') || 
          currentPath.startsWith('/admin') || 
          currentPath.startsWith('/editor') || 
          currentPath.startsWith('/reviewer')) {
        
        // Check if current path matches expected role
        const isCorrectRole = currentPath.startsWith(expectedDashboard)
        
        if (!isCorrectRole) {
          logger.info(`Role mismatch detected. Current: ${currentPath}, Expected: ${expectedDashboard}`)
          logger.info(`Redirecting user with role ${session.user.role} to correct dashboard`)
          router.replace(expectedDashboard)
        }
      }
    }
  }, [session, router])

  // Auto-refresh session periodically to catch role changes
  useEffect(() => {
    if (status === "authenticated") {
      const interval = setInterval(() => {
        refreshSession()
      }, 60000) // Refresh every minute

      return () => clearInterval(interval)
    }
  }, [status, refreshSession])

  // Check role on session changes
  useEffect(() => {
    if (session) {
      checkRoleAndRedirect()
    }
  }, [session, checkRoleAndRedirect])

  return {
    session,
    status,
    refreshSession,
    checkRoleAndRedirect
  }
}
