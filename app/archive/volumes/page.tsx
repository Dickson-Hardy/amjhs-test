"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Calendar, 
  FileText,
  Download,
  ExternalLink,
  Search,
  Eye,
  Copy,
  Filter
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Article {
  id: string
  title: string
  abstract: string
  category: string
  doi?: string
  pages?: string
  publishedDate: string
  authors: string[]
  views: number
  downloads: number
  citations: number
  publicUrl: string
}

interface Volume {
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate: string
  articleCount: number
  totalViews: number
  totalDownloads: number
  publicUrl: string
  apiUrl: string
  articles?: Article[]
}

interface Statistics {
  overview: {
    total_volumes: number
    total_articles: number
    earliest_year: number
    latest_year: number
    total_views: number
    total_downloads: number
    total_categories: number
  }
  byYear: Array<{
    year: number
    volume_count: number
    article_count: number
    total_views: number
    total_downloads: number
  }>
  byCategory: Array<{
    category: string
    article_count: number
    volume_count: number
  }>
}

export default function PublicVolumesPage() {
  const [loading, setLoading] = useState(true)
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArticles, setIncludeArticles] = useState(false)

  useEffect(() => {
    fetchVolumes()
  }, [selectedYear, includeArticles])

  async function fetchVolumes() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (includeArticles) params.append('includeArticles', 'true')
      
      const response = await fetch(`/api/public/volumes?${params}`)
      const data = await response.json()

      if (data.success) {
        setVolumes(data.volumes)
        setStatistics(data.statistics)
      } else {
        throw new Error(data.error || 'Failed to fetch volumes')
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

  async function fetchVolumeDetails(volumeNumber: string) {
    try {
      const response = await fetch(`/api/public/volumes/${volumeNumber}`)
      const data = await response.json()

      if (data.success) {
        setSelectedVolume({
          number: data.volume.number,
          year: data.volume.year,
          title: data.volume.title,
          description: data.volume.description,
          coverImage: data.volume.coverImage,
          publishedDate: data.volume.publishedDate,
          articleCount: data.statistics.totalArticles,
          totalViews: data.statistics.totalViews,
          totalDownloads: data.statistics.totalDownloads,
          publicUrl: data.publicUrl,
          apiUrl: `/api/public/volumes/${volumeNumber}`,
          articles: data.articles
        })
      } else {
        throw new Error(data.error || 'Failed to fetch volume details')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch volume details: ${(error as Error).message}`,
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

  function filterVolumes() {
    if (!searchTerm) return volumes
    
    return volumes.filter(volume =>
      volume.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volume.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volume.number.includes(searchTerm) ||
      volume.year.toString().includes(searchTerm)
    )
  }

  const filteredVolumes = filterVolumes()
  const availableYears = statistics?.byYear.map(stat => stat.year) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading journal archive...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Journal Archive</h1>
          <p className="text-xl text-gray-600 mb-6">
            Advances in Medicine and Health Sciences Journal - Published Volumes
          </p>
          
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{statistics.overview.total_volumes}</p>
                  <p className="text-sm text-gray-600">Published Volumes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{statistics.overview.total_articles}</p>
                  <p className="text-sm text-gray-600">Research Articles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{statistics.overview.total_views?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Download className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{statistics.overview.total_downloads?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search volumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setIncludeArticles(!includeArticles)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {includeArticles ? 'Hide Articles' : 'Show Articles'}
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="volumes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volumes">Published Volumes</TabsTrigger>
            <TabsTrigger value="details">Volume Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="volumes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVolumes.map((volume) => (
                <Card key={volume.number} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Volume {volume.number} ({volume.year})
                      </CardTitle>
                      <Badge variant="outline">
                        {volume.articleCount} articles
                      </Badge>
                    </div>
                    {volume.title && (
                      <CardDescription>{volume.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {volume.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {volume.description.substring(0, 150)}...
                      </p>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Views:</span>
                        <br />
                        {volume.totalViews.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Downloads:</span>
                        <br />
                        {volume.totalDownloads.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Published:</span>
                        <br />
                        {new Date(volume.publishedDate).toLocaleDateString()}
                      </div>
                    </div>

                    {volume.articles && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Articles:</p>
                        <div className="space-y-1">
                          {volume.articles.slice(0, 3).map((article) => (
                            <div key={article.id} className="text-xs text-gray-600">
                              • {article.title.substring(0, 50)}...
                            </div>
                          ))}
                          {volume.articles.length > 3 && (
                            <div className="text-xs text-gray-500">
                              + {volume.articles.length - 3} more articles
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => fetchVolumeDetails(volume.number)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(volume.publicUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}${volume.publicUrl}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedVolume ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Volume {selectedVolume.number} ({selectedVolume.year})
                    </CardTitle>
                    {selectedVolume.title && (
                      <CardDescription className="text-lg">{selectedVolume.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {selectedVolume.description && (
                      <p className="text-gray-600 mb-4">{selectedVolume.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedVolume.articleCount}</p>
                        <p className="text-sm text-gray-600">Articles</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedVolume.totalViews.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedVolume.totalDownloads.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Downloads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedVolume.year}</p>
                        <p className="text-sm text-gray-600">Published</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => window.open(selectedVolume.publicUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Volume
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}${selectedVolume.publicUrl}`)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {selectedVolume.articles && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Articles in this Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedVolume.articles.map((article, index) => (
                          <div key={article.id} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-medium mb-1">
                              Article {index + 1}: {article.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {article.abstract}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Authors: {article.authors.join(', ')}</span>
                              <span>Category: {article.category}</span>
                              {article.doi && <span>DOI: {article.doi}</span>}
                              {article.pages && <span>Pages: {article.pages}</span>}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>Views: {article.views}</span>
                              <span>Downloads: {article.downloads}</span>
                              <span>Citations: {article.citations}</span>
                              <Button 
                                size="sm" 
                                variant="link" 
                                className="h-auto p-0 text-xs"
                                onClick={() => window.open(article.publicUrl, '_blank')}
                              >
                                Read Article →
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a volume to view detailed information</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {statistics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Publication Statistics by Year</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statistics.byYear.map((yearStat) => (
                        <div key={yearStat.year} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{yearStat.year}</h4>
                            <p className="text-sm text-gray-600">
                              {yearStat.volume_count} volumes, {yearStat.article_count} articles
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>{yearStat.total_views?.toLocaleString()} views</p>
                            <p>{yearStat.total_downloads?.toLocaleString()} downloads</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Publication Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {statistics.byCategory.map((categoryStat) => (
                        <div key={categoryStat.category} className="p-3 border rounded">
                          <h4 className="font-medium capitalize">{categoryStat.category}</h4>
                          <p className="text-sm text-gray-600">
                            {categoryStat.article_count} articles across {categoryStat.volume_count} volumes
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}