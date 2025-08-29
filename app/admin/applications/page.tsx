import { Suspense } from "react"
import { Metadata } from "next"
import ApplicationsManager from "./applications-manager"

export const metadata: Metadata = {
  title: "Application Management - AMHSJ Admin",
  description: "Manage reviewer and editor applications",
}

export default function ApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage reviewer and editor applications
        </p>
      </div>

      <Suspense fallback={<ApplicationsLoadingState />}>
        <ApplicationsManager />
      </Suspense>
    </div>
  )
}

function ApplicationsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
