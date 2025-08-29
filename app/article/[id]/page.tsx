"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PDFViewer } from "@/components/pdf-viewer"
import { DOIDisplay } from "@/components/doi-display"
import { Calendar, User, Eye, Download, Share2, BookOpen, Quote, ExternalLink, Tag } from "lucide-react"

interface Article {
  id: string
  title: string
  abstract: string
  content?: string
  keywords: string[]
  category: string
  status: string
  doi: string
  doiRegistered?: boolean
  doiRegisteredAt?: string
  volume: string
  issue: string
  pages: string
  publishedDate: string
  submittedDate: string
  views: number
  downloads: number
  authorName: string
  authorEmail: string
  authorAffiliation: string
  authorOrcid?: string
  reviewCount: number
}

export default function ArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const response = await fetch(`/api/articles/${params.id}`)
        const data = await response.json()

        if (data.success) {
          setArticle(data.article)
        } else {
          setError(data.error || "Article not found")
        }
      } catch (error) {
        setError("Failed to load article")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.abstract,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const generateCitation = (format: "apa" | "mla" | "chicago") => {
    if (!article) return ""

    const year = new Date(article.publishedDate).getFullYear()

    switch (format) {
      case "apa":
        return `${article.authorName} (${year}). ${article.title}. AMHSJ, ${article.volume}(${article.issue}), ${article.pages}. https://doi.org/${article.doi}`
      case "mla":
        return `${article.authorName}. "${article.title}." AMHSJ, vol. ${article.volume}, no. ${article.issue}, ${year}, pp. ${article.pages}.`
      case "chicago":
        return `${article.authorName}. "${article.title}." AMHSJ ${article.volume}, no. ${article.issue} (${year}): ${article.pages}.`
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Article Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800">{article.category}</Badge>
                  <Badge variant="outline">
                    Vol. {article.volume}, Issue {article.issue}
                  </Badge>
                  {article.status === "published" && <Badge className="bg-green-100 text-green-800">Published</Badge>}
                </div>
                <CardTitle className="text-2xl lg:text-3xl mb-4 leading-tight">{article.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Author & Publication Info */}
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">{article.authorName}</span>
                  {article.authorOrcid && (
                    <a
                      href={`https://orcid.org/${article.authorOrcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div>{article.authorAffiliation}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Published: {new Date(article.publishedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {article.views.toLocaleString()} views
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {article.downloads.toLocaleString()} downloads
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Abstract */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{article.abstract}</p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PDF Viewer */}
            <PDFViewer
              articleId={article.id}
              title={article.title}
              doi={article.doi}
              previewUrl={`/api/articles/${article.id}/preview`}
            />

            {/* Citation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Quote className="h-5 w-5 mr-2" />
                  How to Cite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">APA Style:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded border font-mono">{generateCitation("apa")}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">MLA Style:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded border font-mono">{generateCitation("mla")}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Chicago Style:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded border font-mono">{generateCitation("chicago")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {article.doi && (
                  <>
                    <DOIDisplay 
                      doi={article.doi}
                      doiRegistered={article.doiRegistered}
                      title={article.title}
                    />
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span>{article.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue:</span>
                  <span>{article.issue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages:</span>
                  <span>{article.pages}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span>{new Date(article.submittedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews:</span>
                  <span>{article.reviewCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Related articles will be displayed here based on keywords and category.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
