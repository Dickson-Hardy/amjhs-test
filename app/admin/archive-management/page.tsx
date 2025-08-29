"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Upload,
  Download,
  BarChart3
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Volume {
  id: string
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: string
  status: 'draft' | 'published' | 'archived'
  issueCount: number
  articleCount: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Issue {
  id: string
  volumeId: string
  number: string
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: string
  status: 'draft' | 'published' | 'archived'
  articleCount: number
  pageRange?: string
  specialIssue: boolean
  guestEditors?: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Article {
  id: string
  title: string
  authors: string[]
  status: string
  volumeId?: string
  issueId?: string
  submittedDate: string
}

export default function ArchiveManagementDashboard() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("volumes")

  // Dialog states
  const [showVolumeDialog, setShowVolumeDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)

  // Form states
  const [volumeForm, setVolumeForm] = useState({
    number: '',
    year: new Date().getFullYear(),
    title: '',
    description: '',
    coverImage: ''
  })

  const [issueForm, setIssueForm] = useState({
    volumeId: '',
    number: '',
    title: '',
    description: '',
    coverImage: '',
    specialIssue: false,
    guestEditors: ''
  })

  useEffect(() => {
    fetchVolumes()
    fetchUnassignedArticles()
  }, [])

  useEffect(() => {
    if (selectedVolume) {
      fetchIssues(selectedVolume.id)
    }
  }, [selectedVolume])

  async function fetchVolumes() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/archive/volumes')
      const data = await response.json()
      
      if (data.volumes) {
        setVolumes(data.volumes)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch volumes",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error("Error fetching volumes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch volumes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchIssues(volumeId?: string) {
    try {
      const url = volumeId 
        ? `/api/admin/archive/issues?volumeId=${volumeId}`
        : '/api/admin/archive/issues'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.issues) {
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

  async function fetchUnassignedArticles() {
    try {
      const response = await fetch('/api/archive?action=unassigned-articles')
      const data = await response.json()
      
      if (data.success) {
        setArticles(data.articles)
      }
    } catch (error) {
      logger.error("Error fetching articles:", error)
    }
  }

  async function createVolume() {
    if (!volumeForm.number || !volumeForm.year) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/archive/volumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(volumeForm.number),
          year: parseInt(volumeForm.year.toString()),
          title: volumeForm.title,
          description: volumeForm.description
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        setShowVolumeDialog(false)
        setVolumeForm({ number: '', year: new Date().getFullYear(), title: '', description: '', coverImage: '' })
        fetchVolumes()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create volume: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function createIssue() {
    if (!issueForm.volumeId || !issueForm.number) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-issue',
          ...issueForm,
          guestEditors: issueForm.guestEditors ? issueForm.guestEditors.split(',').map((e: string) => e.trim()) : []
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Issue created successfully"
        })
        setShowIssueDialog(false)
        setIssueForm({ volumeId: '', number: '', title: '', description: '', coverImage: '', specialIssue: false, guestEditors: '' })
        if (selectedVolume) {
          fetchIssues(selectedVolume.id)
        }
        fetchVolumes() // Refresh to update issue counts
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create issue: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function publishVolume(volumeId: string) {
    try {
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish-volume',
          volumeId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Volume published successfully"
        })
        fetchVolumes()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to publish volume: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function publishIssue(issueId: string) {
    try {
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish-issue',
          issueId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Issue published successfully"
        })
        if (selectedVolume) {
          fetchIssues(selectedVolume.id)
        }
        fetchVolumes()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to publish issue: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function assignArticleToIssue(articleId: string, issueId: string) {
    try {
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-article',
          articleId,
          issueId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Article assigned successfully"
        })
        fetchUnassignedArticles()
        if (selectedVolume) {
          fetchIssues(selectedVolume.id)
        }
        fetchVolumes()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to assign article: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4" />
      case 'draft':
        return <Clock className="h-4 w-4" />
      case 'archived':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading archive management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Archive Management</h1>
            <p className="text-gray-600">Manage volumes, issues, and article assignments</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => fetchVolumes()}>
              <Download className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowVolumeDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Volume
            </Button>
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="volumes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Volumes ({volumes.length})
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unassigned Articles ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Volumes Tab */}
          <TabsContent value="volumes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {volumes.map((volume) => (
                <Card 
                  key={volume.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedVolume?.id === volume.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedVolume(volume)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Volume {volume.number} ({volume.year})
                      </CardTitle>
                      <Badge className={getStatusColor(volume.status)}>
                        {getStatusIcon(volume.status)}
                        <span className="ml-1">{volume.status}</span>
                      </Badge>
                    </div>
                    {volume.title && (
                      <CardDescription>{volume.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Issues:</span>
                        <span>{volume.issueCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Articles:</span>
                        <span>{volume.articleCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span>{new Date(volume.createdAt).toLocaleDateString()}</span>
                      </div>
                      {volume.publishedDate && (
                        <div className="flex justify-between text-sm">
                          <span>Published:</span>
                          <span>{new Date(volume.publishedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        setEditingVolume(volume)
                        setShowVolumeDialog(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {volume.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            publishVolume(volume.id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        setIssueForm(prev => ({ ...prev, volumeId: volume.id }))
                        setShowIssueDialog(true)
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues">
            {selectedVolume ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    Issues in Volume {selectedVolume.number} ({selectedVolume.year})
                  </h2>
                  <Button onClick={() => {
                    setIssueForm(prev => ({ ...prev, volumeId: selectedVolume.id }))
                    setShowIssueDialog(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Issue
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {issues.map((issue) => (
                    <Card key={issue.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Issue {issue.number}
                            {issue.specialIssue && (
                              <Badge variant="outline" className="ml-2">Special</Badge>
                            )}
                          </CardTitle>
                          <Badge className={getStatusColor(issue.status)}>
                            {getStatusIcon(issue.status)}
                            <span className="ml-1">{issue.status}</span>
                          </Badge>
                        </div>
                        {issue.title && (
                          <CardDescription>{issue.title}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Articles:</span>
                            <span>{issue.articleCount}</span>
                          </div>
                          {issue.pageRange && (
                            <div className="flex justify-between text-sm">
                              <span>Pages:</span>
                              <span>{issue.pageRange}</span>
                            </div>
                          )}
                          {issue.guestEditors && issue.guestEditors.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Guest Editors:</span>
                              <p className="text-gray-600">{issue.guestEditors.join(", ")}</p>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>Created:</span>
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          </div>
                          {issue.publishedDate && (
                            <div className="flex justify-between text-sm">
                              <span>Published:</span>
                              <span>{new Date(issue.publishedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingIssue(issue)
                            setShowIssueDialog(true)
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {issue.status === 'draft' && (
                            <Button size="sm" onClick={() => publishIssue(issue.id)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedIssue(issue)
                            setShowAssignDialog(true)
                          }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Assign Articles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a volume to view its issues</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Articles</CardTitle>
                <CardDescription>Articles that haven't been assigned to any issue</CardDescription>
              </CardHeader>
              <CardContent>
                {articles.length > 0 ? (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <Card key={article.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{article.title}</h3>
                              <p className="text-sm text-gray-600">
                                Authors: {article.authors.join(", ")}
                              </p>
                              <p className="text-sm text-gray-500">
                                Submitted: {new Date(article.submittedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge>{article.status}</Badge>
                              <Button size="sm" onClick={() => {
                                // Set this article for assignment
                                setShowAssignDialog(true)
                              }}>
                                <Plus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No unassigned articles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Volumes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{volumes.length}</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Published: {volumes.filter(v => v.status === 'published').length}</div>
                    <div>Draft: {volumes.filter(v => v.status === 'draft').length}</div>
                    <div>Archived: {volumes.filter(v => v.status === 'archived').length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {volumes.reduce((sum, v) => sum + v.issueCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Across all volumes
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {volumes.reduce((sum, v) => sum + v.articleCount, 0)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Unassigned: {articles.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Volume Dialog */}
        <Dialog open={showVolumeDialog} onOpenChange={setShowVolumeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVolume ? 'Edit Volume' : 'Create New Volume'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume-number">Volume Number *</Label>
                  <Input
                    id="volume-number"
                    value={volumeForm.number}
                    onChange={(e) => setVolumeForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume-year">Year *</Label>
                  <Input
                    id="volume-year"
                    type="number"
                    value={volumeForm.year}
                    onChange={(e) => setVolumeForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume-title">Title</Label>
                <Input
                  id="volume-title"
                  value={volumeForm.title}
                  onChange={(e) => setVolumeForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Optional volume title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume-description">Description</Label>
                <Textarea
                  id="volume-description"
                  value={volumeForm.description}
                  onChange={(e) => setVolumeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional volume description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume-cover">Cover Image URL</Label>
                <Input
                  id="volume-cover"
                  value={volumeForm.coverImage}
                  onChange={(e) => setVolumeForm(prev => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="Optional cover image URL"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowVolumeDialog(false)
                  setEditingVolume(null)
                  setVolumeForm({ number: '', year: new Date().getFullYear(), title: '', description: '', coverImage: '' })
                }}>
                  Cancel
                </Button>
                <Button onClick={createVolume}>
                  {editingVolume ? 'Update' : 'Create'} Volume
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Issue Dialog */}
        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIssue ? 'Edit Issue' : 'Create New Issue'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue-volume">Volume *</Label>
                <Select 
                  value={issueForm.volumeId} 
                  onValueChange={(value) => setIssueForm(prev => ({ ...prev, volumeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select volume" />
                  </SelectTrigger>
                  <SelectContent>
                    {volumes.map((volume) => (
                      <SelectItem key={volume.id} value={volume.id}>
                        Volume {volume.number} ({volume.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-number">Issue Number *</Label>
                <Input
                  id="issue-number"
                  value={issueForm.number}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="e.g., 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-title">Title</Label>
                <Input
                  id="issue-title"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Optional issue title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-description">Description</Label>
                <Textarea
                  id="issue-description"
                  value={issueForm.description}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional issue description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="special-issue"
                  checked={issueForm.specialIssue}
                  onCheckedChange={(checked) => setIssueForm(prev => ({ ...prev, specialIssue: checked }))}
                />
                <Label htmlFor="special-issue">Special Issue</Label>
              </div>

              {issueForm.specialIssue && (
                <div className="space-y-2">
                  <Label htmlFor="guest-editors">Guest Editors</Label>
                  <Input
                    id="guest-editors"
                    value={issueForm.guestEditors}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, guestEditors: e.target.value }))}
                    placeholder="Comma-separated names"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowIssueDialog(false)
                  setEditingIssue(null)
                  setIssueForm({ volumeId: '', number: '', title: '', description: '', coverImage: '', specialIssue: false, guestEditors: '' })
                }}>
                  Cancel
                </Button>
                <Button onClick={createIssue}>
                  {editingIssue ? 'Update' : 'Create'} Issue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Article Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Articles to Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedIssue && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium">
                    Volume {selectedVolume?.number}, Issue {selectedIssue.number}
                  </h3>
                  {selectedIssue.title && (
                    <p className="text-sm text-gray-600">{selectedIssue.title}</p>
                  )}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2">
                {articles.map((article) => (
                  <Card key={article.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{article.title}</h4>
                        <p className="text-xs text-gray-600">{article.authors.join(", ")}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (selectedIssue) {
                            assignArticleToIssue(article.id, selectedIssue.id)
                            setShowAssignDialog(false)
                          }
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
