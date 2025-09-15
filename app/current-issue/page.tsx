"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Download, 
  Eye, 
  FileText, 
  Heart, 
  Users,
  BookOpen,
  Clock,
  Star
} from "lucide-react"

interface Article {
  id: string
  title: string
  abstract: string
  category: string
  pages: string
  doi: string
  publishedDate: string
  downloads: number
  citations: number
  views: number
  authorId: string
  coAuthors?: { name: string; email: string; affiliation: string }[]
  keywords?: string[]
  status: string
}

interface Issue {
  id: string
  title: string
  number: number
  description: string
  publishedDate: string
  coverImage?: string
  status: string
  specialIssue: boolean
  guestEditors?: string
}

export default function CurrentIssuePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCurrentIssue() {
      try {
        const response = await fetch("/api/current-issue-data")
        const data = await response.json()

        if (data.success) {
          setIssue(data.issue)
          setArticles(data.articles || [])
        } else {
          setError(data.error || "Failed to load current issue")
        }
      } catch (error) {
        console.error("Error fetching current issue:", error)
        setError("Failed to load current issue")
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentIssue()
  }, [])

  const getAuthorNames = (article: Article) => {
    const authors = []
    
    // Add main author (we'd need to fetch user data by authorId)
    if (article.authorId) {
      authors.push("Author") // Placeholder - would need to fetch user name
    }
    
    // Add co-authors
    if (article.coAuthors && article.coAuthors.length > 0) {
      authors.push(...article.coAuthors.map(author => author.name))
    }
    
    return authors.length > 0 ? authors.join(", ") : "Unknown Author"
  }

  const getArticleType = (category: string) => {
    // Map categories to types for styling
    const categoryLower = category.toLowerCase()
    if (categoryLower.includes("editorial")) return "editorial"
    if (categoryLower.includes("review")) return "review"
    if (categoryLower.includes("case")) return "case-study"
    return "research"
  }

  const getTypeIcon = (category: string) => {
    const type = getArticleType(category)
    switch (type) {
      case "research": return <FileText className="h-4 w-4" />
      case "review": return <BookOpen className="h-4 w-4" />
      case "case-study": return <Heart className="h-4 w-4" />
      case "editorial": return <Star className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (category: string) => {
    const type = getArticleType(category)
    switch (type) {
      case "research": return "bg-blue-100 text-blue-800 border-blue-300"
      case "review": return "bg-green-100 text-green-800 border-green-300"
      case "case-study": return "bg-purple-100 text-purple-800 border-purple-300"
      case "editorial": return "bg-orange-100 text-orange-800 border-orange-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading current issue...</p>
        </div>
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-6 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Current Issue Available</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {error || "The latest issue is being prepared. Check back soon for new publications!"}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Current Issue
              </h1>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {issue.title || `Volume ${issue.number || 1}, Issue ${issue.number || 1}`} - {new Date(issue.publishedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {articles.length} Research Papers
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {articles.reduce((total, article) => {
                    let count = 1; // Main author
                    if (article.coAuthors) count += article.coAuthors.length;
                    return total + count;
                  }, 0)} Authors
                </div>
              </div>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                {issue.description || "Advancing Medical Knowledge Through Health Sciences and Technology Integration"}
              </p>
            </div>
          </div>
        </div>

        {/* Issue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {articles.length}
              </div>
              <div className="text-sm text-blue-700">Articles Published</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {articles.reduce((total, article) => total + article.downloads, 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Downloads</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {articles.reduce((total, article) => total + article.citations, 0)}
              </div>
              <div className="text-sm text-purple-700">Citations</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {articles.reduce((total, article) => {
                  let count = 1; // Main author
                  if (article.coAuthors) count += article.coAuthors.length;
                  return total + count;
                }, 0)}
              </div>
              <div className="text-sm text-orange-700">Contributing Authors</div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Research Papers in This Issue</h2>
          
          {articles.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Papers Published Yet</h3>
                <p className="text-gray-600">Papers are currently being reviewed and will be published soon.</p>
              </CardContent>
            </Card>
          ) : (
            articles.map((article, index) => (
              <Card key={article.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getTypeColor(article.category)} variant="outline">
                          {getTypeIcon(article.category)}
                          <span className="ml-1 capitalize">{getArticleType(article.category)}</span>
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100">
                          {article.category}
                        </Badge>
                        <span className="text-sm text-gray-600">Pages {article.pages || "TBD"}</span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-indigo-600 cursor-pointer">
                        {article.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {getAuthorNames(article)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(article.publishedDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                        {article.abstract}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {(article.downloads || 0).toLocaleString()} downloads
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          {article.citations || 0} citations
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {(article.views || 0).toLocaleString()} views
                        </div>
                        {article.doi && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            DOI: {article.doi}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Published: {new Date(article.publishedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="hover:bg-indigo-50">
                        <Eye className="h-4 w-4 mr-1" />
                        View Abstract
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-green-50">
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                        <a href={`/article/${article.id}`}>
                          Read Full Paper
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Issue Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Issue Information</CardTitle>
            <CardDescription>Additional details about this issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Publication Details</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li><strong>ISSN:</strong> 2234-5678 (Online)</li>
                  <li><strong>Volume:</strong> {issue.number || 1}</li>
                  <li><strong>Issue:</strong> {issue.number || 1}</li>
                  <li><strong>Publication Date:</strong> {new Date(issue.publishedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</li>
                  <li><strong>Papers:</strong> {articles.length}</li>
                  {issue.specialIssue && <li><strong>Special Issue:</strong> Yes</li>}
                  {issue.guestEditors && <li><strong>Guest Editors:</strong> {issue.guestEditors}</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">About This Issue</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {issue.description || "This issue features breakthrough research in various fields of medical and health sciences."}
                </p>
                {articles.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Topics covered include: {Array.from(new Set(articles.map(a => a.category))).join(", ")}.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
