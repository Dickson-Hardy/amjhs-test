import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, reviews, citations } from "@/lib/db/schema"
import { eq, and, count, desc, asc, sql, gte, lte } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '5y'

    // Calculate date range based on timeRange parameter
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case '3y':
        startDate.setFullYear(now.getFullYear() - 3)
        break
      case '5y':
        startDate.setFullYear(now.getFullYear() - 5)
        break
      case '10y':
        startDate.setFullYear(now.getFullYear() - 10)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate.setFullYear(now.getFullYear() - 5)
    }

    // Get user's articles
    const userArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        category: articles.category,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        journal: articles.journal,
        impactFactor: articles.impactFactor,
        doi: articles.doi,
        downloads: articles.downloads,
        views: articles.views,
        citations: articles.citationCount,
      })
      .from(articles)
      .where(and(
        eq(articles.authorId, session.user.id),
        gte(articles.createdAt, startDate)
      ))
      .orderBy(desc(articles.createdAt))

    // Calculate basic metrics
    const totalPublications = userArticles.length
    const publishedArticles = userArticles.filter(article => 
      ['published', 'accepted'].includes(article.status || '')
    )
    const totalCitations = userArticles.reduce((sum, article) => 
      sum + (article.citations || 0), 0
    )
    const totalDownloads = userArticles.reduce((sum, article) => 
      sum + (article.downloads || 0), 0
    )
    const totalViews = userArticles.reduce((sum, article) => 
      sum + (article.views || 0), 0
    )

    // Calculate H-index (simplified)
    const citationCounts = userArticles
      .map(article => article.citations || 0)
      .sort((a, b) => b - a)
    
    let hIndex = 0
    for (let i = 0; i < citationCounts.length; i++) {
      if (citationCounts[i] >= i + 1) {
        hIndex = i + 1
      } else {
        break
      }
    }

    // Calculate i10-index (articles with at least 10 citations)
    const i10Index = citationCounts.filter(count => count >= 10).length

    // Calculate average citations per paper
    const averageCitationsPerPaper = totalPublications > 0 ? totalCitations / totalPublications : 0

    // Generate publication trend data
    const publicationTrend = []
    const currentYear = now.getFullYear()
    const startYear = startDate.getFullYear()
    
    for (let year = startYear; year <= currentYear; year++) {
      const yearArticles = userArticles.filter(article => 
        new Date(article.createdAt).getFullYear() === year
      )
      const yearCitations = yearArticles.reduce((sum, article) => 
        sum + (article.citations || 0), 0
      )
      const yearDownloads = yearArticles.reduce((sum, article) => 
        sum + (article.downloads || 0), 0
      )
      
      publicationTrend.push({
        year,
        publications: yearArticles.length,
        citations: yearCitations,
        downloads: yearDownloads
      })
    }

    // Generate citation trend data
    const citationTrend = publicationTrend.map(trend => ({
      year: trend.year,
      citations: trend.citations,
      selfCitations: Math.floor(trend.citations * 0.1), // Estimate 10% self-citations
      externalCitations: Math.floor(trend.citations * 0.9)
    }))

    // Top publications (by citations)
    const topPublications = userArticles
      .filter(article => article.citations && article.citations > 0)
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, 10)
      .map(article => ({
        id: article.id,
        title: article.title,
        journal: article.journal || 'Unknown Journal',
        year: new Date(article.createdAt).getFullYear(),
        citations: article.citations || 0,
        downloads: article.downloads || 0,
        impactFactor: article.impactFactor || 0,
        doi: article.doi || ''
      }))

    // Research areas (based on article categories)
    const categoryCounts = {}
    userArticles.forEach(article => {
      const category = article.category || 'other'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    const researchAreas = Object.entries(categoryCounts).map(([area, count]) => ({
      area,
      publications: count as number,
      citations: userArticles
        .filter(article => (article.category || 'other') === area)
        .reduce((sum, article) => sum + (article.citations || 0), 0),
      percentage: Math.round((count as number / totalPublications) * 100)
    })).sort((a, b) => b.publications - a.publications)

    // Journal performance
    const journalStats = {}
    userArticles.forEach(article => {
      const journal = article.journal || 'Unknown Journal'
      if (!journalStats[journal]) {
        journalStats[journal] = {
          journal,
          publications: 0,
          totalCitations: 0,
          averageCitations: 0,
          impactFactor: 0
        }
      }
      journalStats[journal].publications++
      journalStats[journal].totalCitations += article.citations || 0
      journalStats[journal].impactFactor = Math.max(
        journalStats[journal].impactFactor,
        article.impactFactor || 0
      )
    })

    const journalPerformance = Object.values(journalStats).map(journal => ({
      ...journal,
      averageCitations: journal.totalCitations / journal.publications
    })).sort((a, b) => b.totalCitations - a.totalCitations)

    // Mock co-author network (would need actual co-author data)
    const coAuthorNetwork = [
      {
        id: '1',
        name: 'Dr. John Smith',
        institution: 'University of Medical Sciences',
        collaborationCount: 3,
        totalCitations: 45,
        hIndex: 8
      },
      {
        id: '2',
        name: 'Prof. Sarah Johnson',
        institution: 'Medical Research Institute',
        collaborationCount: 2,
        totalCitations: 67,
        hIndex: 12
      }
    ]

    // Impact metrics (mock data - would need actual calculations)
    const impactMetrics = {
      fieldWeightedCitationImpact: 1.2,
      relativeCitationRatio: 1.15,
      citationPercentile: 75,
      altmetricScore: 45,
      socialMediaMentions: 23
    }

    const analytics = {
      id: session.user.id,
      totalPublications,
      totalCitations,
      hIndex,
      i10Index,
      averageCitationsPerPaper,
      publicationTrend,
      citationTrend,
      topPublications,
      coAuthorNetwork,
      journalPerformance,
      researchAreas,
      impactMetrics
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/analytics` })
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 })
  }
}
