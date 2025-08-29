"use client"

import { RouteGuard } from "@/components/route-guard"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function GuestEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["guest-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RouteGuard>
  )
}
