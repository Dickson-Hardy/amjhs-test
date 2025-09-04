"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Download, Calendar, User, ExternalLink, FileText, ArrowRight, Search, ChevronRight, BookOpen, TrendingUp, Globe, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import AdvertisementDisplay from "@/components/advertisement-display"
import "../styles/homepage.css"

interface Article {
  id: string
  title: string
  authors?: string[]
  publishedDate?: string
  abstract?: string
  downloads?: number
  category?: string
}

interface Stats {
  totalPapers: number
  connectedResearchers: number
  impactFactor: string
  smartSolutions: number
}

interface NewsItem {
  id: string
  title: string
  date: string
  excerpt: string
  link?: string
}

interface CurrentIssue {
  id: string
  title: string
  volumeInfo?: string
  number?: string | number
  publishedAt?: string
  description?: string
  coverImageUrl?: string
}

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [currentIssueArticles, setCurrentIssueArticles] = useState<Article[]>([])
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [stats, setStats] = useState({ totalArticles: 0, totalIssues: 0, totalVolumes: 0 })
  const [currentIssue, setCurrentIssue] = useState<CurrentIssue | null>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [latestNews, setLatestNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleSubmitManuscript = () => {
    if (session) {
      router.push('/submit')
    } else {
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/submit'))
    }
  }

  const handleMakeSubmission = () => {
    if (session) {
      router.push('/submit')
    } else {
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/submit'))
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [articlesRes, statsRes, currentIssueRes, newsRes] = await Promise.all([
          fetch("/api/articles?featured=true&limit=6"),
          fetch("/api/stats"),
          fetch("/api/current-issue-data"),
          fetch("/api/news?limit=5"),
        ])

        const articlesData = await articlesRes.json()
        const statsData = await statsRes.json()
        const currentIssueData = await currentIssueRes.json()
        const newsData = await newsRes.json()

        if (articlesData.success) {
          setFeaturedArticles(articlesData.articles)
        }

        if (statsData.success) {
          setStats(statsData.stats)
        }

        if (currentIssueData.success && currentIssueData.issue) {
          setCurrentIssue(currentIssueData.issue as CurrentIssue)
          setCurrentIssueArticles(currentIssueData.articles || [])
        }

        // Handle news data
        if (newsData.success) {
          setLatestNews(newsData.news)
        } else {
          // Fallback to default announcement if API fails
          setLatestNews([
            {
              id: "1",
              title: "CALL FOR SUBMISSION MANUSCRIPT",
              date: "August 3, 2025",
              excerpt: "Authors are invited to send manuscripts in form of original articles, review papers, case reports, brief communications, letter to editor...",
              link: "/call-for-submission"
            }
          ])
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching homepage data:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-background"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Journal Info */}
            <div className="lg:w-2/3 text-center lg:text-left fade-in-up">
              <div className="flex justify-center lg:justify-start mb-6">
                <Image
                  src="/logo-amhsj.png"
                  alt="AMHSJ Logo"
                  width={100}
                  height={100}
                  className="object-contain drop-shadow-lg float-animation"
                />
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight fade-in-up delay-100">
                Advances in Medicine & 
                <span className="gradient-text"> Health Sciences</span>
              </h1>
              
              <p className="text-xl text-blue-100 mb-6 leading-relaxed fade-in-up delay-200">
                International peer-reviewed research published by volumes across all medical specialties
              </p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8 fade-in-up delay-300">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-4 py-2 hover-lift">
                  Online ISSN: 2672-4596
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-4 py-2 hover-lift">
                  Print ISSN: 2672-4588
                </Badge>
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-200 border-cyan-400/20 px-4 py-2 hover-lift">
                  Open Access
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start fade-in-up delay-400">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 button-enhanced pulse-glow"
                  onClick={handleMakeSubmission}
                >
                  Submit Your Research
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full button-enhanced"
                  asChild
                >
                  <Link href="/current-issue">
                    Browse Current Issue
                    <BookOpen className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="lg:w-1/3 grid grid-cols-2 gap-4 w-full max-w-md fade-in-up delay-300">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover-lift glass-card">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-cyan-300 mx-auto mb-2 icon-bounce" />
                  <div className="text-2xl font-bold text-white">1.8</div>
                  <div className="text-sm text-blue-100">Impact Factor</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover-lift glass-card">
                <CardContent className="p-4 text-center">
                  <Globe className="h-8 w-8 text-cyan-300 mx-auto mb-2 icon-bounce" />
                  <div className="text-2xl font-bold text-white">0.42</div>
                  <div className="text-sm text-blue-100">JCI Score</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover-lift glass-card">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-cyan-300 mx-auto mb-2 icon-bounce" />
                  <div className="text-2xl font-bold text-white">{stats.totalArticles || '50+'}</div>
                  <div className="text-sm text-blue-100">Published Articles</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover-lift glass-card">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-cyan-300 mx-auto mb-2 icon-bounce" />
                  <div className="text-2xl font-bold text-white">4x</div>
                  <div className="text-sm text-blue-100">Per Year</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">Home</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* About the Journal - Modern Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover-lift fade-in-up">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                  About the Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  The Advances in Medicine & Health Sciences Journal (AMHSJ) is an international peer-reviewed journal that publishes by volumes, disseminating high-quality research across all medical and health science specialties from researchers worldwide.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  All articles are open access under CC BY-NC-ND 3.0, immediately free to read and download.
                </p>
                <Link 
                  href="/about" 
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group transition-colors"
                >
                  Read full scope 
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </CardContent>
            </Card>

            {/* Announcements - Modern Design */}
            <Card className="border-0 shadow-lg hover-lift fade-in-up delay-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                  Latest Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {latestNews.length > 0 ? (
                    latestNews.map((item) => (
                      <div key={item.id} className="group">
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-500 hover:shadow-md transition-shadow article-card">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {item.link ? (
                              <Link href={item.link}>
                                {item.title}
                              </Link>
                            ) : (
                              item.title
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Calendar className="h-4 w-4" />
                            {item.date}
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {item.excerpt}
                          </p>
                          {item.link && (
                            <Link 
                              href={item.link} 
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group-hover:gap-3 transition-all"
                            >
                              Read more
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="group">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          <Link href="/call-for-submission">
                            CALL FOR SUBMISSION MANUSCRIPT
                          </Link>
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="h-4 w-4" />
                          August 3, 2025
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Authors are invited to send manuscripts in form of original articles, review papers, case reports, brief communications, letter to editor...
                        </p>
                        <Link 
                          href="/call-for-submission" 
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group-hover:gap-3 transition-all"
                        >
                          Read more
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Issue - Enhanced Design */}
            <Card className="border-0 shadow-lg hover-lift fade-in-up delay-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                  Current Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentIssue ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <img 
                            src={currentIssue.coverImageUrl || "/api/placeholder/160/200"}
                            alt={`Cover of ${currentIssue.title}`}
                            className="w-32 h-40 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {currentIssue.volumeInfo ? `${currentIssue.volumeInfo} • Issue ${currentIssue.number}` : currentIssue.title}
                        </h3>
                        {currentIssue.publishedAt && (
                          <div className="flex items-center gap-2 text-gray-600 mb-4">
                            <Calendar className="h-4 w-4" />
                            Published: {new Date(currentIssue.publishedAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {currentIssue.description && (
                          <p className="text-gray-700 mb-6 leading-relaxed">
                            {currentIssue.description}
                          </p>
                        )}
                        
                        {currentIssueArticles.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              Featured Articles
                            </h4>
                            <div className="grid gap-3">
                              {currentIssueArticles.slice(0, 3).map((article) => (
                                <div key={article.id} className="group bg-white p-4 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all">
                                  <Link href={`/article/${article.id}`} className="block">
                                    <h5 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                                      {article.title}
                                    </h5>
                                    <div className="text-sm text-gray-600">
                                      {article.authors}
                                    </div>
                                  </Link>
                                </div>
                              ))}
                              {currentIssueArticles.length > 3 && (
                                <div className="text-center pt-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href="/current-issue">
                                      View all {currentIssueArticles.length} articles
                                    </Link>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <FileText className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No Current Issue Set</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">The latest issue is being prepared. Check back soon for new publications!</p>
                    <Button variant="outline" asChild>
                      <Link href="/archives">Browse Archives</Link>
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                  <Button variant="outline" asChild>
                    <Link href="/current-issue">View All Issues</Link>
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    onClick={handleMakeSubmission}
                  >
                    Submit Your Research
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Information Section - Modernized */}
            <Card className="border-0 shadow-lg hover-lift fade-in-up delay-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                  Resources & Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border border-green-100 hover:border-green-300 hover:shadow-lg transition-all group cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                        <Link href="/information/readers">For Readers</Link>
                      </h3>
                      <p className="text-sm text-gray-600">Guidelines and resources for journal readers</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        <Link href="/information/authors">For Authors</Link>
                      </h3>
                      <p className="text-sm text-gray-600">Submission guidelines and writing resources</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all group cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        <Link href="/information/librarians">For Librarians</Link>
                      </h3>
                      <p className="text-sm text-gray-600">Library access and archival information</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-700 mb-4">
                    <strong>Bayelsa Medical University</strong> is the official publisher of AMHSJ.
                  </p>
                  <div className="flex flex-wrap justify-center gap-6 text-blue-600">
                    <Link href="/events" className="hover:text-blue-800 font-medium">Events</Link>
                    <Link href="/careers" className="hover:text-blue-800 font-medium">Careers</Link>
                    <Link href="/cpd" className="hover:text-blue-800 font-medium">CPD</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-8">
              {/* Advertisement Space */}
              <AdvertisementDisplay position="sidebar-top" />

              {/* Enhanced Search Box */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    Search Journal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">All Fields</label>
                      <input 
                        type="text" 
                        placeholder="Search articles, authors..." 
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Authors</label>
                      <input 
                        type="text" 
                        placeholder="Author name" 
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                      <input 
                        type="text" 
                        placeholder="Article title" 
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                      onClick={(e) => {
                        const form = e.currentTarget.closest('form') || e.currentTarget.parentElement
                        const titleInput = form?.querySelector('input[placeholder="Article title"]') as HTMLInputElement
                        const searchQuery = titleInput?.value || ''
                        if (searchQuery.trim()) {
                          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                        }
                      }}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Issue Sidebar */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Current Issue
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="relative group mb-4">
                    <img 
                      src="/api/placeholder/120/150" 
                      alt="Current Issue" 
                      className="w-24 h-30 object-cover rounded-lg shadow-md mx-auto group-hover:shadow-lg transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors"></div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3 font-medium">Vol. 5 No. 2 (2025)</div>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/current-issue">View Contents</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Browse */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Browse</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {[
                      { href: "/browse/authors", label: "By Author", icon: User },
                      { href: "/browse/title", label: "By Title", icon: FileText },
                      { href: "/browse/issue", label: "By Issue", icon: BookOpen },
                      { href: "/browse/other", label: "Other Journals", icon: ExternalLink }
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          className="flex items-center gap-3 p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
                        >
                          <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>

              {/* Tools */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Language */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
                      <select className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>English</option>
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Font Size</label>
                      <div className="flex gap-2">
                        {[
                          { size: 'text-xs', label: 'A', fontSize: '14px' },
                          { size: 'text-sm', label: 'A', fontSize: '16px' },
                          { size: 'text-base', label: 'A', fontSize: '18px' }
                        ].map((item, index) => (
                          <button 
                            key={index}
                            className={`${item.size} px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium`}
                            onClick={() => {
                              document.body.style.fontSize = item.fontSize;
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Journal Content</h4>
                      <div className="space-y-1 pl-2">
                        {[
                          { href: "/search", label: "Search" },
                          { href: "/current", label: "Current Issue" },
                          { href: "/archives", label: "Archives" }
                        ].map((item) => (
                          <Link 
                            key={item.href}
                            href={item.href} 
                            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Information</h4>
                      <div className="space-y-1 pl-2">
                        {[
                          { href: "/information/readers", label: "For Readers" },
                          { href: "/information/authors", label: "For Authors" },
                          { href: "/information/librarians", label: "For Librarians" }
                        ].map((item) => (
                          <Link 
                            key={item.href}
                            href={item.href} 
                            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Help</h4>
                      <div className="space-y-1 pl-2">
                        {[
                          { href: "/help/submission", label: "Online Submission" },
                          { href: "/help/policies", label: "Journal Policies" },
                          { href: "/help/copyright", label: "Copyright Notice" }
                        ].map((item) => (
                          <Link 
                            key={item.href}
                            href={item.href} 
                            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>
                </CardContent>
              </Card>

              {/* Second Advertisement Space */}
              <AdvertisementDisplay position="sidebar-bottom" />
            </div>
          </div>
        </div>

        {/* Modern Footer Information */}
        <footer className="mt-16 pt-12 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Journal Information
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>Advances in Medicine & Health Sciences Journal</strong>
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      Online ISSN: 2672-4596
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Print ISSN: 2672-4588
                    </span>
                  </div>
                  <p>
                    This journal is protected by a{" "}
                    <Link 
                      href="https://creativecommons.org/licenses/by-nc/4.0/" 
                      className="text-blue-600 hover:text-blue-800 font-medium underline decoration-dotted"
                    >
                      Creative Commons Attribution - NonCommercial Works License
                    </Link>{" "}
                    (CC BY-NC 4.0)
                  </p>
                  <Link 
                    href="/privacy" 
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read our privacy policy
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Network & Support
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <strong className="text-gray-900">AMHSJ Journals:</strong>{" "}
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                      Advances in Medicine & Health Sciences Journal
                    </Link>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Open Journal Systems Hosting and Support by:</span>{" "}
                    <Link 
                      href="https://openjournalsystems.com/" 
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      OpenJournalSystems.com
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              © 2025 Bayelsa Medical University. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
