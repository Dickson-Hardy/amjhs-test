"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Download, 
  Calendar, 
  User, 
  Eye, 
  SortAsc, 
  BookOpen,
  FileText,
  BarChart3,
  Filter,
  Grid,
  List
} from "lucide-react"
import Link from "next/link"

interface Article {
  id: string
  title: string
  abstract: string
  authors: string[]
  authorAffiliations: string[]
  keywords: string[]
  category: string
  volume: string
  issue: string
  pages: string
  publishedDate: string
  doi: string
  pdfUrl: string
  status: string
  viewCount: number
  downloadCount: number
  citationCount: number
}

interface Volume {
  id: string
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: string
  status: string
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
  status: string
  articleCount: number
  pageRange?: string
  specialIssue: boolean
  guestEditors?: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface ArchiveStatistics {
  totalVolumes: number
  totalIssues: number
  totalArticles: number
  yearRange: { start: number; end: number }
  volumeRange: { start: string; end: string }
  categoryCounts: Record<string, number>
  monthlyPublications: Array<{ month: string; count: number }>
  downloadStats: { total: number; thisMonth: number }
  viewStats: { total: number; thisMonth: number }
}

export default function EnhancedArchivePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [statistics, setStatistics] = useState<ArchiveStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("browse")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState("all")
  const [selectedIssueFilter, setSelectedIssueFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    years: [],
    volumes: [],
    issues: []
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === "browse") {
      fetchArticles()
    }
  }, [searchTerm, selectedCategory, selectedYear, selectedVolumeFilter, selectedIssueFilter, sortBy, currentPage, activeTab])

  useEffect(() => {
    if (activeTab === "volumes") {
      fetchVolumes()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedVolume) {
      fetchIssues(selectedVolume.id)
    }
  }, [selectedVolume])

  useEffect(() => {
    if (activeTab === "statistics") {
      fetchStatistics()
    }
  }, [activeTab])

  async function fetchInitialData() {
    setLoading(true)
    try {
      // Fetch filter options
      const response = await fetch('/api/archive?action=archive&page=1&limit=1')
      const data = await response.json()
      
      if (data.success) {
        setFilterOptions(data.filters)
      }
    } catch (error) {
      logger.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchArticles() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'archive',
        search: searchTerm,
        category: selectedCategory === 'all' ? '' : selectedCategory,
        year: selectedYear === 'all' ? '' : selectedYear,
        volume: selectedVolumeFilter === 'all' ? '' : selectedVolumeFilter,
        issue: selectedIssueFilter === 'all' ? '' : selectedIssueFilter,
        sortBy,
        page: currentPage.toString(),
        limit: "10"
      })

      const response = await fetch(`/api/archive?${params}`)
      const data = await response.json()

      if (data.success) {
        setArticles(data.articles)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
        setFilterOptions(data.filters)
      }
    } catch (error) {
      logger.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchVolumes() {
    try {
      const response = await fetch('/api/archive?action=volumes')
      const data = await response.json()
      
      if (data.success) {
        setVolumes(data.volumes)
      }
    } catch (error) {
      logger.error("Error fetching volumes:", error)
    }
  }

  async function fetchIssues(volumeId: string) {
    try {
      const response = await fetch(`/api/archive?action=issues&volumeId=${volumeId}`)
      const data = await response.json()
      
      if (data.success) {
        setIssues(data.issues)
      }
    } catch (error) {
      logger.error("Error fetching issues:", error)
    }
  }

  async function fetchStatistics() {
    try {
      const response = await fetch('/api/archive?action=statistics')
      const data = await response.json()
      
      if (data.success) {
        setStatistics(data.statistics)
      }
    } catch (error) {
      logger.error("Error fetching statistics:", error)
    }
  }

  if (loading && activeTab === "browse") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Search className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading archive...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Journal Archive</h1>
          <p className="text-gray-600">Explore our comprehensive collection of peer-reviewed research</p>
        </div>

        {/* Archive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse Articles
            </TabsTrigger>
            <TabsTrigger value="volumes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Volumes & Issues
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Browse Articles Tab */}
          <TabsContent value="browse">
            {/* Search and Filters */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Search & Filter
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Search Articles</label>
                    <Input
                      placeholder="Title, author, keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {filterOptions.categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {filterOptions.years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Volume</label>
                    <Select value={selectedVolumeFilter} onValueChange={setSelectedVolumeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Volumes</SelectItem>
                        {filterOptions.volumes.map((volume) => (
                          <SelectItem key={volume} value={volume}>
                            Vol. {volume}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="downloads">Most Downloaded</SelectItem>
                        <SelectItem value="views">Most Viewed</SelectItem>
                        <SelectItem value="volume">By Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-600">
                Showing {articles.length} of {totalCount} articles
                {searchTerm && ` for "${searchTerm}"`}
              </div>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>

            {/* Articles List/Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-800">{article.category}</Badge>
                          <span className="text-sm text-gray-500">
                            Vol. {article.volume}, No. {article.issue}
                          </span>
                          {article.pages && (
                            <span className="text-sm text-gray-500">
                              pp. {article.pages}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl hover:text-blue-600 cursor-pointer mb-2">
                          <Link href={`/article/${article.id}`}>{article.title}</Link>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          <div className="flex items-center text-gray-600 mb-1">
                            <User className="h-4 w-4 mr-1" />
                            {article.authors.join(", ")}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            Published: {new Date(article.publishedDate).toLocaleDateString()}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.viewCount.toLocaleString()} views
                        </div>
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {article.downloadCount.toLocaleString()} downloads
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {viewMode === 'list' && (
                    <CardContent>
                      <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">{article.abstract}</p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.keywords.slice(0, 5).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {article.keywords.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{article.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {article.doi && (
                            <>
                              <span className="font-medium">DOI:</span> {article.doi}
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/article/${article.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {article.pdfUrl && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                              <Link href={article.pdfUrl} target="_blank">
                                <Download className="h-4 w-4 mr-1" />
                                Download PDF
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2)
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Volumes & Issues Tab */}
          <TabsContent value="volumes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volumes List */}
              <Card>
                <CardHeader>
                  <CardTitle>Volumes</CardTitle>
                  <CardDescription>Browse by journal volumes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {volumes.map((volume) => (
                      <Card 
                        key={volume.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedVolume?.id === volume.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedVolume(volume)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                Volume {volume.number} ({volume.year})
                              </h3>
                              {volume.title && (
                                <p className="text-sm text-gray-600">{volume.title}</p>
                              )}
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                <span>{volume.issueCount} issues</span>
                                <span>{volume.articleCount} articles</span>
                              </div>
                            </div>
                            <Badge 
                              variant={volume.status === 'published' ? 'default' : 'secondary'}
                            >
                              {volume.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Issues List */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Issues
                    {selectedVolume && ` - Volume ${selectedVolume.number}`}
                  </CardTitle>
                  <CardDescription>
                    {selectedVolume 
                      ? `Issues in Volume ${selectedVolume.number} (${selectedVolume.year})`
                      : 'Select a volume to view issues'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedVolume ? (
                    <div className="space-y-4">
                      {issues.map((issue) => (
                        <Card key={issue.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  Issue {issue.number}
                                  {issue.specialIssue && (
                                    <Badge variant="outline" className="ml-2">
                                      Special Issue
                                    </Badge>
                                  )}
                                </h3>
                                {issue.title && (
                                  <p className="text-sm text-gray-600">{issue.title}</p>
                                )}
                                <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                  <span>{issue.articleCount} articles</span>
                                  {issue.publishedDate && (
                                    <span>
                                      Published: {new Date(issue.publishedDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {issue.guestEditors && issue.guestEditors.length > 0 && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Guest Editors: {issue.guestEditors.join(", ")}
                                  </p>
                                )}
                              </div>
                              <Badge 
                                variant={issue.status === 'published' ? 'default' : 'secondary'}
                              >
                                {issue.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {issues.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No issues found in this volume</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Select a volume to view its issues</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            {statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalArticles.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {statistics.totalVolumes} volumes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalIssues.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.yearRange.start} - {statistics.yearRange.end}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.viewStats.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      All time article views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.downloadStats.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      All time PDF downloads
                    </p>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Articles by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(statistics.categoryCounts).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading statistics...</p>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Publication Timeline</CardTitle>
                <CardDescription>View publication history over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Timeline visualization coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
