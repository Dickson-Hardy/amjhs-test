import type React from "react"

export default function ReviewerLayout({
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
