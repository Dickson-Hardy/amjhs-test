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
  Shield,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar
} from "lucide-react"

interface COIDeclaration {
  id: string
  userId: string
  userName: string
  userRole: string
  manuscriptId: string
  manuscriptTitle: string
  conflictType: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export default function COIDeclarationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [declarations, setDeclarations] = useState<COIDeclaration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchDeclarations()
  }, [])

  const fetchDeclarations = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockDeclarations: COIDeclaration[] = [
        {
          id: "1",
          userId: "user1",
          userName: "Dr. Sarah Johnson",
          userRole: "reviewer",
          manuscriptId: "MS-2024-0123",
          manuscriptTitle: "IoT in Healthcare Applications",
          conflictType: "Financial Interest",
          description: "Received research funding from company mentioned in manuscript",
          status: "pending",
          submittedAt: "2024-09-10T10:30:00Z"
        },
        {
          id: "2",
          userId: "user2",
          userName: "Prof. Michael Chen",
          userRole: "editor",
          manuscriptId: "MS-2024-0118",
          manuscriptTitle: "Smart Medical Devices",
          conflictType: "Professional Relationship",
          description: "Collaborated with lead author on previous projects",
          status: "approved",
          submittedAt: "2024-09-08T14:20:00Z",
          reviewedAt: "2024-09-09T09:15:00Z",
          reviewedBy: "Dr. Emily Rodriguez"
        }
      ]
      setDeclarations(mockDeclarations)
    } catch (error) {
      toast.error("Failed to load COI declarations")
    } finally {
      setLoading(false)
    }
  }

  const handleReviewDeclaration = async (declarationId: string, action: 'approve' | 'reject') => {
    try {
      // Mock API call - replace with actual implementation
      toast.success(`Declaration ${action}d successfully`)
      fetchDeclarations() // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${action} declaration`)
    }
  }

  const filteredDeclarations = declarations.filter(declaration => {
    const matchesSearch = declaration.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         declaration.manuscriptTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || declaration.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">COI Declarations</h1>
              <p className="text-gray-600">Review and manage conflict of interest declarations</p>
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
                    <p className="text-2xl font-bold text-blue-600">{declarations.length}</p>
                    <p className="text-sm text-gray-600">Total Declarations</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {declarations.filter(d => d.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending Review</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {declarations.filter(d => d.status === 'approved').length}
                    </p>
                    <p className="text-sm text-gray-600">Approved</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {declarations.filter(d => d.status === 'rejected').length}
                    </p>
                    <p className="text-sm text-gray-600">Rejected</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Declarations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Conflict of Interest Declarations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading declarations...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Manuscript</TableHead>
                      <TableHead>Conflict Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeclarations.map((declaration) => (
                      <TableRow key={declaration.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{declaration.userName}</p>
                            <p className="text-sm text-gray-500 capitalize">{declaration.userRole}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{declaration.manuscriptId}</p>
                            <p className="text-sm text-gray-500">{declaration.manuscriptTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{declaration.conflictType}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(declaration.status)}</TableCell>
                        <TableCell>
                          {new Date(declaration.submittedAt).toLocaleDateString()}
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
                            {declaration.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleReviewDeclaration(declaration.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReviewDeclaration(declaration.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
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