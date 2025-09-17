"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  isVerified: boolean
  joinDate: string
  lastLogin: string
  submissionsCount: number
  reviewsCount: number
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  adminUsers: number
  editorUsers: number
  reviewerUsers: number
  authorUsers: number
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([]) // Initialize as empty array
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    adminUsers: 0,
    editorUsers: 0,
    reviewerUsers: 0,
    authorUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    role: 'author',
    password: ''
  })

  useEffect(() => {
    if (session?.user?.role && ["admin", "editor-in-chief"].includes(session.user.role)) {
      fetchUsersData()
    }
  }, [session])

  const fetchUsersData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      console.log('API Response:', data) // Debug log
      
      if (data.success) {
        const usersData = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setUsers(usersData);
        // Calculate stats from the users data
        const calculatedStats = {
          totalUsers: Array.isArray(usersData) ? usersData.length : 0,
          activeUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.isActive === true).length : 0,
          pendingUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.isVerified === false).length : 0,
          adminUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.role === 'admin').length : 0,
          editorUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.role === 'associate_editor' || u.role === 'editor').length : 0,
          reviewerUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.role === 'reviewer').length : 0,
          authorUsers: Array.isArray(usersData) ? usersData.filter((u: User) => u.role === 'author').length : 0,
        }
        setStats(calculatedStats)
      } else {
        console.error('Failed to fetch users:', data.error)
        // Fallback to empty state
        setUsers([])
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          adminUsers: 0,
          editorUsers: 0,
          reviewerUsers: 0,
          authorUsers: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching users data:', error)
      // Fallback to empty state
      setUsers([])
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        adminUsers: 0,
        editorUsers: 0,
        reviewerUsers: 0,
        authorUsers: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Role Updated",
          description: data.message,
        })
        fetchUsersData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Status Updated",
          description: data.message,
        })
        fetchUsersData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "User Deleted",
          description: data.message,
        })
        fetchUsersData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const handleCreateUser = async () => {
    if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createUserForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "User Created",
          description: "User created successfully",
        })
        setIsCreateDialogOpen(false)
        setCreateUserForm({ name: '', email: '', role: 'author', password: '' })
        fetchUsersData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isVerified) {
      return "bg-yellow-100 text-yellow-800" // Pending verification
    }
    if (isActive) {
      return "bg-green-100 text-green-800" // Active
    }
    return "bg-gray-100 text-gray-800" // Inactive
  }

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isVerified) return "Pending"
    if (isActive) return "Active"
    return "Inactive"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "editor-in-chief":
        return "bg-blue-100 text-blue-800"
      case "managing-editor":
        return "bg-indigo-100 text-indigo-800"
      case "section-editor":
        return "bg-cyan-100 text-cyan-800"
      case "editor":
        return "bg-teal-100 text-teal-800"
      case "reviewer":
        return "bg-orange-100 text-orange-800"
      case "author":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesRole = filterRole === "all" || user.role === filterRole
    const status = getStatusText(user.isActive, user.isVerified).toLowerCase()
    const matchesStatus = filterStatus === "all" || status === filterStatus
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
  })

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all journal users and their permissions</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the journal system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={createUserForm.role} onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="associate_editor">Associate Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Temporary password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateUser} className="flex-1">
                  Create User
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.editorUsers}</div>
            <p className="text-xs text-muted-foreground">Editorial staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewerUsers}</div>
            <p className="text-xs text-muted-foreground">Active reviewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authors</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.authorUsers}</div>
            <p className="text-xs text-muted-foreground">Contributing authors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor-in-chief">Editor-in-Chief</SelectItem>
            <SelectItem value="managing-editor">Managing Editor</SelectItem>
            <SelectItem value="section-editor">Section Editor</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="reviewer">Reviewer</SelectItem>
            <SelectItem value="author">Author</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.replace('-', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.isActive, user.isVerified)}>
                    {getStatusText(user.isActive, user.isVerified)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{user.submissionsCount} submissions</div>
                    <div className="text-gray-500">{user.reviewsCount} reviews</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {user.lastLogin === "Never" ? "Never" : new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setSelectedUser(user)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage User</DialogTitle>
                          <DialogDescription>
                            Update role and status for {user.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Role</label>
                            <Select defaultValue={user.role}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor-in-chief">Editor-in-Chief</SelectItem>
                                <SelectItem value="managing-editor">Managing Editor</SelectItem>
                                <SelectItem value="section-editor">Section Editor</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="author">Author</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select defaultValue={getStatusText(user.isActive, user.isVerified).toLowerCase()}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleUpdateUserRole(user.id, 'editor')}
                              className="flex-1"
                            >
                              Update
                            </Button>
                            <Button 
                              onClick={() => handleDeleteUser(user.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedUser.name}</DialogTitle>
              <DialogDescription>{selectedUser.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-gray-600">{selectedUser.role.replace('-', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-gray-600">{getStatusText(selectedUser.isActive, selectedUser.isVerified)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Join Date</label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedUser.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Login</label>
                  <p className="text-sm text-gray-600">
                    {selectedUser.lastLogin === "Never" ? "Never" : new Date(selectedUser.lastLogin).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Submissions</label>
                  <p className="text-sm text-gray-600">{selectedUser.submissionsCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Reviews Completed</label>
                  <p className="text-sm text-gray-600">{selectedUser.reviewsCount}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email Verification</label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedUser.isVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
