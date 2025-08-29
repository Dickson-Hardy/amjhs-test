"use client"

import { RouteGuard } from "@/components/route-guard"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ManagingEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["managing-editor", "editor-in-chief", "admin"]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RouteGuard>
  )
}
