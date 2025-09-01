"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Eye,
  Search,
  Filter,
  Shield,
  Settings,
  Bell,
  Mail
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import RoleSwitcher from "@/components/role-switcher"

interface Manuscript {
  id: string
  title: string
  authors: string[]
  category: string
  status: string
  submittedAt: string
  priority: "high" | "medium" | "low"
}

interface ScreeningStats {
  totalPending: number
  screenedToday: number
  averageScreeningTime: number
  overdueCount: number
}

export default function EditorialAssistantDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [stats, setStats] = useState<ScreeningStats>({
    totalPending: 0,
    screenedToday: 0,
    averageScreeningTime: 0,
    overdueCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    if (session?.user?.role !== "editorial-assistant" && 
        session?.user?.role !== "admin" && 
        session?.user?.role !== "managing-editor" && 
        session?.user?.role !== "editor-in-chief") {
      router.push("/dashboard")
      return
    }

    fetchManuscripts()
    fetchStats()
  }, [session, router])

  const fetchManuscripts = async () => {
    try {
      const response = await fetch("/api/editorial-assistant/manuscripts")
      if (response.ok) {
        const data = await response.json()
        setManuscripts(data.manuscripts || [])
      }
    } catch (error) {
      console.error("Error fetching manuscripts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/editorial-assistant/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  // Editorial Assistant Workflow Actions
  const handleInitialScreening = (manuscriptId: string) => {
    router.push(`/editorial-assistant/screening/${manuscriptId}`)
  }

  const handleAssociateEditorAssignment = (manuscriptId: string) => {
    router.push(`/editorial-assistant/assignment/${manuscriptId}`)
  }

  const handleWorkflowMonitoring = () => {
    router.push(`/editorial-assistant/workflow-monitoring`)
  }

  const handleDeadlineManagement = () => {
    router.push(`/editorial-assistant/deadlines`)
  }

  const filteredManuscripts = manuscripts.filter(manuscript => {
    const matchesSearch = manuscript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manuscript.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || manuscript.status === statusFilter
    const matchesPriority = priorityFilter === "all" || manuscript.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">New Submission</Badge>
      case "editorial_assistant_review":
        return <Badge className="bg-yellow-100 text-yellow-800">Screening in Progress</Badge>
      case "associate_editor_assignment":
        return <Badge className="bg-purple-100 text-purple-800">Ready for Assignment</Badge>
      case "associate_editor_review":
        return <Badge className="bg-indigo-100 text-indigo-800">Editor Review</Badge>
      case "revision_requested":
        return <Badge className="bg-amber-100 text-amber-800">Revision Requested</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editorial-assistant", "managing-editor", "editor-in-chief", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editorial-assistant", "managing-editor", "editor-in-chief", "admin"]}>
      <EditorLayout>
        <div className="space-y-4">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Editorial Assistant Dashboard
            </h1>
            <p className="text-gray-600">
              Manage manuscript screening and associate editor assignments
            </p>
          </div>

      {/* Role Switcher */}
      <div className="mb-4">
        <RoleSwitcher onRoleChange={(newRole) => {
          // Refresh the page to show new role-based content
          window.location.reload()
        }} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Initial Screening</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              New submissions awaiting technical review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Screened Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.screenedToday}</div>
            <p className="text-xs text-muted-foreground">
              Completed technical assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScreeningTime}h</div>
            <p className="text-xs text-muted-foreground">
              Per initial screening
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Past processing deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Editorial Workflow Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Editorial Assistant Workflow Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage technical screening, editor assignments, and workflow monitoring
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search manuscripts by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">New Submission</SelectItem>
                <SelectItem value="editorial_assistant_review">Screening in Progress</SelectItem>
                <SelectItem value="associate_editor_assignment">Ready for Assignment</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Editorial Assistant Workflow Tabs */}
          <Tabs defaultValue="initial-screening" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="initial-screening">
                Initial Screening ({manuscripts.filter(m => m.status === "submitted").length})
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress ({manuscripts.filter(m => m.status === "editorial_assistant_review").length})
              </TabsTrigger>
              <TabsTrigger value="editor-assignment">
                Editor Assignment ({manuscripts.filter(m => m.status === "associate_editor_assignment").length})
              </TabsTrigger>
              <TabsTrigger value="workflow-monitoring">
                Workflow Monitoring
              </TabsTrigger>
              <TabsTrigger value="administrative">
                Administrative
              </TabsTrigger>
            </TabsList>

            {/* Initial Screening - New Submissions */}
            <TabsContent value="initial-screening" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Initial Technical Screening</h4>
                <p className="text-blue-700 text-sm">
                  Perform technical assessment including format compliance, file completeness, 
                  plagiarism checks, and ethical compliance before forwarding to associate editors.
                </p>
              </div>
              
              {filteredManuscripts
                .filter(m => m.status === "submitted")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
                          <Badge variant="outline" className="ml-auto">Technical Review Required</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">
                          <strong>Authors:</strong> {manuscript.authors.join(", ")}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>Category:</strong> {manuscript.category}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Submitted: {new Date(manuscript.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleInitialScreening(manuscript.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Begin Screening
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            {/* In Progress Screenings */}
            <TabsContent value="in-progress" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Screening in Progress</h4>
                <p className="text-yellow-700 text-sm">
                  Complete technical assessments and decide whether manuscripts should proceed 
                  to associate editor assignment or be returned for revision.
                </p>
              </div>
              
              {filteredManuscripts
                .filter(m => m.status === "editorial_assistant_review")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
                          <Badge className="bg-yellow-100 text-yellow-800 ml-auto">Screening in Progress</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">
                          <strong>Authors:</strong> {manuscript.authors.join(", ")}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>Category:</strong> {manuscript.category}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Started screening: {new Date(manuscript.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleInitialScreening(manuscript.id)}
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Continue Screening
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            {/* Associate Editor Assignment */}
            <TabsContent value="editor-assignment" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Associate Editor Assignment</h4>
                <p className="text-purple-700 text-sm">
                  Assign manuscripts that have passed technical screening to appropriate associate editors 
                  based on expertise, workload, and availability.
                </p>
              </div>
              
              {filteredManuscripts
                .filter(m => m.status === "associate_editor_assignment")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
                          <Badge className="bg-purple-100 text-purple-800 ml-auto">Ready for Assignment</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">
                          <strong>Authors:</strong> {manuscript.authors.join(", ")}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>Category:</strong> {manuscript.category}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Screening completed: {new Date(manuscript.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAssociateEditorAssignment(manuscript.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Editor
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            {/* Workflow Monitoring */}
            <TabsContent value="workflow-monitoring" className="space-y-4">
              <div className="text-center py-8">
                <Settings className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Workflow Monitoring & Administration</h3>
                <p className="text-gray-600 mb-6">
                  Monitor editorial workflow progress, track deadlines, and ensure efficient manuscript processing.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button 
                    onClick={handleWorkflowMonitoring}
                    variant="outline" 
                    className="p-6 h-auto flex-col"
                  >
                    <Bell className="h-8 w-8 mb-2 text-blue-600" />
                    <span className="font-medium">Workflow Monitoring</span>
                    <span className="text-sm text-gray-500">Track progress & bottlenecks</span>
                  </Button>
                  <Button 
                    onClick={handleDeadlineManagement}
                    variant="outline" 
                    className="p-6 h-auto flex-col"
                  >
                    <Clock className="h-8 w-8 mb-2 text-orange-600" />
                    <span className="font-medium">Deadline Management</span>
                    <span className="text-sm text-gray-500">Monitor & enforce timelines</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Administrative Tasks */}
            <TabsContent value="administrative" className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Administrative Support</h3>
                <p className="text-gray-600 mb-6">
                  Handle administrative tasks including communication templates, reports, and system maintenance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <Button 
                    onClick={() => router.push('/editorial-assistant/communication')}
                    variant="outline" 
                    className="p-6 h-auto flex-col"
                  >
                    <Mail className="h-8 w-8 mb-2 text-blue-600" />
                    <span className="font-medium">Communication</span>
                    <span className="text-sm text-gray-500">Notifications & updates</span>
                  </Button>
                  <Button 
                    onClick={() => router.push('/editorial-assistant/reports')}
                    variant="outline" 
                    className="p-6 h-auto flex-col"
                  >
                    <FileText className="h-8 w-8 mb-2 text-green-600" />
                    <span className="font-medium">Reports</span>
                    <span className="text-sm text-gray-500">Generate workflow reports</span>
                  </Button>
                  <Button 
                    onClick={() => router.push('/editorial-assistant/settings')}
                    variant="outline" 
                    className="p-6 h-auto flex-col"
                  >
                    <Settings className="h-8 w-8 mb-2 text-gray-600" />
                    <span className="font-medium">Settings</span>
                    <span className="text-sm text-gray-500">System configuration</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}
