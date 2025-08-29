import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    // Get submissions for special issue (would filter by current user's special issue)
    const specialIssueSubmissions = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        author: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
        submittedAt: submissions.createdAt,
        status: submissions.status,
        priority: submissions.priority,
        abstract: submissions.abstract,
        keywords: submissions.keywords,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(eq(submissions.specialIssue, 'special_issue_ai_healthcare'))
      .orderBy(desc(submissions.createdAt))

    const formattedSubmissions = specialIssueSubmissions.map(submission => ({
      id: submission.id,
      title: submission.title,
      author: `${submission.author} ${submission.authorLastName}`,
      coAuthors: [], // Would need to implement co-authors table
      submittedDate: submission.submittedAt?.toISOString().split('T')[0] || '',
      status: submission.status,
      priority: submission.priority || 'medium',
      reviewers: [], // Would need to join with reviewer assignments
      specialIssueRelevance: 8.5, // Would calculate based on keywords and abstract
      keywords: submission.keywords ? submission.keywords.split(',') : [],
      abstract: submission.abstract || '',
      needsGuestDecision: ['reviewer_decision_received', 'revision_received'].includes(submission.status || ''),
    }))

    return NextResponse.json(formattedSubmissions)
  } catch (error) {
    logError(error as Error, {
      context: 'GET /api/guest-editor/submissions'
    })
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
