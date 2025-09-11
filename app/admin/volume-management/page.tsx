"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  BarChart3,
  ExternalLink,
  Copy,
  Globe
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
  articleCount: number
  publishedCount: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Article {
  id: string
  title: string
  abstract: string
  keywords: string[]
  category: string
  status: string
  doi?: string
  doiRegistered?: boolean
  volume?: string
  issue?: string
  pages?: string
  publishedDate?: string
  submittedDate: string
  authorId: string
  coAuthors: any[]
  views: number
  downloads: number
  citations: number
  createdAt: string
  updatedAt: string
}

interface Statistics {
  totalVolumes: number
  totalArticles: number
  publishedArticles: number
  earliestYear: number
  latestYear: number
}

class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export default function VolumeManagementDashboard() {
  const [loading, setLoading] = useState(true)
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [unassignedArticles, setUnassignedArticles] = useState<Article[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [activeTab, setActiveTab] = useState('volumes')
  
  // Form states
  const [showVolumeDialog, setShowVolumeDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  
  const [volumeForm, setVolumeForm] = useState({
    number: '',
    year: new Date().getFullYear(),
    title: '',
    description: '',
    coverImage: ''
  })

  const [selectedArticles, setSelectedArticles] = useState<string[]>([])

  useEffect(() => {
    fetchVolumes()
    fetchUnassignedArticles()
    fetchStatistics()
  }, [])

  useEffect(() => {
    if (selectedVolume) {
      fetchVolumeArticles(selectedVolume.id)
    }
  }, [selectedVolume])

  async function fetchVolumes() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/volumes?includeStats=true')
      const data = await response.json()

      if (data.success) {
        setVolumes(data.volumes)
        if (data.statistics) {
          setStatistics(data.statistics)
        }
      } else {
        throw new AppError(data.error || 'Failed to fetch volumes')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch volumes: ${(error as Error).message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchVolumeArticles(volumeId: string) {
    try {
      const response = await fetch(`/api/admin/volumes/${volumeId}/articles?includeMetadata=true`)
      const data = await response.json()

      if (data.success) {
        setArticles(data.articles)
      } else {
        throw new AppError(data.error || 'Failed to fetch articles')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch articles: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function fetchUnassignedArticles() {
    try {
      const response = await fetch('/api/articles?status=accepted&volume=null&limit=100')
      const data = await response.json()

      if (data.success) {
        setUnassignedArticles(data.articles)
      } else {
        throw new AppError(data.error || 'Failed to fetch unassigned articles')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch unassigned articles: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function fetchStatistics() {
    try {
      const response = await fetch('/api/admin/volumes?includeStats=true&status=published')
      const data = await response.json()

      if (data.success && data.statistics) {
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.warn('Failed to fetch statistics:', error)
    }
  }

  async function createVolume() {
    try {
      if (!volumeForm.number || !volumeForm.year) {
        toast({
          title: "Error",
          description: "Volume number and year are required",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/admin/volumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volumeForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        setShowVolumeDialog(false)
        setVolumeForm({
          number: '',
          year: new Date().getFullYear(),
          title: '',
          description: '',
          coverImage: ''
        })
        fetchVolumes()
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create volume: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  async function publishVolume(volumeId: string) {
    try {
      const response = await fetch(`/api/admin/volumes/${volumeId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        setShowPublishDialog(false)
        fetchVolumes()
        if (selectedVolume?.id === volumeId) {
          fetchVolumeArticles(volumeId)
        }
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

  async function assignArticlesToVolume() {
    try {
      if (!selectedVolume || !selectedArticles?.length) {
        toast({
          title: "Error",
          description: "Please select articles to assign",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/admin/volumes/${selectedVolume.id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: selectedArticles,
          generateDOIs: true
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        setShowAssignDialog(false)
        setSelectedArticles([])
        fetchVolumes()
        fetchUnassignedArticles()
        fetchVolumeArticles(selectedVolume.id)
      } else {
        throw new AppError(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to assign articles: ${(error as Error).message}`,
        variant: "destructive"
      })
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Link copied to clipboard"
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'archived':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
          <p className="text-gray-600">Loading volume management...</p>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Volume Management</h1>
            <p className="text-gray-600">Manage journal volumes and direct article publication</p>
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

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Volumes</p>
                    <p className="text-2xl font-bold">{statistics.totalVolumes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Articles</p>
                    <p className="text-2xl font-bold">{statistics.totalArticles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold">{statistics.publishedArticles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unassigned</p>
                    <p className="text-2xl font-bold">{unassignedArticles?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Year Range</p>
                    <p className="text-2xl font-bold">{statistics.earliestYear}-{statistics.latestYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volumes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Volumes ({volumes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Volume Articles ({articles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unassigned Articles ({unassignedArticles?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Volumes Tab */}
          <TabsContent value="volumes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {volumes?.map((volume) => (
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
                        <span>Total Articles:</span>
                        <span>{volume.articleCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Published:</span>
                        <span>{volume.publishedCount}</span>
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
                        setSelectedVolume(volume)
                        setShowAssignDialog(true)
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Assign Articles
                      </Button>
                      
                      {volume.status === 'draft' && volume.articleCount > 0 && (
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVolume(volume)
                          setShowPublishDialog(true)
                        }}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                      
                      {volume.status === 'published' && (
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(`${window.location.origin}/archive/volume/${volume.number}`)
                        }}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Volume Articles Tab */}
          <TabsContent value="articles">
            {selectedVolume ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Volume {selectedVolume.number} ({selectedVolume.year})
                    </h3>
                    <p className="text-gray-600">{selectedVolume.title}</p>
                  </div>
                  {selectedVolume.status === 'published' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard(`${window.location.origin}/archive/volume/${selectedVolume.number}`)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Public Link
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`/archive/volume/${selectedVolume.number}`, '_blank')}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        View Public
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {articles?.map((article, index) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                            <CardDescription className="text-sm mb-2">
                              {article.abstract.substring(0, 200)}...
                            </CardDescription>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Article #{index + 1}</span>
                              {article.pages && <span>Pages: {article.pages}</span>}
                              {article.doi && (
                                <div className="flex items-center gap-1">
                                  <span>DOI: {article.doi}</span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => copyToClipboard(article.doi!)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              <Badge className={getStatusColor(article.status)}>
                                {article.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/article/${article.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Views:</span> {article.views}
                          </div>
                          <div>
                            <span className="font-medium">Downloads:</span> {article.downloads}
                          </div>
                          <div>
                            <span className="font-medium">Citations:</span> {article.citations}
                          </div>
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
                  <p className="text-gray-500">Select a volume to view its articles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Unassigned Articles Tab */}
          <TabsContent value="unassigned">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Accepted Articles Ready for Assignment
                </h3>
                <Button 
                  onClick={() => setShowAssignDialog(true)}
                  disabled={!selectedArticles?.length || !selectedVolume}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Selected ({selectedArticles?.length || 0})
                </Button>
              </div>

              {!unassignedArticles?.length ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-500">All accepted articles have been assigned to volumes</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {unassignedArticles?.map((article) => (
                    <Card key={article.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(article.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedArticles([...selectedArticles, article.id])
                                } else {
                                  setSelectedArticles(selectedArticles.filter(id => id !== article.id))
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{article.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {article.abstract.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Category: {article.category}</span>
                                <span>Submitted: {new Date(article.submittedDate).toLocaleDateString()}</span>
                                <Badge className={getStatusColor(article.status)}>
                                  {article.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Volume Dialog */}
        <Dialog open={showVolumeDialog} onOpenChange={setShowVolumeDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Volume</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number" className="text-right">
                  Volume Number
                </Label>
                <Input
                  id="number"
                  value={volumeForm.number}
                  onChange={(e) => setVolumeForm({ ...volumeForm, number: e.target.value })}
                  placeholder="1"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={volumeForm.year}
                  onChange={(e) => setVolumeForm({ ...volumeForm, year: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={volumeForm.title}
                  onChange={(e) => setVolumeForm({ ...volumeForm, title: e.target.value })}
                  placeholder="Volume 1 - Inaugural Issue"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={volumeForm.description}
                  onChange={(e) => setVolumeForm({ ...volumeForm, description: e.target.value })}
                  placeholder="Description of this volume's contents..."
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVolumeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createVolume}>
                Create Volume
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Articles Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Assign Articles to {selectedVolume ? `Volume ${selectedVolume.number}` : 'Volume'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedVolume && (
                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <h3 className="font-medium">
                    Volume {selectedVolume.number} ({selectedVolume.year})
                  </h3>
                  {selectedVolume.title && (
                    <p className="text-sm text-gray-600">{selectedVolume.title}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Current articles: {selectedVolume.articleCount}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected Articles ({selectedArticles?.length || 0}):
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedArticles?.map((articleId) => {
                    const article = unassignedArticles.find(a => a.id === articleId)
                    if (!article) return null
                    
                    return (
                      <div key={articleId} className="p-3 bg-gray-50 rounded border">
                        <h4 className="font-medium text-sm">{article.title}</h4>
                        <p className="text-xs text-gray-600">{article.category}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={assignArticlesToVolume}
                disabled={selectedArticles.length === 0 || !selectedVolume}
              >
                Assign {selectedArticles?.length || 0} Articles
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish Volume Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Publish Volume</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedVolume && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-medium text-yellow-800">
                      Ready to Publish Volume {selectedVolume.number}?
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will make all {selectedVolume.articleCount} articles publicly accessible.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Publishing will:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Set volume status to "Published"</li>
                      <li>• Make all articles publicly accessible</li>
                      <li>• Generate public archive links</li>
                      <li>• Enable DOI registration for articles</li>
                      <li>• Send notifications to authors</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedVolume && publishVolume(selectedVolume.id)}
                disabled={!selectedVolume}
              >
                Publish Volume
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}