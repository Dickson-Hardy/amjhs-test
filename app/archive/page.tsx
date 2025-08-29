"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Calendar, User, Eye, SortAsc, BookOpen, BarChart3, Grid, List } from "lucide-react"
import Link from "next/link"
import { VolumeDisplay, IssueDisplay, ArchiveNavigation } from "@/components/archive/archive-components"

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

export default function ArchivePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("articles")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
    if (activeTab === "articles") {
      fetchArticles()
    }
  }, [searchTerm, selectedCategory, selectedYear, selectedVolumeFilter, sortBy, currentPage, activeTab])

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

  async function fetchInitialData() {
    setLoading(true)
    try {
      // Fetch volumes for navigation
      const volumesResponse = await fetch('/api/archive?action=volumes')
      const volumesData = await volumesResponse.json()
      
      if (volumesData.success) {
        setVolumes(volumesData.volumes)
      }

      // Fetch filter options
      const filterResponse = await fetch('/api/archive?action=archive&page=1&limit=1')
      const filterData = await filterResponse.json()
      
      if (filterData.success) {
        setFilterOptions(filterData.filters)
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

  if (loading && activeTab === "articles") {
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
          <p className="text-gray-600">Browse our complete collection of peer-reviewed research</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Browse by Volume</h3>
              <p className="text-gray-600 text-sm mb-4">Explore articles organized by journal volumes</p>
              <Button asChild>
                <Link href="/archive/enhanced">Enhanced Browse</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Advanced Search</h3>
              <p className="text-gray-600 text-sm mb-4">Find articles with powerful search filters</p>
              <Button variant="outline" onClick={() => setActiveTab("articles")}>
                Search Articles
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Archive Statistics</h3>
              <p className="text-gray-600 text-sm mb-4">View publication metrics and trends</p>
              <Button variant="outline" onClick={() => setActiveTab("statistics")}>
                View Statistics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Archive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Articles
            </TabsTrigger>
            <TabsTrigger value="volumes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Volumes
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Browse Issues
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Articles Search Tab */}
          <TabsContent value="articles">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Archive Navigation Sidebar */}
              <div className="lg:col-span-1">
                <ArchiveNavigation
                  volumes={volumes}
                  currentVolume={selectedVolumeFilter}
                  onVolumeChange={(volumeId) => {
                    const volume = volumes.find(v => v.id === volumeId)
                    if (volume) {
                      setSelectedVolumeFilter(volume.number)
                    }
                  }}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Search and Filters */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Search className="h-5 w-5 mr-2" />
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
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
              </div>
            </div>
          </TabsContent>

          {/* Volumes Tab */}
          <TabsContent value="volumes">
            <div className="space-y-6">
              {volumes.map((volume) => (
                <VolumeDisplay
                  key={volume.id}
                  volume={volume}
                  issues={selectedVolume?.id === volume.id ? issues : []}
                  showIssues={selectedVolume?.id === volume.id}
                />
              ))}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues">
            {selectedVolume ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Issues in Volume {selectedVolume.number} ({selectedVolume.year})</CardTitle>
                  </CardHeader>
                </Card>
                {issues.map((issue) => (
                  <IssueDisplay
                    key={issue.id}
                    issue={issue}
                    volume={selectedVolume}
                  />
                ))}
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
                  <div className="text-3xl font-bold">{volumes.length}</div>
                  <p className="text-gray-600">Total volumes published</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {volumes.reduce((sum, v) => sum + v.issueCount, 0)}
                  </div>
                  <p className="text-gray-600">Total issues published</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalCount}</div>
                  <p className="text-gray-600">Total articles archived</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
