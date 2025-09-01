"use client"

import EditorLayout from "@/components/layouts/editor-layout"

export default function EditorialAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EditorLayout>{children}</EditorLayout>
}