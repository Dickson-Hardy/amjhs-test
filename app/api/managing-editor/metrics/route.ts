import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, users, reviews } from '@/lib/db/schema'
import { count, eq, and, gte, desc } from 'drizzle-orm'

export async function GET() {
  try {
    // Get total submissions
    const totalSubmissions = await db
      .select({ count: count() })
      .from(submissions)

    // Get active reviews
    const activeReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, 'pending'))

    // Get overdue reviews (more than 30 days)
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const overdueReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(
        eq(reviews.status, 'pending'),
        gte(reviews.createdAt, overdueDate)
      ))

    // Get total active editors
    const activeEditors = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'section_editor'))

    // Calculate average response time (placeholder calculation)
    const averageResponseTime = 18.5 // Days - would calculate from actual review data
    const systemEfficiency = 92.3 // Percentage - would calculate from workflow metrics
    const editorSatisfaction = 4.2 // Out of 5 - would calculate from survey data
    const workflowBottlenecks = 3 // Count - would identify from system analysis

    const metrics = {
      totalSubmissions: totalSubmissions[0]?.count || 0,
      activeReviews: activeReviews[0]?.count || 0,
      overdueReviews: overdueReviews[0]?.count || 0,
      activeEditors: activeEditors[0]?.count || 0,
      averageResponseTime,
      systemEfficiency,
      editorSatisfaction,
      workflowBottlenecks
    }

    return NextResponse.json(metrics)
  } catch (error) {
    logger.error('Error fetching managing editor metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
