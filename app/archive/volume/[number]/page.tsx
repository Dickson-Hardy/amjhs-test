"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Calendar, 
  FileText,
  Download,
  ExternalLink,
  Search,
  Eye,
  Copy,
  Users,
  Quote,
  Share2,
  Printer as Print,
  Bookmark
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { notFound } from "next/navigation"

interface Article {
  id: string
  title: string
  abstract: string
  keywords: string[]
  category: string
  doi?: string
  pages?: string
  publishedDate: string
  authors: string[]
  views: number
  downloads: number
  citations: number
  articleNumber: number
  pdfUrl?: string
  publicUrl: string
  citationText: string
}

interface Volume {
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate: string
  metadata: any
}

interface VolumeStatistics {
  totalArticles: number
  totalViews: number
  totalDownloads: number
  totalCitations: number
  categories: string[]
  pageRange?: string
}

interface CitationFormats {
  apa: string
  mla: string
  chicago: string
}

export default function PublicVolumePage({ params }: { params: { number: string } }) {
  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState<Volume | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [statistics, setStatistics] = useState<VolumeStatistics | null>(null)
  const [citationFormats, setCitationFormats] = useState<CitationFormats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('order')

  useEffect(() => {
    fetchVolumeData()
  }, [params.number])

  async function fetchVolumeData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/volumes/${params.number}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          notFound()
        }
        throw new Error('Failed to fetch volume data')
      }

      const data = await response.json()

      if (data.success) {
        setVolume(data.volume)
        setArticles(data.articles)
        setStatistics(data.statistics)
        setCitationFormats(data.citationFormat)
      } else {
        throw new Error(data.error || 'Failed to load volume')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load volume: ${(error as Error).message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, type: string = 'link') {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`
    })
  }

  function shareVolume() {
    if (navigator.share) {
      navigator.share({
        title: `${volume?.title || `Volume ${volume?.number}`} - AMHSJ`,
        text: volume?.description || `Volume ${volume?.number} of Advances in Medicine and Health Sciences Journal`,
        url: window.location.href
      })
    } else {
      copyToClipboard(window.location.href, 'Volume link')
    }
  }

  function filterAndSortArticles() {
    let filtered = articles

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        article.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    // Sort articles
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'date':
        filtered.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
        break
      case 'views':
        filtered.sort((a, b) => b.views - a.views)
        break
      case 'citations':
        filtered.sort((a, b) => b.citations - a.citations)
        break
      default: // 'order'
        filtered.sort((a, b) => a.articleNumber - b.articleNumber)
    }

    return filtered
  }

  const filteredArticles = filterAndSortArticles()
  const categories = statistics?.categories || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading volume...</p>
        </div>
      </div>
    )
  }

  if (!volume || !statistics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Volume Not Found</h1>
          <p className="text-gray-600">The requested volume could not be found or is not yet published.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Volume {volume.number} ({volume.year})
            </h1>
            {volume.title && (
              <h2 className="text-xl md:text-2xl font-light mb-6 text-blue-100">
                {volume.title}
              </h2>
            )}
            <p className="text-lg text-blue-100 mb-8">
              Advances in Medicine and Health Sciences Journal
            </p>
            
            {/* Volume Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{statistics.totalArticles}</p>
                <p className="text-sm text-blue-100">Articles</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{statistics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-blue-100">Views</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{statistics.totalDownloads.toLocaleString()}</p>
                <p className="text-sm text-blue-100">Downloads</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{statistics.totalCitations}</p>
                <p className="text-sm text-blue-100">Citations</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button 
                variant="secondary" 
                onClick={shareVolume}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Volume
              </Button>
              <Button 
                variant="secondary"
                onClick={() => copyToClipboard(window.location.href, 'Volume link')}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.print()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Print className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Volume Description */}
        {volume.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">About This Volume</h3>
              <p className="text-gray-700 leading-relaxed">{volume.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <span>Published: {new Date(volume.publishedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
                {statistics.pageRange && <span>Pages: {statistics.pageRange}</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search articles by title, authors, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="order">Article Order</option>
                  <option value="title">Title A-Z</option>
                  <option value="date">Newest First</option>
                  <option value="views">Most Viewed</option>
                  <option value="citations">Most Cited</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Articles ({filteredArticles.length})
          </h3>

          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No articles found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Article {article.articleNumber}</Badge>
                        <Badge variant="secondary">{article.category.replace('_', ' ')}</Badge>
                        {article.pages && <Badge variant="outline">Pages {article.pages}</Badge>}
                      </div>
                      <CardTitle className="text-xl mb-2 leading-tight">
                        <a 
                          href={article.publicUrl}
                          className="text-blue-900 hover:text-blue-700 transition-colors"
                        >
                          {article.title}
                        </a>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="h-4 w-4" />
                        <span>{article.authors.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {article.abstract}
                  </p>

                  {/* Keywords */}
                  {article.keywords.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {article.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Article Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Published:</span>
                      <br />
                      {new Date(article.publishedDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Views:</span>
                      <br />
                      {article.views.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Downloads:</span>
                      <br />
                      {article.downloads.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Citations:</span>
                      <br />
                      {article.citations}
                    </div>
                  </div>

                  {/* DOI */}
                  {article.doi && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-600">DOI: </span>
                      <a 
                        href={`https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {article.doi}
                      </a>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(`https://doi.org/${article.doi}`, 'DOI')}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <a href={article.publicUrl}>
                        <Eye className="h-4 w-4 mr-2" />
                        Read Article
                      </a>
                    </Button>
                    {article.pdfUrl && (
                      <Button variant="outline" asChild>
                        <a href={article.pdfUrl} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => copyToClipboard(article.citationText, 'Citation')}
                    >
                      <Quote className="h-4 w-4 mr-2" />
                      Cite
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}${article.publicUrl}`, 'Article link')}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Volume Citation */}
        {citationFormats && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Cite This Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">APA Style:</p>
                  <p className="text-sm font-mono bg-gray-50 p-3 rounded border">
                    {citationFormats.apa}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">MLA Style:</p>
                  <p className="text-sm font-mono bg-gray-50 p-3 rounded border">
                    {citationFormats.mla}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">Chicago Style:</p>
                  <p className="text-sm font-mono bg-gray-50 p-3 rounded border">
                    {citationFormats.chicago}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <a href="/archive">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse All Volumes
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}