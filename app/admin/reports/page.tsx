"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  FileCheck,
  TrendingUp,
  Clock,
  Filter
} from "lucide-react"
import { format } from "date-fns"

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({})
  const [generating, setGenerating] = useState(false)
  const [recentReports, setRecentReports] = useState<any[]>([])

  const reportTypes: ReportType[] = [
    // User Reports
    {
      id: "user-activity",
      name: "User Activity Report",
      description: "Detailed analysis of user engagement and activity patterns",
      icon: <Users className="h-5 w-5" />,
      category: "Users"
    },
    {
      id: "user-registration",
      name: "User Registration Report",
      description: "New user registrations and account statistics",
      icon: <Users className="h-5 w-5" />,
      category: "Users"
    },

    // Submission Reports
    {
      id: "submission-stats",
      name: "Submission Statistics",
      description: "Comprehensive submission metrics and trends",
      icon: <FileText className="h-5 w-5" />,
      category: "Submissions"
    },
    {
      id: "review-timeline",
      name: "Review Timeline Report",
      description: "Analysis of review process duration and efficiency",
      icon: <Clock className="h-5 w-5" />,
      category: "Submissions"
    },

    // Editorial Reports
    {
      id: "editorial-workflow",
      name: "Editorial Workflow Report",
      description: "Editorial process efficiency and bottleneck analysis",
      icon: <FileCheck className="h-5 w-5" />,
      category: "Editorial"
    },
    {
      id: "reviewer-performance",
      name: "Reviewer Performance Report",
      description: "Reviewer statistics, timeliness, and quality metrics",
      icon: <BarChart3 className="h-5 w-5" />,
      category: "Editorial"
    },

    // Publication Reports
    {
      id: "publication-metrics",
      name: "Publication Metrics",
      description: "Publication statistics and journal performance",
      icon: <TrendingUp className="h-5 w-5" />,
      category: "Publications"
    },
    {
      id: "impact-analysis",
      name: "Impact Analysis Report",
      description: "Citation metrics and academic impact assessment",
      icon: <BarChart3 className="h-5 w-5" />,
      category: "Publications"
    }
  ]

  const categories = [...new Set(reportTypes.map(report => report.category))]

  useEffect(() => {
    // Load recent reports
    loadRecentReports()
  }, [])

  const loadRecentReports = async () => {
    try {
      // Mock data - replace with actual API call
      const mockReports = [
        {
          id: "1",
          name: "Monthly User Activity Report",
          type: "user-activity",
          generatedAt: new Date(Date.now() - 86400000), // 1 day ago
          status: "completed",
          downloadUrl: "#"
        },
        {
          id: "2",
          name: "Q3 Submission Statistics",
          type: "submission-stats",
          generatedAt: new Date(Date.now() - 172800000), // 2 days ago
          status: "completed",
          downloadUrl: "#"
        }
      ]
      setRecentReports(mockReports)
    } catch (error) {
      console.error('Failed to load recent reports:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error("Please select a report type")
      return
    }

    setGenerating(true)
    try {
      // Mock report generation - replace with actual API call
      console.log('Generating report:', {
        type: selectedReport,
        dateRange,
        generatedBy: session?.user?.email
      })

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success("Report generated successfully!")

      // Refresh recent reports
      loadRecentReports()

      // Reset form
      setSelectedReport("")
      setDateRange({})

    } catch (error) {
      toast.error("Failed to generate report")
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = (reportId: string) => {
    // Mock download - replace with actual download logic
    toast.success("Report download started")
  }

  const getReportById = (id: string) => {
    return reportTypes.find(report => report.id === id)
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and download comprehensive system reports</p>
            </div>
            <Button onClick={() => router.push('/admin/dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Generate New Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Report Type
                  </label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                            {category}
                          </div>
                          {reportTypes
                            .filter(report => report.category === category)
                            .map(report => (
                              <SelectItem key={report.id} value={report.id}>
                                <div className="flex items-center space-x-2">
                                  {report.icon}
                                  <div>
                                    <div className="font-medium">{report.name}</div>
                                    <div className="text-sm text-gray-500">{report.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReport && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      {getReportById(selectedReport)?.icon}
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {getReportById(selectedReport)?.name}
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {getReportById(selectedReport)?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Date Range (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || generating}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generating ? 'Generating Report...' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-green-600" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent reports found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-500">
                            Generated {format(report.generatedAt, "PPP")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {report.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Categories Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => {
              const categoryReports = reportTypes.filter(r => r.category === category)
              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category} Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {categoryReports.length}
                    </div>
                    <p className="text-sm text-gray-600">
                      Available report types
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}