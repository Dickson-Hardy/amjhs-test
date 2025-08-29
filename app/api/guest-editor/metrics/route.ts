import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, reviews } from '@/lib/db/schema'
import { eq, count, and, gte, desc } from 'drizzle-orm'

export async function GET() {
  try {
    // Get special issue submission metrics
    const specialIssueTag = 'special_issue_ai_healthcare' // This would be dynamic based on current user's special issue
    
    const totalSubmissions = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.specialIssue, specialIssueTag))

    const acceptedSubmissions = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        eq(submissions.specialIssue, specialIssueTag),
        eq(submissions.status, 'accepted')
      ))

    const pendingReviews = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        eq(submissions.specialIssue, specialIssueTag),
        eq(submissions.status, 'under_review')
      ))

    const completedReviews = await db
      .select({ count: count() })
      .from(reviews)
      .leftJoin(submissions, eq(reviews.submissionId, submissions.id))
      .where(and(
        eq(submissions.specialIssue, specialIssueTag),
        eq(reviews.status, 'completed')
      ))

    // Calculate days remaining until submission deadline
    const submissionDeadline = new Date('2024-03-15')
    const daysRemaining = Math.ceil((submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const metrics = {
      totalSubmissions: totalSubmissions[0]?.count || 0,
      acceptedSubmissions: acceptedSubmissions[0]?.count || 0,
      pendingReviews: pendingReviews[0]?.count || 0,
      completedReviews: completedReviews[0]?.count || 0,
      targetSubmissions: 25,
      deadlineStatus: daysRemaining > 0 ? 'on_track' : 'overdue',
      daysRemaining: Math.max(0, daysRemaining),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    logger.error('Error fetching guest editor metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
