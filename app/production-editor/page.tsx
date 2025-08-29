"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Printer,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Edit,
  Mail,
  Calendar,
  Layers,
  Image,
  Type,
  Link,
  Globe,
  Archive,
  RefreshCw,
  Send,
} from "lucide-react"

interface ProductionMetrics {
  acceptedArticles: number
  inCopyediting: number
  inTypesetting: number
  awaitingProofs: number
  readyForPublication: number
  publishedThisMonth: number
  averageProductionTime: number
}

interface Article {
  id: string
  title: string
  authors: string[]
  acceptedDate: string
  status: 'copyediting' | 'typesetting' | 'proofing' | 'ready_to_publish' | 'published'
  priority: 'high' | 'medium' | 'low'
  targetIssue: string
  doi: string
  productionNotes: string[]
  filesUploaded: {
    manuscript: boolean
    figures: boolean
    supplementary: boolean
  }
  proofStatus: {
    authorProof: 'pending' | 'approved' | 'changes_requested'
    finalProof: 'pending' | 'approved'
  }
  scheduledPublication: string
}

interface Issue {
  id: string
  volume: string
  number: string
  title: string
  status: 'planning' | 'in_production' | 'ready' | 'published'
  targetDate: string
  articlesCount: number
  coverImage: string | null
  guestEditor: string | null
}

interface ProductionTask {
  id: string
  articleId: string
  articleTitle: string
  type: 'copyedit' | 'typeset' | 'proof_review' | 'doi_assignment' | 'metadata_entry'
  assignedTo: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold'
  priority: 'high' | 'medium' | 'low'
}

export default function ProductionEditorDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    acceptedArticles: 0,
    inCopyediting: 0,
    inTypesetting: 0,
    awaitingProofs: 0,
    readyForPublication: 0,
    publishedThisMonth: 0,
    averageProductionTime: 0,
  })
  const [articles, setArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [tasks, setTasks] = useState<ProductionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  useEffect(() => {
    const allowedRoles = ["production-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session?.user?.role || "")) return

    fetchDashboardData()
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API endpoints
      const [metricsResponse, articlesResponse, issuesResponse, tasksResponse] = await Promise.all([
        fetch('/api/production-editor/metrics'),
        fetch('/api/production-editor/articles'),
        fetch('/api/production-editor/issues'),
        fetch('/api/production-editor/tasks')
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json()
        setArticles(articlesData)
      }

      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json()
        setIssues(issuesData)
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching production editor dashboard data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (articleId: string, newStatus: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating article ${articleId} status to: ${newStatus}`)
      }
      fetchDashboardData()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating article status:', error)
      }
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Marking task ${taskId} as complete`)
      }
      fetchDashboardData()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error completing task:', error)
      }
    }
  }

  const handlePublishArticle = async (articleId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Publishing article ${articleId}`)
      }
      fetchDashboardData()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error publishing article:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "copyediting":
        return "bg-blue-100 text-blue-800"
      case "typesetting":
        return "bg-purple-100 text-purple-800"
      case "proofing":
        return "bg-yellow-100 text-yellow-800"
      case "ready_to_publish":
        return "bg-green-100 text-green-800"
      case "published":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50"
      case "medium":
        return "border-l-yellow-500 bg-yellow-50"
      case "low":
        return "border-l-green-500 bg-green-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Printer className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Editor Dashboard</h1>
          <p className="text-gray-600">Managing copyediting, typesetting, and publication workflow</p>
        </div>
      </div>

      {/* Production Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Copyediting</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inCopyediting}</div>
            <p className="text-xs text-muted-foreground">Articles being edited</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Typesetting</CardTitle>
            <Type className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inTypesetting}</div>
            <p className="text-xs text-muted-foreground">Being formatted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Proofs</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.awaitingProofs}</div>
            <p className="text-xs text-muted-foreground">Author review needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Publish</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.readyForPublication}</div>
            <p className="text-xs text-muted-foreground">Final approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="doi">DOI Management</TabsTrigger>
          <TabsTrigger value="archive">Archive</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Articles in Production</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="copyediting">Copyediting</SelectItem>
                  <SelectItem value="typesetting">Typesetting</SelectItem>
                  <SelectItem value="proofing">Proofing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className={`border-l-4 ${getPriorityColor(article.priority)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <CardDescription>
                        By {article.authors.join(", ")} • 
                        Accepted: {new Date(article.acceptedDate).toLocaleDateString()} • 
                        Target: {article.targetIssue} • 
                        DOI: {article.doi}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(article.status)}>
                        {article.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{article.priority} priority</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Upload Status */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${article.filesUploaded.manuscript ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">Manuscript</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${article.filesUploaded.figures ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">Figures</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${article.filesUploaded.supplementary ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">Supplementary</span>
                      </div>
                    </div>

                    {/* Production Notes */}
                    {article.productionNotes.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Notes:</strong> {article.productionNotes.join("; ")}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Proof Status */}
                    {article.status === 'proofing' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={article.proofStatus.authorProof === 'approved' ? 'default' : 'outline'}>
                            Author Proof: {article.proofStatus.authorProof.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={article.proofStatus.finalProof === 'approved' ? 'default' : 'outline'}>
                            Final Proof: {article.proofStatus.finalProof}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Scheduled: {new Date(article.scheduledPublication).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setSelectedArticle(article.id)}
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Production Status</DialogTitle>
                              <DialogDescription>
                                Update status for: {article.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Select defaultValue={article.status}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="copyediting">Copyediting</SelectItem>
                                  <SelectItem value="typesetting">Typesetting</SelectItem>
                                  <SelectItem value="proofing">Proofing</SelectItem>
                                  <SelectItem value="ready_to_publish">Ready to Publish</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea
                                placeholder="Production notes..."
                                className="min-h-20"
                              />
                              <Button onClick={() => handleStatusUpdate(article.id, 'typesetting')}>
                                Update Status
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {article.status === 'ready_to_publish' && (
                          <Button 
                            onClick={() => handlePublishArticle(article.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Production Tasks</h2>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Task
            </Button>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg capitalize">{task.type.replace('_', ' ')}</CardTitle>
                      <CardDescription>
                        Article: {task.articleTitle} • 
                        Assigned to: {task.assignedTo} • 
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleTaskComplete(task.id)}
                      size="sm"
                      disabled={task.status === 'completed'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Journal Issues</h2>
            <Button>
              <Layers className="h-4 w-4 mr-2" />
              Create Issue
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {issues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Volume {issue.volume}, Issue {issue.number}</CardTitle>
                      <CardDescription>{issue.title}</CardDescription>
                    </div>
                    <Badge variant={issue.status === 'published' ? 'default' : 'outline'}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Articles</span>
                      <div className="font-medium">{issue.articlesCount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Target Date</span>
                      <div className="font-medium">{new Date(issue.targetDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {issue.guestEditor && (
                    <div>
                      <span className="text-sm text-gray-600">Guest Editor</span>
                      <div className="font-medium">{issue.guestEditor}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Articles
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Issue
                    </Button>
                    {issue.status === 'ready' && (
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* DOI Management Tab */}
        <TabsContent value="doi" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">DOI Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>DOI Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Link className="h-4 w-4 mr-2" />
                  Assign DOIs to Accepted Articles
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update CrossRef Metadata
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export DOI Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent DOI Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">DOIs Assigned Today</span>
                    <Badge>3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending CrossRef</span>
                    <Badge variant="outline">2</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed Registrations</span>
                    <Badge variant="destructive">0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Published Archive</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archive Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.publishedThisMonth}</div>
                    <p className="text-sm text-gray-600">Published This Month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.averageProductionTime}d</div>
                    <p className="text-sm text-gray-600">Avg Production Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-sm text-gray-600">Total Articles</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Archive className="h-4 w-4 mr-2" />
                    Browse Archive
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Metadata
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
