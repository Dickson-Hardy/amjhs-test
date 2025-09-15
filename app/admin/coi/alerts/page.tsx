"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  User,
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react"

interface COIAlert {
  id: string
  userId: string
  userName: string
  userRole: string
  manuscriptId: string
  manuscriptTitle: string
  alertType: 'high_risk' | 'confirmed_conflict' | 'potential_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: string
  status: 'active' | 'resolved' | 'dismissed'
  resolvedAt?: string
  resolvedBy?: string
}

export default function COIAlertsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [alerts, setAlerts] = useState<COIAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockAlerts: COIAlert[] = [
        {
          id: "1",
          userId: "user1",
          userName: "Dr. Sarah Johnson",
          userRole: "reviewer",
          manuscriptId: "MS-2024-0123",
          manuscriptTitle: "IoT in Healthcare Applications",
          alertType: 'high_risk',
          severity: 'high',
          description: "High conflict risk detected: Reviewer has received funding from company mentioned in manuscript",
          detectedAt: "2024-09-10T10:30:00Z",
          status: 'active'
        },
        {
          id: "2",
          userId: "user2",
          userName: "Prof. Michael Chen",
          userRole: "editor",
          manuscriptId: "MS-2024-0118",
          manuscriptTitle: "Smart Medical Devices",
          alertType: 'confirmed_conflict',
          severity: 'critical',
          description: "Confirmed conflict: Editor has professional collaboration with lead author",
          detectedAt: "2024-09-08T14:20:00Z",
          status: 'active'
        },
        {
          id: "3",
          userId: "user3",
          userName: "Dr. Lisa Anderson",
          userRole: "reviewer",
          manuscriptId: "MS-2024-0115",
          manuscriptTitle: "Digital Health Solutions",
          alertType: 'potential_conflict',
          severity: 'medium',
          description: "Potential conflict: Reviewer works at same institution as co-author",
          detectedAt: "2024-09-05T09:15:00Z",
          status: 'resolved',
          resolvedAt: "2024-09-06T11:30:00Z",
          resolvedBy: "Dr. Emily Rodriguez"
        }
      ]
      setAlerts(mockAlerts)
    } catch (error) {
      toast.error("Failed to load COI alerts")
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string, action: 'resolve' | 'dismiss') => {
    try {
      // Mock API call - replace with actual implementation
      toast.success(`Alert ${action}d successfully`)
      fetchAlerts() // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${action} alert`)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.manuscriptTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-700">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-red-100 text-red-700">Active</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-700">Dismissed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'high_risk':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'confirmed_conflict':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'potential_conflict':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">COI Alerts</h1>
              <p className="text-gray-600">Monitor and manage conflict of interest alerts</p>
            </div>
            <Button onClick={() => router.push('/admin/coi')}>
              <Shield className="h-4 w-4 mr-2" />
              Back to COI Overview
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.status === 'active').length}</p>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}
                    </p>
                    <p className="text-sm text-gray-600">High Priority</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {alerts.filter(a => a.status === 'resolved').length}
                    </p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {alerts.filter(a => a.alertType === 'confirmed_conflict').length}
                    </p>
                    <p className="text-sm text-gray-600">Confirmed Conflicts</p>
                  </div>
                  <XCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by user or manuscript..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Conflict of Interest Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading alerts...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Manuscript</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getAlertTypeIcon(alert.alertType)}
                            <span className="capitalize">{alert.alertType.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.userName}</p>
                            <p className="text-sm text-gray-500 capitalize">{alert.userRole}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.manuscriptId}</p>
                            <p className="text-sm text-gray-500">{alert.manuscriptTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          {new Date(alert.detectedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Open modal with full details */}}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {alert.status === 'active' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleResolveAlert(alert.id, 'resolve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-700"
                                  onClick={() => handleResolveAlert(alert.id, 'dismiss')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Dismiss
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}