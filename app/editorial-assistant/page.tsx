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
  Bell
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
      logger.error("Error fetching manuscripts:", error)
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
      logger.error("Error fetching stats:", error)
    }
  }

  const handleScreening = (manuscriptId: string) => {
    router.push(`/editorial-assistant/screening/${manuscriptId}`)
  }

  const handleAssignment = (manuscriptId: string) => {
    router.push(`/editorial-assistant/assignment/${manuscriptId}`)
  }

  const handleCOIQuestionnaire = (manuscriptId: string) => {
    router.push(`/editorial-assistant/coi/${manuscriptId}`)
  }

  const handleTimeLimitManagement = () => {
    router.push(`/editorial-assistant/time-limits`)
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
        return <Badge variant="secondary">New Submission</Badge>
      case "editorial_assistant_review":
        return <Badge variant="default">Under Screening</Badge>
      case "associate_editor_assignment":
        return <Badge variant="outline">Ready for Assignment</Badge>
      case "revision_requested":
        return <Badge variant="destructive">Revision Required</Badge>
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
      <RouteGuard allowedRoles={["editorial-assistant", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editorial-assistant", "admin"]}>
      <EditorLayout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Editorial Assistant Dashboard
            </h1>
            <p className="text-gray-600">
              Manage manuscript screening and associate editor assignments
            </p>
          </div>

      {/* Role Switcher */}
      <div className="mb-8">
        <RoleSwitcher onRoleChange={(newRole) => {
          // Refresh the page to show new role-based content
          window.location.reload()
        }} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Screening</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Manuscripts awaiting review
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
              Completed screenings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScreeningTime}h</div>
            <p className="text-xs text-muted-foreground">
              Per manuscript
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Past deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manuscript Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manuscript Management
          </CardTitle>
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
                <SelectItem value="editorial_assistant_review">Under Screening</SelectItem>
                <SelectItem value="associate_editor_assignment">Ready for Assignment</SelectItem>
                <SelectItem value="revision_requested">Revision Required</SelectItem>
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

          {/* Manuscript List */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending">Pending Screening ({manuscripts.filter(m => m.status === "submitted").length})</TabsTrigger>
              <TabsTrigger value="screening">Under Screening ({manuscripts.filter(m => m.status === "editorial_assistant_review").length})</TabsTrigger>
              <TabsTrigger value="assignment">Ready for Assignment ({manuscripts.filter(m => m.status === "associate_editor_assignment").length})</TabsTrigger>
              <TabsTrigger value="coi">COI Management</TabsTrigger>
              <TabsTrigger value="time-limits">Time Limits</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredManuscripts
                .filter(m => m.status === "submitted")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
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
                          onClick={() => handleScreening(manuscript.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Screen Manuscript
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="screening" className="space-y-4">
              {filteredManuscripts
                .filter(m => m.status === "editorial_assistant_review")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
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
                          onClick={() => handleScreening(manuscript.id)}
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

            <TabsContent value="assignment" className="space-y-4">
              {filteredManuscripts
                .filter(m => m.status === "associate_editor_assignment")
                .map((manuscript) => (
                  <div key={manuscript.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{manuscript.title}</h3>
                          {getPriorityIcon(manuscript.priority)}
                        </div>
                        <p className="text-gray-600 mb-2">
                          <strong>Authors:</strong> {manuscript.authors.join(", ")}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>Category:</strong> {manuscript.category}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Ready for assignment: {new Date(manuscript.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAssignment(manuscript.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Editor
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="coi" className="space-y-4">
              <div className="text-center py-8">
                <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Conflict of Interest Management</h3>
                <p className="text-gray-600 mb-6">
                  Monitor and manage conflict of interest declarations from associate editors and reviewers.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => router.push('/editorial-assistant/coi/overview')}>
                    <Shield className="h-4 w-4 mr-2" />
                    View COI Overview
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/editorial-assistant/coi/reports')}>
                    <FileText className="h-4 w-4 mr-2" />
                    COI Reports
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="time-limits" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Time Limit Management</h3>
                <p className="text-gray-600 mb-6">
                  Configure and monitor workflow stage deadlines and automated reminders.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleTimeLimitManagement}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Time Limits
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/editorial-assistant/time-limits/monitoring')}>
                    <Bell className="h-4 w-4 mr-2" />
                    Monitor Deadlines
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
