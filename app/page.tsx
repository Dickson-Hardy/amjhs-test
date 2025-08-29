"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Download, Calendar, User, ExternalLink, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import AdvertisementDisplay from "@/components/advertisement-display"

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

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [currentIssueArticles, setCurrentIssueArticles] = useState<Article[]>([])
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [stats, setStats] = useState({ totalArticles: 0, totalIssues: 0, totalVolumes: 0 })
  const [currentIssue, setCurrentIssue] = useState<unknown>(null)
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
          setCurrentIssue(currentIssueData.issue)
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
    <div className="min-h-screen bg-white">
      {/* Hero section removed */}

      {/* Main Navigation breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="text-sm text-gray-600">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Journal Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Image
                  src="/logo-amhsj.png"
                  alt="AMHSJ Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h1 className="text-4xl font-serif font-bold text-blue-900 mb-2">
                Advances in Medicine & Health Sciences Journal
              </h1>
              <div className="text-sm text-gray-600 mb-4">
                Online ISSN: 2672-4596 | Print ISSN: 2672-4588
              </div>
            </div>

            {/* About the Journal */}
            <section className="mb-8">
              <h2 className="text-xl font-serif font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
                About the Journal
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed text-sm">
                <p className="mb-3">
                  The Advances in Medicine & Health Sciences Journal (AMHSJ) of Bayelsa Medical University publishes quarterly, disseminating peer‑reviewed research from the rural Niger Delta and worldwide across all medical and health science specialties.
                </p>
                <p className="mb-3">
                  All articles are open access under CC BY-NC-ND 3.0, immediately free to read and download.
                </p>
                <p className="mb-2">
                  <a href="/about" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1">Read full scope <span aria-hidden>→</span></a>
                </p>
              </div>
            </section>

            {/* Announcements */}
            <section className="mb-8">
              <h2 className="text-xl font-serif font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
                Announcements
              </h2>
              <div className="space-y-4">
                {latestNews.length > 0 ? (
                  latestNews.map((item) => (
                    <div key={item.id} className="border-l-4 border-orange-500 pl-4">
                      <h3 className="text-lg font-semibold text-blue-600 mb-1">
                        {item.link ? (
                          <Link href={item.link} className="hover:text-blue-800">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </h3>
                      <div className="text-sm text-gray-600 mb-2">{item.date}</div>
                      <p className="text-sm text-gray-700">
                        {item.excerpt}
                      </p>
                      {item.link && (
                        <Link 
                          href={item.link} 
                          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 mt-2"
                        >
                          Read more
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-lg font-semibold text-blue-600 mb-1">
                      <Link href="/call-for-submission" className="hover:text-blue-800">
                        CALL FOR SUBMISSION MANUSCRIPT
                      </Link>
                    </h3>
                    <div className="text-sm text-gray-600 mb-2">August 3, 2025</div>
                    <p className="text-sm text-gray-700">
                      Authors are invited to send manuscripts in form of original articles, review papers, case reports, brief communications, letter to editor...
                    </p>
                    <Link 
                      href="/call-for-submission" 
                      className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 mt-2"
                    >
                      Read more
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Current Issue */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                  Current Issue
                </h2>
              </div>
              
              <div className="bg-gray-50 p-6 rounded border">
                {currentIssue ? (
                  <div className="flex gap-6 mb-6">
                    <div className="flex-shrink-0">
                      <img 
                        src={currentIssue.coverImageUrl || "/api/placeholder/120/160"}
                        alt={`Cover of ${currentIssue.title}`}
                        className="w-24 h-32 border shadow-sm"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-blue-900 mb-2">
                        {currentIssue.volumeInfo ? `${currentIssue.volumeInfo} • Issue ${currentIssue.number}` : currentIssue.title}
                      </h3>
                      {currentIssue.publishedAt && (
                        <div className="text-sm text-gray-600 mb-4">
                          Published: {new Date(currentIssue.publishedAt).toLocaleDateString()}
                        </div>
                      )}
                      
                      {currentIssue.description && (
                        <div className="text-sm text-gray-600 mb-4">
                          {currentIssue.description}
                        </div>
                      )}
                      
                      {currentIssueArticles.length > 0 && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-blue-900 text-sm uppercase tracking-wide mb-2">
                              ARTICLES IN THIS ISSUE
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {currentIssueArticles.slice(0, 6).map((article) => (
                                <li key={article.id}>
                                  <Link 
                                    href={`/article/${article.id}`} 
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {article.title}
                                  </Link>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {article.authors}
                                  </div>
                                </li>
                              ))}
                              {currentIssueArticles.length > 6 && (
                                <li className="text-xs text-blue-600 font-medium">
                                  + {currentIssueArticles.length - 6} more articles
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-medium text-gray-900 mb-2">No Current Issue Set</h3>
                      <p className="text-sm">The latest issue is being prepared. Check back soon!</p>
                    </div>
                  </div>
                )}
                
                <div className="text-center pt-4 border-t">
                  <Link 
                    href="/current-issue" 
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View All Issues
                  </Link>
                </div>
              </div>
              
              <div className="mt-4 text-center space-y-2">
                <div className="text-sm text-gray-600">2023 Impact factor: 1.8</div>
                <div className="text-sm text-gray-600">2024 Journal Citation Indicator (JCI) - 0.42</div>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white mt-3"
                  onClick={handleMakeSubmission}
                >
                  Make a Submission
                </Button>
              </div>
            </section>

            {/* Information Section */}
            <section className="mb-8">
              <h2 className="text-xl font-serif font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
                Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    <Link href="/information/readers" className="hover:text-blue-800">For Readers</Link>
                  </h3>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    <Link href="/information/authors" className="hover:text-blue-800">For Authors</Link>
                  </h3>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    <Link href="/information/librarians" className="hover:text-blue-800">For Librarians</Link>
                  </h3>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-gray-700">
                <p className="mb-2">
                  Bayelsa Medical University is the official publisher of AMHSJ.
                </p>
                <p className="mb-4">
                  <strong>BAYELSA MEDICAL UNIVERSITY</strong>
                </p>
                <div className="flex gap-4 text-blue-600">
                  <Link href="/events" className="hover:text-blue-800">Events</Link>
                  <span>|</span>
                  <Link href="/careers" className="hover:text-blue-800">Careers</Link>
                  <span>|</span>
                  <Link href="/cpd" className="hover:text-blue-800">CPD</Link>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Advertisement Space */}
              <AdvertisementDisplay position="sidebar-top" />

              {/* Search Box */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">SEARCH</h3>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="All" 
                    className="w-full p-2 border rounded text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Authors" 
                    className="w-full p-2 border rounded text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Title" 
                    className="w-full p-2 border rounded text-sm"
                  />
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={(e) => {
                    // Get search values and perform search
                    // Implement search functionality
                    const form = e.currentTarget.closest('form') || e.currentTarget.parentElement
                    const titleInput = form?.querySelector('input[placeholder="Title"]') as HTMLInputElement
                    const searchQuery = titleInput?.value || ''
                    if (searchQuery.trim()) {
                      // In a real application, this would trigger actual search
                      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                    }
                  }}>
                    SEARCH
                  </Button>
                </div>
              </div>

              {/* Current Issue Sidebar */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">CURRENT ISSUE</h3>
                <div className="text-center">
                  <img 
                    src="/api/placeholder/100/130" 
                    alt="Current Issue" 
                    className="w-20 h-26 border shadow-sm mx-auto mb-3"
                  />
                  <div className="text-xs text-gray-600 mb-2">Vol. 5 No. 2 (2025)</div>
                  <Button size="sm" variant="outline" className="text-xs" asChild>
                    <Link href="/current-issue">TABLE OF CONTENTS</Link>
                  </Button>
                </div>
              </div>

              {/* Browse */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">BROWSE</h3>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/browse/authors" className="text-blue-600 hover:text-blue-800">By Author</Link></li>
                  <li><Link href="/browse/title" className="text-blue-600 hover:text-blue-800">By Title</Link></li>
                  <li><Link href="/browse/issue" className="text-blue-600 hover:text-blue-800">By Issue</Link></li>
                  <li><Link href="/browse/other" className="text-blue-600 hover:text-blue-800">Other Journals</Link></li>
                </ul>
              </div>

              {/* Language */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">LANGUAGE</h3>
                <select className="w-full p-2 border rounded text-sm">
                  <option>English</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">FONT SIZE</h3>
                <div className="flex gap-2">
                  <button 
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    onClick={() => {
                      document.body.style.fontSize = '14px';
                    }}
                  >
                    A
                  </button>
                  <button 
                    className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
                    onClick={() => {
                      document.body.style.fontSize = '16px';
                    }}
                  >
                    A
                  </button>
                  <button 
                    className="text-base px-2 py-1 border rounded hover:bg-gray-100"
                    onClick={() => {
                      document.body.style.fontSize = '18px';
                    }}
                  >
                    A
                  </button>
                </div>
              </div>

              {/* Journal Content */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">JOURNAL CONTENT</h3>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/search" className="text-blue-600 hover:text-blue-800">Search</Link></li>
                  <li><Link href="/current" className="text-blue-600 hover:text-blue-800">Current Issue</Link></li>
                  <li><Link href="/archives" className="text-blue-600 hover:text-blue-800">Archives</Link></li>
                </ul>
              </div>

              {/* Information */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">INFORMATION</h3>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/information/readers" className="text-blue-600 hover:text-blue-800">For Readers</Link></li>
                  <li><Link href="/information/authors" className="text-blue-600 hover:text-blue-800">For Authors</Link></li>
                  <li><Link href="/information/librarians" className="text-blue-600 hover:text-blue-800">For Librarians</Link></li>
                </ul>
              </div>

              {/* Journal Help */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">JOURNAL HELP</h3>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/help/submission" className="text-blue-600 hover:text-blue-800">Online Submission</Link></li>
                  <li><Link href="/help/policies" className="text-blue-600 hover:text-blue-800">Journal Policies</Link></li>
                  <li><Link href="/help/copyright" className="text-blue-600 hover:text-blue-800">Copyright Notice</Link></li>
                </ul>
              </div>

              {/* Second Advertisement Space */}
              <AdvertisementDisplay position="sidebar-bottom" />
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-12 pt-8 border-t text-sm text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="mb-2">
                The Advances in Medicine & Health Sciences Journal | Online ISSN: 2672-4596 | Print ISSN: 2672-4588
              </p>
              <p>
                This journal is protected by a{" "}
                <Link href="https://creativecommons.org/licenses/by-nc/4.0/" className="text-blue-600 hover:text-blue-800">
                  Creative Commons Attribution - NonCommercial Works License
                </Link>{" "}
                (CC BY-NC 4.0) |{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                  Read our privacy policy
                </Link>
                .
              </p>
            </div>
            <div>
              <p className="mb-2">
                <strong>AMHSJ Journals:</strong>{" "}
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  Advances in Medicine & Health Sciences Journal
                </Link>
              </p>
              <p className="text-xs">
                Open Journal Systems Hosting and Support by:{" "}
                <Link href="https://openjournalsystems.com/" className="text-blue-600 hover:text-blue-800">
                  OpenJournalSystems.com
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
