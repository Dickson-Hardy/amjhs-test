// app/api/analytics/export/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Analytics } from "@/lib/analytics"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'
    const format = searchParams.get('format') || 'csv'

    // Get comprehensive analytics data
    const journalStatsResult = await Analytics.getJournalStats()
    
    // Get additional export-specific data
    const exportData = await getExportData(range)

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV({
        journalStats: journalStatsResult.stats,
        exportData,
        range
      })

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="journal-analytics-${range}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      // Return JSON format
      const jsonData = {
        exportDate: new Date().toISOString(),
        timeRange: range,
        journalStats: journalStatsResult.stats,
        ...exportData
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="journal-analytics-${range}-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    }

  } catch (error) {
    logger.error("Analytics export error:", error)
    return NextResponse.json(
      { error: "Failed to export analytics data" },
      { status: 500 }
    )
  }
}

async function getExportData(range: string) {
  try {
    // Calculate date range
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    
    // Get user registration trends
    const userTrendsResult = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `)
    
    // Get submission trends
    const submissionTrendsResult = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM articles 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `)
    
    // Get page view trends
    const pageViewsResult = await db.execute(sql`
      SELECT 
        article_id,
        COUNT(*) as views,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_views 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY article_id
      ORDER BY views DESC
      LIMIT 10
    `)
    
    // Get review completion data
    const reviewStatsResult = await db.execute(sql`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400) as avg_review_time,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
      FROM reviews 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `)

    return {
      userTrends: userTrendsResult.map(row => ({
        date: (row as unknown).date,
        count: parseInt((row as unknown).count)
      })),
      submissionTrends: submissionTrendsResult.map(row => ({
        date: (row as unknown).date,
        count: parseInt((row as unknown).count)
      })),
      topPageViews: pageViewsResult.map(row => ({
        articleId: (row as unknown).article_id,
        views: parseInt((row as unknown).views),
        uniqueVisitors: parseInt((row as unknown).unique_visitors)
      })),
      reviewStats: {
        averageReviewTime: parseFloat((reviewStatsResult[0] as unknown)?.avg_review_time || '0'),
        completionRate: parseFloat((reviewStatsResult[0] as unknown)?.completion_rate || '0')
      }
    }
  } catch (error) {
    logger.error("Error getting export data:", error)
    return {
      userTrends: [],
      submissionTrends: [],
      topPageViews: [],
      reviewStats: { averageReviewTime: 0, completionRate: 0 }
    }
  }
}

function generateCSV(data: unknown): string {
  const { journalStats, exportData, range } = data

  let csv = `Journal Analytics Export - ${range}\n`
  csv += `Export Date: ${new Date().toISOString()}\n\n`

  // Journal Overview
  csv += "JOURNAL OVERVIEW\n"
  csv += "Metric,Value\n"
  csv += `Total Users,${journalStats.totalUsers}\n`
  csv += `Total Articles,${journalStats.totalArticles}\n`
  csv += `Total Reviews,${journalStats.totalReviews}\n`
  csv += `Published This Month,${journalStats.publishedThisMonth}\n`
  csv += `IoT Percentage,${journalStats.iotPercentage}%\n\n`

  // User Trends
  csv += "USER REGISTRATION TRENDS\n"
  csv += "Date,New Users\n"
  exportData.userTrends.forEach((item: unknown) => {
    csv += `${item.date},${item.count}\n`
  })
  csv += "\n"

  // Submission Trends
  csv += "SUBMISSION TRENDS\n"
  csv += "Date,Submissions\n"
  exportData.submissionTrends.forEach((item: unknown) => {
    csv += `${item.date},${item.count}\n`
  })
  csv += "\n"

  // Top Categories
  csv += "TOP CATEGORIES\n"
  csv += "Category\n"
  journalStats.topCategories.forEach((category: string) => {
    csv += `"${category}"\n`
  })
  csv += "\n"

  // Review Statistics
  csv += "REVIEW STATISTICS\n"
  csv += "Average Review Time (days),Completion Rate (%)\n"
  csv += `${exportData.reviewStats.averageReviewTime.toFixed(2)},${exportData.reviewStats.completionRate.toFixed(2)}\n\n`

  // Top Page Views
  csv += "TOP PAGE VIEWS\n"
  csv += "Article ID,Views,Unique Visitors\n"
  exportData.topPageViews.forEach((item: unknown) => {
    csv += `${item.articleId},${item.views},${item.uniqueVisitors}\n`
  })

  return csv
}
