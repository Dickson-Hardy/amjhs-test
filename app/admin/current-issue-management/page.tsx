"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import RouteGuard from "@/components/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  Calendar,
  FileText,
  Users,
  Globe,
  Star,
  Eye,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings
} from "lucide-react"

interface Issue {
  id: string
  volume: string
  number: string
  title: string
  description?: string
  status: 'draft' | 'current' | 'archived'
  publishedDate: string
  articlesCount: number
  guestEditors?: string[]
  coverImage?: string
  pageRange?: string
  doi?: string
  createdAt: string
  updatedAt: string
}

interface Article {
  id: string
  title: string
  authors: string[]
  category: string
  status: string
  publishedDate?: string
  doi?: string
  pages?: string
}

export default function CurrentIssueManagementPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>([])
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null)
  const [currentIssueArticles, setCurrentIssueArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isSettingCurrent, setIsSettingCurrent] = useState(false)

  useEffect(() => {
    fetchIssues()
    fetchCurrentIssue()
  }, [])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/admin/issues')
      const data = await response.json()
      
      if (data.success) {
        setIssues(data.issues)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch issues",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error("Error fetching issues:", error)
      toast({
        title: "Error",
        description: "Failed to fetch issues",
        variant: "destructive"
      })
    }
  }

  const fetchCurrentIssue = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/current-issue')
      const data = await response.json()
      
      if (data.success) {
        setCurrentIssue(data.issue)
        setCurrentIssueArticles(data.articles || [])
      }
    } catch (error) {
      logger.error("Error fetching current issue:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetCurrentIssue = async (issueId: string) => {
    try {
      setIsSettingCurrent(true)
      const response = await fetch('/api/admin/current-issue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Current issue updated successfully"
        })
        fetchIssues()
        fetchCurrentIssue()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to set current issue: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsSettingCurrent(false)
    }
  }

  const handleArchiveCurrentIssue = async () => {
    if (!currentIssue) return
    
    if (!confirm("Are you sure you want to archive the current issue? This will remove it from the homepage.")) return

    try {
      const response = await fetch('/api/admin/current-issue/archive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: currentIssue.id })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Current issue archived successfully"
        })
        fetchIssues()
        fetchCurrentIssue()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to archive current issue: ${error.message}`,
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <Globe className="h-4 w-4" />
      case 'draft': return <FileText className="h-4 w-4" />
      case 'archived': return <BookOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Current Issue Management
              </h1>
              <p className="text-gray-600">
                Manage the current issue displayed on the homepage
              </p>
            </div>
            <Button onClick={() => window.location.href = '/admin/archive-management'}>
              <Settings className="h-4 w-4 mr-2" />
              Manage All Issues
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading current issue...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Issue Display */}
            {currentIssue ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        Current Issue: Volume {currentIssue.volume}, Issue {currentIssue.number}
                      </CardTitle>
                      <CardDescription>
                        {currentIssue.title}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <Globe className="h-3 w-3 mr-1" />
                        Currently Published
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={handleArchiveCurrentIssue}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Archive Issue
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentIssueArticles.length}</div>
                      <div className="text-sm text-gray-600">Articles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {new Date(currentIssue.publishedDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Published Date</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentIssue.pageRange || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">Page Range</div>
                    </div>
                  </div>

                  {currentIssue.description && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-gray-700">{currentIssue.description}</p>
                    </div>
                  )}

                  {currentIssue.guestEditors && currentIssue.guestEditors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Guest Editors</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentIssue.guestEditors.map((editor, index) => (
                          <Badge key={index} variant="secondary">
                            {editor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Articles in Current Issue */}
                  <div>
                    <h4 className="font-medium mb-3">Articles in This Issue</h4>
                    {currentIssueArticles.length > 0 ? (
                      <div className="space-y-3">
                        {currentIssueArticles.map((article) => (
                          <Card key={article.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-sm mb-1">{article.title}</h5>
                                  <p className="text-xs text-gray-600 mb-2">
                                    By {article.authors.join(", ")}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline">{article.category}</Badge>
                                    {article.pages && (
                                      <span className="text-gray-500">Pages {article.pages}</span>
                                    )}
                                    {article.doi && (
                                      <span className="text-gray-500">DOI: {article.doi}</span>
                                    )}
                                  </div>
                                </div>
                                <Badge className="text-xs">
                                  {article.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No articles assigned to this issue yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Current Issue Set</h3>
                  <p className="text-gray-600 mb-4">
                    There is no current issue selected for the homepage. Choose an issue to set as current.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Available Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Available Issues</CardTitle>
                <CardDescription>
                  Select an issue to set as the current issue displayed on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {issues.length > 0 ? (
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <Card key={issue.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium mb-1">
                                Volume {issue.volume}, Issue {issue.number}: {issue.title}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(issue.publishedDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {issue.articlesCount} articles
                                </span>
                                {issue.guestEditors && issue.guestEditors.length > 0 && (
                                  <span className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    Guest editors
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(issue.status)} flex items-center gap-1`}>
                                {getStatusIcon(issue.status)}
                                {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                              </Badge>
                              
                              {issue.status !== 'current' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSetCurrentIssue(issue.id)}
                                  disabled={isSettingCurrent}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Set as Current
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No issues available. Create issues in the Archive Management section.</p>
                    <Button className="mt-4" onClick={() => window.location.href = '/admin/archive-management'}>
                      <Settings className="h-4 w-4 mr-2" />
                      Go to Archive Management
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Homepage Preview */}
            {currentIssue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Homepage Preview
                  </CardTitle>
                  <CardDescription>
                    How this issue will appear on the homepage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h3 className="text-lg font-serif font-bold text-blue-900 mb-2">
                      Current Issue
                    </h3>
                    <div className="bg-white p-4 rounded border">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-20 bg-gray-200 rounded border flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-blue-900 mb-1">
                            Vol. {currentIssue.volume} No. {currentIssue.number} ({new Date(currentIssue.publishedDate).getFullYear()})
                          </h4>
                          <div className="text-sm text-gray-600 mb-2">
                            Published: {new Date(currentIssue.publishedDate).toLocaleDateString()}
                          </div>
                          <p className="text-sm text-gray-700">
                            {currentIssue.description || currentIssue.title}
                          </p>
                        </div>
                      </div>
                      
                      {currentIssueArticles.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-blue-900 text-sm uppercase tracking-wide mb-2">
                            FEATURED ARTICLES
                          </h5>
                          <ul className="space-y-1 text-sm">
                            {currentIssueArticles.slice(0, 3).map((article) => (
                              <li key={article.id}>
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                  {article.title}
                                </span>
                              </li>
                            ))}
                            {currentIssueArticles.length > 3 && (
                              <li className="text-gray-500">
                                and {currentIssueArticles.length - 3} more articles...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
