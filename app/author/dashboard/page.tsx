"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProfileCompletionAlert } from "@/components/profile-completion-alert"
import {
  FileText,
  Clock,
  CheckCircle,
  Award,
  AlertCircle,
  ArrowRight,
  Plus,
  TrendingUp,
  BookOpen,
  Download,
  Star
} from "lucide-react"

interface AuthorStats {
  totalSubmissions: number
  underReview: number
  published: number
  totalDownloads: number
  averageCitations: number
  hIndex: number
}

interface Submission {
  id: string
  title: string
  category: string
  submittedDate: string
  status: string
  progress: number
  actionRequired: boolean
}

export default function AuthorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState<AuthorStats>({
    totalSubmissions: 0,
    underReview: 0,
    published: 0,
    totalDownloads: 0,
    averageCitations: 0,
    hIndex: 0
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [profileCompleteness, setProfileCompleteness] = useState(0)

  useEffect(() => {
    if (session?.user?.id) {
      fetchAuthorData()
    }
  }, [session?.user?.id])

  const fetchAuthorData = async () => {
    try {
      setLoading(true)
      const userId = session?.user?.id

      const [statsRes, submissionsRes, profileRes] = await Promise.all([
        fetch(`/api/users/${userId}/stats`),
        fetch(`/api/users/${userId}/submissions`),
        fetch(`/api/user/profile`)
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
            progress: getSubmissionProgress(sub.status),
            actionRequired: sub.status === 'revision_requested'
          })))
        }
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success) {
          setProfileCompleteness(profileData.profile.profileCompleteness || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching author data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionProgress = (status: string): number => {
    switch (status) {
      case "submitted": return 25
      case "technical_check": return 40
      case "under_review": return 60
      case "revision_requested": return 75
      case "accepted": return 100
      case "published": return 100
      default: return 0
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: Clock },
      technical_check: { label: "Technical Check", color: "bg-purple-100 text-purple-800", icon: FileText },
      under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      revision_requested: { label: "Revision Requested", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
      accepted: { label: "Accepted", color: "bg-green-100 text-green-800", icon: CheckCircle },
      published: { label: "Published", color: "bg-green-100 text-green-800", icon: BookOpen }
    }
    return configs[status as keyof typeof configs] || configs.submitted
  }

  const quickStats = [
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      icon: FileText,
      color: "blue"
    },
    {
      title: "Under Review",
      value: stats.underReview,
      icon: Clock,
      color: "amber"
    },
    {
      title: "Published",
      value: stats.published,
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "H-Index",
      value: stats.hIndex,
      icon: Award,
      color: "purple"
    }
  ]

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Author Dashboard</h1>
          <p className="text-slate-600">Welcome back, {session?.user?.name}! Track your research submissions and impact.</p>
        </div>

        {/* Profile Completion Alert */}
        <ProfileCompletionAlert 
          profileCompleteness={profileCompleteness}
          profileData={null}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: "from-blue-50 to-indigo-50 border-blue-200",
              amber: "from-amber-50 to-yellow-50 border-amber-200", 
              green: "from-green-50 to-emerald-50 border-green-200",
              purple: "from-purple-50 to-violet-50 border-purple-200"
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

        {/* Action Required */}
        {submissions.filter(s => s.actionRequired).length > 0 && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>You have {submissions.filter(s => s.actionRequired).length} submissions requiring action.</span>
                <Button size="sm" variant="destructive">
                  Review Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/author/submit')}>
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Submit New Article</h3>
              <p className="text-slate-600">Start a new manuscript submission</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/author/submissions')}>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">My Submissions</h3>
              <p className="text-slate-600">Track all your submissions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">View Analytics</h3>
              <p className="text-slate-600">See your research impact</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Submissions</CardTitle>
              <Button variant="outline" onClick={() => router.push('/author/submissions')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No submissions yet</h3>
                <p className="text-slate-600 mb-4">Start by submitting your first research article.</p>
                <Button onClick={() => router.push('/author/submit')}>
                  Submit Your First Article
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => {
                  const statusConfig = getStatusConfig(submission.status)
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900">{submission.title}</h4>
                          {submission.actionRequired && (
                            <Badge variant="destructive" className="animate-pulse">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <Badge className={statusConfig.color} variant="outline">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <span>Submitted {new Date(submission.submittedDate).toLocaleDateString()}</span>
                        </div>
                        <Progress value={submission.progress} className="h-2 w-32" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/author/submissions/${submission.id}`)}
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </AuthorLayout>
    </RouteGuard>
  )
}