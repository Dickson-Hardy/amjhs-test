"use client"

import { RouteGuard } from "@/components/route-guard"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProductionEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["production-editor", "managing-editor", "editor-in-chief", "admin"]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RouteGuard>
  )
}
