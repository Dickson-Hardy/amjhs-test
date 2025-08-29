"use client"

import { RouteGuard } from "@/components/route-guard"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function EditorInChiefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["editor-in-chief", "admin"]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RouteGuard>
  )
}
