"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import RouteGuard from "@/components/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Globe,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface NewsItem {
  id: string
  title: string
  content: string
  excerpt: string
  type: 'announcement' | 'news' | 'call-for-papers' | 'warning' | 'update'
  category: string
  authorName: string
  publishedAt: string
  isPublished: boolean
  slug: string
  tags: string[]
}

export default function NewsManagementPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form state for creating/editing news
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    type: 'announcement' as 'announcement' | 'news' | 'call-for-papers' | 'warning' | 'update',
    category: '',
    authorName: '',
    isPublished: true,
    tags: ''
  })

  useEffect(() => {
    fetchNewsItems()
  }, [])

  const fetchNewsItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/news')
      const data = await response.json()
      
      if (data.success) {
        setNewsItems(data.news)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch news items",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error("Error fetching news:", error)
      toast({
        title: "Error",
        description: "Failed to fetch news items",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNews = async () => {
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          authorName: formData.authorName || session?.user?.name || 'Editorial Team'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "News item created successfully"
        })
        setIsCreateModalOpen(false)
        resetForm()
        fetchNewsItems()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create news item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const handleUpdateNews = async () => {
    if (!editingNews) return

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      const response = await fetch(`/api/admin/news/${editingNews.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "News item updated successfully"
        })
        setIsEditModalOpen(false)
        setEditingNews(null)
        resetForm()
        fetchNewsItems()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update news item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm("Are you sure you want to delete this news item?")) return

    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "News item deleted successfully"
        })
        fetchNewsItems()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete news item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const handleTogglePublish = async (newsId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/news/${newsId}/toggle-publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `News item ${!currentStatus ? 'published' : 'unpublished'} successfully`
        })
        fetchNewsItems()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to toggle publish status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const openEditModal = (newsItem: NewsItem) => {
    setEditingNews(newsItem)
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt,
      type: newsItem.type,
      category: newsItem.category,
      authorName: newsItem.authorName,
      isPublished: newsItem.isPublished,
      tags: newsItem.tags.join(', ')
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      type: 'announcement' as 'announcement' | 'news' | 'call-for-papers' | 'warning' | 'update',
      category: '',
      authorName: '',
      isPublished: true,
      tags: ''
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800'
      case 'news': return 'bg-green-100 text-green-800'
      case 'call-for-papers': return 'bg-purple-100 text-purple-800'
      case 'warning': return 'bg-red-100 text-red-800'
      case 'update': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                News & Announcements Management
              </h1>
              <p className="text-gray-600">
                Manage journal announcements, news, and updates
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create News Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create News Item</DialogTitle>
                  <DialogDescription>
                    Create a new announcement or news item for the journal
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter news title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'announcement' | 'news' | 'call-for-papers' | 'warning' | 'update') => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="call-for-papers">Call for Papers</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., submission, editorial, special-issue"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief summary for homepage display"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Full Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Full content of the news item"
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="authorName">Author Name</Label>
                      <Input
                        id="authorName"
                        value={formData.authorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                        placeholder="Author or Editorial Team"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="research, submission, deadline"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    />
                    <Label htmlFor="isPublished">Publish immediately</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateNews} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Create News Item
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* News Items List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading news items...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No news items found. Create your first news item!</p>
              </CardContent>
            </Card>
          ) : (
            newsItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                      <CardDescription className="mb-2">{item.excerpt}</CardDescription>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge className={getTypeColor(item.type)}>
                          {item.type.replace('-', ' ')}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline">{item.category}</Badge>
                        )}
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                        <span>By {item.authorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isPublished ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">Tags:</span>
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(item.id, item.isPublished)}
                      >
                        {item.isPublished ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteNews(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit News Item</DialogTitle>
              <DialogDescription>
                Update the news item information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter news title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'announcement' | 'news' | 'call-for-papers' | 'warning' | 'update') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="call-for-papers">Call for Papers</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., submission, editorial, special-issue"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-excerpt">Excerpt</Label>
                <Textarea
                  id="edit-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary for homepage display"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-content">Full Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Full content of the news item"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-authorName">Author Name</Label>
                  <Input
                    id="edit-authorName"
                    value={formData.authorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    placeholder="Author or Editorial Team"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="research, submission, deadline"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                <Label htmlFor="edit-isPublished">Published</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateNews} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Update News Item
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  )
}
