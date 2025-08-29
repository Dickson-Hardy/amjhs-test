import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, articles, issues } from '@/lib/db/schema'
import { eq, count, and, gte, lte } from 'drizzle-orm'

export async function GET() {
  try {
    // Get total articles in production
    const totalInProduction = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.status, 'in_production'))

    // Get accepted articles pending production
    const pendingProduction = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.status, 'accepted'))

    // Get published articles this month
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const publishedThisMonth = await db
      .select({ count: count() })
      .from(articles)
      .where(and(
        gte(articles.publishedAt, startOfMonth),
        lte(articles.publishedAt, endOfMonth)
      ))

    // Get upcoming issues
    const upcomingIssues = await db
      .select({ count: count() })
      .from(issues)
      .where(gte(issues.targetDate, currentDate))

    const metrics = {
      totalInProduction: totalInProduction[0]?.count || 0,
      pendingProduction: pendingProduction[0]?.count || 0,
      publishedThisMonth: publishedThisMonth[0]?.count || 0,
      upcomingIssues: upcomingIssues[0]?.count || 0,
      averageProductionTime: 14, // Days - would calculate from actual data
      onTimeDelivery: 92.5, // Percentage - would calculate from actual data
      qualityScore: 9.2, // Would calculate from review data
      productionEfficiency: 88.3 // Percentage - would calculate from production metrics
    }

    return NextResponse.json(metrics)
  } catch (error) {
    logger.error('Error fetching production editor metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
