"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  BookOpen,
  Eye,
  Calendar,
  Filter
} from "lucide-react"

interface EditorStats {
  totalSubmissions: number
  pendingReview: number
  underReview: number
  technicalCheck: number
  pendingDecision: number
  published: number
  averageReviewTime: number
}

interface Submission {
  id: string
  title: string
  author: string
  submittedDate: string
  status: string
  reviewers: number
  daysInReview: number
  priority: "high" | "medium" | "low"
}

export default function EditorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState<EditorStats>({
    totalSubmissions: 0,
    pendingReview: 0,
    underReview: 0,
    technicalCheck: 0,
    pendingDecision: 0,
    published: 0,
    averageReviewTime: 0
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState("All Sections")
  const [availableSections, setAvailableSections] = useState<string[]>(["All Sections"])

  useEffect(() => {
    if (session?.user?.id) {
      fetchEditorData()
    }
  }, [session?.user?.id, selectedSection])

  const fetchEditorData = async () => {
    try {
      setLoading(true)
      
      const sectionParam = selectedSection === "All Sections" ? "" : `?section=${encodeURIComponent(selectedSection)}`
      
      const [statsRes, submissionsRes] = await Promise.all([
        fetch(`/api/editor/stats${sectionParam}`),
        fetch(`/api/editor/submissions${sectionParam}`)
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        if (submissionsData.success) {
          setSubmissions(submissionsData.submissions.map((sub: any) => ({
            ...sub,
            priority: getPriority(sub.status, sub.daysInReview),
            daysInReview: Math.floor((Date.now() - new Date(sub.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching editor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriority = (status: string, daysInReview: number): "high" | "medium" | "low" => {
    if (status === "pending_decision" || daysInReview > 30) return "high"
    if (status === "technical_check" || daysInReview > 14) return "medium"
    return "low"
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      submitted: { label: "New Submission", color: "bg-blue-100 text-blue-800", icon: FileText },
      technical_check: { label: "Technical Check", color: "bg-purple-100 text-purple-800", icon: Eye },
      under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      pending_decision: { label: "Pending Decision", color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
      accepted: { label: "Accepted", color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle }
    }
    return configs[status as keyof typeof configs] || configs.submitted
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300", 
      low: "bg-green-100 text-green-800 border-green-300"
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const quickStats = [
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      icon: FileText,
      color: "blue"
    },
    {
      title: "Technical Check",
      value: stats.technicalCheck,
      icon: Eye,
      color: "purple"
    },
    {
      title: "Under Review",
      value: stats.underReview,
      icon: Clock,
      color: "amber"
    },
    {
      title: "Pending Decision",
      value: stats.pendingDecision,
      icon: AlertTriangle,
      color: "red"
    }
  ]

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "section-editor", "managing-editor", "editor-in-chief"]}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "section-editor", "managing-editor", "editor-in-chief"]}>
      <EditorLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Editorial Dashboard</h1>
            <p className="text-slate-600">Manage submissions and editorial workflow</p>
          </div>
          
          {/* Section Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Section:</span>
            </div>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: "from-blue-50 to-indigo-50 border-blue-200",
              purple: "from-purple-50 to-violet-50 border-purple-200",
              amber: "from-amber-50 to-yellow-50 border-amber-200",
              red: "from-red-50 to-rose-50 border-red-200"
            }
            return (
              <Card key={index} className={`bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} border-2`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                    <p className="text-sm font-medium text-slate-700">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/editor/assignments')}>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Assign Reviewers</h3>
              <p className="text-slate-600">Manage reviewer assignments</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/editor/decisions')}>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Editorial Decisions</h3>
              <p className="text-slate-600">Make final decisions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/editor/reviews')}>
            <CardContent className="p-6 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Review Progress</h3>
              <p className="text-slate-600">Track review status</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/editor/reports')}>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Section Reports</h3>
              <p className="text-slate-600">View analytics</p>
            </CardContent>
          </Card>
        </div>

        {/* Priority Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                High Priority Submissions
              </CardTitle>
              <Button variant="outline" onClick={() => router.push('/editor/submissions')}>
                View All Submissions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {submissions.filter(s => s.priority === "high").length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">All caught up!</h3>
                <p className="text-slate-600">No high priority submissions requiring immediate attention.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.filter(s => s.priority === "high").slice(0, 5).map((submission) => {
                  const statusConfig = getStatusConfig(submission.status)
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900">{submission.title}</h4>
                          <Badge className={getPriorityColor(submission.priority)} variant="outline">
                            {submission.priority} priority
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span>By {submission.author}</span>
                          <Badge className={statusConfig.color} variant="outline">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {submission.daysInReview} days in review
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {submission.reviewers} reviewers
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => router.push(`/editor/submissions/${submission.id}`)}
                      >
                        Take Action
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </EditorLayout>
    </RouteGuard>
  )
}