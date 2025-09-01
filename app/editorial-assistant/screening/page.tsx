"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Calendar, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { RouteGuard } from "@/components/route-guard"

interface Submission {
  id: string
  status: string
  title: string
  createdAt: string
  authorId: string
  authorName?: string
  lastScreeningId?: string
  requiresScreening?: boolean
}

export default function ScreeningDashboard() {
  const { data: session } = useSession()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingSubmissions()
  }, [])

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/editorial-assistant/submissions?filter=pending_screening')
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'screening':
        return 'bg-yellow-100 text-yellow-800'
      case 'screening_completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <RouteGuard allowedRoles={["editorial-assistant", "admin", "managing-editor", "editor-in-chief"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manuscript Screening Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and screen submitted manuscripts for initial assessment</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading submissions...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && submissions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions to screen</h3>
              <p className="text-gray-600">All submissions have been processed or there are no pending submissions.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="grid gap-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{submission.title || 'Untitled Submission'}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <User className="h-4 w-4 mr-1" />
                        {submission.authorName || 'Author not specified'}
                        <Calendar className="h-4 w-4 ml-4 mr-1" />
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Submission ID: {submission.id.slice(0, 8)}...
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/editorial-assistant/screening/${submission.id}`}>
                        <Button>
                          <FileText className="h-4 w-4 mr-2" />
                          Screen Manuscript
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  )
}