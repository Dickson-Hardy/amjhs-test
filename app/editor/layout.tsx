import type React from "react"

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {children}
    </div>
  )
}
