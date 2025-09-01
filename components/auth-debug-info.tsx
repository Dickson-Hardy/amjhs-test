"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { hasRouteAccess, getRoleBasedDashboard } from "@/lib/role-utils"

export default function AuthDebugInfo() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔐 Auth Debug</h3>
      <div className="space-y-1">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Current Path:</strong> {pathname}</div>
        <div><strong>User Role:</strong> {session?.user?.role || 'None'}</div>
        <div><strong>User Email:</strong> {session?.user?.email || 'None'}</div>
        <div><strong>Has Access:</strong> {hasRouteAccess(session?.user?.role, pathname) ? '✅' : '❌'}</div>
        <div><strong>Target Dashboard:</strong> {getRoleBasedDashboard(session?.user?.role)}</div>
        <div><strong>Authenticated:</strong> {session ? '✅' : '❌'}</div>
      </div>
    </div>
  )
}