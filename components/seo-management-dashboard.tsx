"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  RefreshCw, 
  FileText,
  Globe,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Settings,
  ExternalLink,
  Download,
  Eye,
  TrendingUp,
  Users,
  Clock
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface SEOMetrics {
  totalIndexedPages: number
  totalKeywords: number
  averagePageLoadTime: number
  mobileFriendlyPages: number
  structuredDataPages: number
  lastSitemapUpdate: string
  pendingSEOTasks: number
}

interface SEOIssue {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  affectedPages: number
  priority: 'high' | 'medium' | 'low'
  fixSuggestion: string
}

interface ArticleSEO {
  id: string
  title: string
  metaTitle: string
  metaDescription: string
  url: string
  keywords: string[]
  lastUpdated: string
  seoScore: number
  issues: string[]
}

export default function SEOManagementDashboard() {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null)
  const [seoIssues, setSeoIssues] = useState<SEOIssue[]>([])
  const [articlesSEO, setArticlesSEO] = useState<ArticleSEO[]>([])
  const [selectedArticle, setSelectedArticle] = useState<ArticleSEO | null>(null)
  const [sitemapStatus, setSitemapStatus] = useState<'generating' | 'ready' | 'error' | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load SEO metrics
      const metricsResponse = await fetch('/api/seo?action=metrics')
      const metricsData = await metricsResponse.json()
      
      if (metricsData.success) {
        setMetrics(metricsData.metrics)
      }

      // Load SEO issues
      const issuesResponse = await fetch('/api/seo?action=issues')
      const issuesData = await issuesResponse.json()
      
      if (issuesData.success) {
        setSeoIssues(issuesData.issues)
      }

      // Load articles SEO data
      const articlesResponse = await fetch('/api/seo?action=articles-seo')
      const articlesData = await articlesResponse.json()
      
      if (articlesData.success) {
        setArticlesSEO(articlesData.articles)
      }
    } catch (error) {
      logger.error("Failed to load dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load SEO dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const regenerateSitemap = async () => {
    setSitemapStatus('generating')
    
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-sitemap' })
      })

      const data = await response.json()

      if (data.success) {
        setSitemapStatus('ready')
        toast({
          title: "Success",
          description: "Sitemap regenerated successfully"
        })
        loadDashboardData()
      } else {
        setSitemapStatus('error')
        toast({
          title: "Error",
          description: data.error || "Failed to regenerate sitemap",
          variant: "destructive"
        })
      }
    } catch (error) {
      setSitemapStatus('error')
      toast({
        title: "Error",
        description: "Failed to regenerate sitemap",
        variant: "destructive"
      })
    }
  }

  const regenerateAllSEO = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-all-seo' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "All SEO metadata regenerated successfully"
        })
        loadDashboardData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to regenerate SEO metadata",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate SEO metadata",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateArticleSEO = async (articleId: string, seoData: Partial<ArticleSEO>) => {
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update-article-seo',
          articleId,
          seoData
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Article SEO updated successfully"
        })
        loadDashboardData()
        setSelectedArticle(null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update article SEO",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article SEO",
        variant: "destructive"
      })
    }
  }

  const filteredArticles = articlesSEO.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.metaTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSEOScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">SEO Management Dashboard</h1>
            <p className="text-gray-600">Monitor and optimize your journal's search engine performance</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={regenerateSitemap} disabled={sitemapStatus === 'generating'}>
              {sitemapStatus === 'generating' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Regenerate Sitemap
            </Button>
            <Button onClick={regenerateAllSEO} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Regenerate All SEO
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Indexed Pages</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalIndexedPages}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Keywords</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalKeywords}</p>
                  </div>
                  <Search className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Load Time</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.averagePageLoadTime}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.pendingSEOTasks}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles SEO</TabsTrigger>
            <TabsTrigger value="issues">SEO Issues</TabsTrigger>
            <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent SEO Updates */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent SEO Updates</CardTitle>
                  <CardDescription>Latest changes to SEO metadata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {articlesSEO.slice(0, 5).map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{article.title.substring(0, 50)}...</h4>
                          <p className="text-xs text-gray-500">Last updated: {new Date(article.lastUpdated).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={getSEOScoreBadgeVariant(article.seoScore)}>
                          {article.seoScore}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* SEO Health Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Health Summary</CardTitle>
                  <CardDescription>Overall status of your journal's SEO</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mobile Friendly Pages</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">
                            {metrics.mobileFriendlyPages}/{metrics.totalIndexedPages}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Structured Data</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">
                            {metrics.structuredDataPages}/{metrics.totalIndexedPages}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Sitemap Update</span>
                        <span className="text-sm text-gray-600">
                          {new Date(metrics.lastSitemapUpdate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Articles SEO Tab */}
          <TabsContent value="articles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Articles SEO Management</CardTitle>
                <CardDescription>Monitor and optimize SEO for individual articles</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Articles */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Articles List */}
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg mb-2">{article.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Meta Title:</span>
                              <p className="text-gray-800">{article.metaTitle || "Not set"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Meta Description:</span>
                              <p className="text-gray-800">{article.metaDescription || "Not set"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.keywords.map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          {article.issues.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-red-600">Issues:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {article.issues.map((issue, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {issue}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-center">
                            <Badge variant={getSEOScoreBadgeVariant(article.seoScore)}>
                              {article.seoScore}%
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">SEO Score</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedArticle(article)}
                          >
                            Edit SEO
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={article.url} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Article SEO Modal */}
            {selectedArticle && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle>Edit SEO for: {selectedArticle.title}</CardTitle>
                  <CardDescription>Update meta information and keywords</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const seoData = {
                      metaTitle: formData.get('metaTitle') as string,
                      metaDescription: formData.get('metaDescription') as string,
                      keywords: (formData.get('keywords') as string).split(',').map(k => k.trim())
                    }
                    updateArticleSEO(selectedArticle.id, seoData)
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          name="metaTitle"
                          defaultValue={selectedArticle.metaTitle}
                          placeholder="Enter meta title (recommended: 50-60 characters)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          name="metaDescription"
                          defaultValue={selectedArticle.metaDescription}
                          placeholder="Enter meta description (recommended: 150-160 characters)"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Input
                          id="keywords"
                          name="keywords"
                          defaultValue={selectedArticle.keywords.join(', ')}
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Update SEO</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setSelectedArticle(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SEO Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Issues & Recommendations</CardTitle>
                <CardDescription>Address these issues to improve your journal's SEO performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seoIssues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {issue.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            {issue.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                            {issue.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                            <h3 className="font-medium">{issue.title}</h3>
                            <Badge variant={
                              issue.priority === 'high' ? 'destructive' : 
                              issue.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {issue.priority} priority
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{issue.description}</p>
                          <p className="text-sm text-gray-500 mb-2">Affected pages: {issue.affectedPages}</p>
                          <div className="bg-blue-50 p-3 rounded-md">
                            <h4 className="font-medium text-sm text-blue-800 mb-1">Suggested Fix:</h4>
                            <p className="text-sm text-blue-700">{issue.fixSuggestion}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sitemap Tab */}
          <TabsContent value="sitemap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sitemap Management</CardTitle>
                <CardDescription>Monitor and manage your journal's XML sitemap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Main Sitemap</h3>
                      <p className="text-sm text-gray-600">Contains all articles and static pages</p>
                      {metrics && (
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(metrics.lastSitemapUpdate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/sitemap.xml" target="_blank">
                          <Eye className="h-4 w-4 mr-2" />
                          View Sitemap
                        </Link>
                      </Button>
                      <Button size="sm" onClick={regenerateSitemap} disabled={sitemapStatus === 'generating'}>
                        {sitemapStatus === 'generating' ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Robots.txt</h3>
                      <p className="text-sm text-gray-600">Controls search engine crawling</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/robots.txt" target="_blank">
                          <Eye className="h-4 w-4 mr-2" />
                          View Robots.txt
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="font-medium text-blue-800">{metrics.totalIndexedPages}</p>
                        <p className="text-sm text-blue-600">Total Pages</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-medium text-green-800">{metrics.structuredDataPages}</p>
                        <p className="text-sm text-green-600">With Structured Data</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="font-medium text-purple-800">{metrics.mobileFriendlyPages}</p>
                        <p className="text-sm text-purple-600">Mobile Friendly</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Analytics</CardTitle>
                <CardDescription>Monitor your journal's search performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    We're working on comprehensive SEO analytics including search rankings, 
                    keyword performance, and traffic insights.
                  </p>
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Request Early Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
