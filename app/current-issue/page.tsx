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
  authors: string[]
  abstract: string
  category: string
  pages: string
  doi: string
  publishedDate: string
  downloads: number
  citations: number
  type: "research" | "review" | "case-study" | "editorial"
}

export default function CurrentIssuePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for current issue - replace with API call
    const mockArticles: Article[] = [
      {
        id: "1",
        title: "Advanced Machine Learning Applications in Personalized Medicine: A Comprehensive Review",
        authors: ["Dr. Sarah Chen", "Prof. Michael Rodriguez", "Dr. Lisa Wang"],
        abstract: "This comprehensive review examines the transformative potential of machine learning in personalized medicine, focusing on recent advances in genomic analysis, drug discovery, and treatment optimization...",
        category: "Medical AI",
        pages: "1-18",
        doi: "10.1234/amhsj.2025.001",
        publishedDate: "2025-06-15",
        downloads: 1247,
        citations: 8,
        type: "research"
      },
      {
        id: "2",
        title: "IoT-Enabled Remote Patient Monitoring: Real-World Implementation and Clinical Outcomes",
        authors: ["Dr. James Thompson", "Dr. Maria Garcia", "Prof. David Kim"],
        abstract: "We present a comprehensive analysis of IoT-enabled remote patient monitoring systems implemented across three major healthcare networks, demonstrating significant improvements in patient outcomes...",
        category: "Healthcare Technology",
        pages: "19-35",
        doi: "10.1234/amhsj.2025.002",
        publishedDate: "2025-06-10",
        downloads: 892,
        citations: 5,
        type: "research"
      },
      {
        id: "3",
        title: "Blockchain Technology in Healthcare Data Management: Security and Privacy Perspectives",
        authors: ["Dr. Anna Kowalski", "Prof. Robert Liu"],
        abstract: "This paper explores the implementation of blockchain technology for secure healthcare data management, addressing current challenges in data privacy, interoperability, and patient consent...",
        category: "Health Informatics",
        pages: "36-52",
        doi: "10.1234/amhsj.2025.003",
        publishedDate: "2025-06-08",
        downloads: 654,
        citations: 3,
        type: "review"
      },
      {
        id: "4",
        title: "Editorial: The Future of Digital Health - Opportunities and Challenges in Post-Pandemic Healthcare",
        authors: ["Dr. Editor-in-Chief"],
        abstract: "As we navigate the post-pandemic healthcare landscape, digital health technologies have emerged as critical tools for improving access, quality, and efficiency of healthcare delivery...",
        category: "Editorial",
        pages: "i-iii",
        doi: "10.1234/amhsj.2025.editorial",
        publishedDate: "2025-06-01",
        downloads: 423,
        citations: 1,
        type: "editorial"
      }
    ]

    setTimeout(() => {
      setArticles(mockArticles)
      setLoading(false)
    }, 1000)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "research": return <FileText className="h-4 w-4" />
      case "review": return <BookOpen className="h-4 w-4" />
      case "case-study": return <Heart className="h-4 w-4" />
      case "editorial": return <Star className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
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
                  Volume 15, Issue 2 - June 2025
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {articles.length} Articles
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {articles.reduce((total, article) => total + article.authors.length, 0)} Authors
                </div>
              </div>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Advancing Medical Knowledge Through Health Sciences and Technology Integration
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
                {articles.reduce((total, article) => total + article.authors.length, 0)}
              </div>
              <div className="text-sm text-orange-700">Contributing Authors</div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Articles in This Issue</h2>
          
          {articles.map((article, index) => (
            <Card key={article.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getTypeColor(article.type)} variant="outline">
                        {getTypeIcon(article.type)}
                        <span className="ml-1 capitalize">{article.type}</span>
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-100">
                        {article.category}
                      </Badge>
                      <span className="text-sm text-gray-600">Pages {article.pages}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-indigo-600 cursor-pointer">
                      {article.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {article.authors.join(", ")}
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
                        {article.downloads.toLocaleString()} downloads
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {article.citations} citations
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        DOI: {article.doi}
                      </div>
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
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      Read Full Article
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <li><strong>Volume:</strong> 15</li>
                  <li><strong>Issue:</strong> 2</li>
                  <li><strong>Publication Date:</strong> June 2025</li>
                  <li><strong>Pages:</strong> 1-52</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Special Focus</h4>
                <p className="text-sm text-gray-600 mb-2">
                  This issue highlights breakthrough research in digital health technologies and their clinical applications.
                </p>
                <p className="text-sm text-gray-600">
                  Featured topics include AI in healthcare, IoT medical devices, and blockchain applications in health informatics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
