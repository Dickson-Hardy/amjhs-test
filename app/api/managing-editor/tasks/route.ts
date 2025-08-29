import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, reviews, users } from '@/lib/db/schema'
import { eq, desc, and, gte } from 'drizzle-orm'

export async function GET() {
  try {
    // Get overdue reviews
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const overdueReviews = await db
      .select({
        reviewId: reviews.id,
        submissionId: submissions.id,
        submissionTitle: submissions.title,
        reviewerName: users.firstName,
        reviewerLastName: users.lastName,
        assignedAt: reviews.createdAt,
        dueDate: reviews.dueDate,
      })
      .from(reviews)
      .leftJoin(submissions, eq(reviews.submissionId, submissions.id))
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(and(
        eq(reviews.status, 'pending'),
        gte(reviews.createdAt, overdueDate)
      ))
      .orderBy(desc(reviews.createdAt))
      .limit(5)

    // Get high priority submissions needing attention
    const urgentSubmissions = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        author: users.firstName,
        authorLastName: users.lastName,
        status: submissions.status,
        priority: submissions.priority,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(eq(submissions.priority, 'high'))
      .orderBy(desc(submissions.createdAt))
      .limit(3)

    const tasks = [
      // Overdue reviews
      ...overdueReviews.map(review => ({
        id: `overdue_${review.reviewId}`,
        type: 'overdue_review',
        title: `Overdue Review: ${review.submissionTitle}`,
        description: `Review by ${review.reviewerName} ${review.reviewerLastName} is overdue`,
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: review.dueDate?.toISOString().split('T')[0] || '',
        assignedTo: `${review.reviewerName} ${review.reviewerLastName}`,
        category: 'Review Management',
        submissionId: review.submissionId,
        daysOverdue: Math.floor((Date.now() - new Date(review.dueDate || '').getTime()) / (1000 * 60 * 60 * 24))
      })),

      // Urgent submissions
      ...urgentSubmissions.map(submission => ({
        id: `urgent_${submission.id}`,
        type: 'urgent_submission',
        title: `High Priority: ${submission.title}`,
        description: `Urgent submission by ${submission.author} ${submission.authorLastName} needs attention`,
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Managing Editor',
        category: 'Submission Management',
        submissionId: submission.id,
        currentStatus: submission.status
      })),

      // System maintenance tasks
      {
        id: 'system_backup',
        type: 'system_maintenance',
        title: 'Weekly System Backup',
        description: 'Perform weekly backup of submission and review data',
        priority: 'medium' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'System Admin',
        category: 'System Management',
        estimatedTime: '2 hours'
      },

      {
        id: 'editor_performance_review',
        type: 'performance_review',
        title: 'Monthly Editor Performance Review',
        description: 'Review and assess section editor performance metrics',
        priority: 'medium' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Managing Editor',
        category: 'Performance Management',
        estimatedTime: '4 hours'
      }
    ]

    return NextResponse.json(tasks.slice(0, 10)) // Limit to 10 tasks
  } catch (error) {
    logger.error('Error fetching managing editor tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
