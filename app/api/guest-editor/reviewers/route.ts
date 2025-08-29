import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, reviewInvitations } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    // Get reviewers invited for special issue
    const specialIssueReviewers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        expertise: users.expertise,
        invitationStatus: reviewInvitations.status,
      })
      .from(users)
      .leftJoin(reviewInvitations, eq(users.id, reviewInvitations.reviewerId))
      .where(inArray(users.role, ['reviewer', 'section_editor']))

    const formattedReviewers = specialIssueReviewers.map(reviewer => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      expertise: Array.isArray(reviewer.expertise) ? reviewer.expertise : [],
      invitationStatus: reviewer.invitationStatus || 'not_invited',
      assignedSubmissions: [], // Would need to query reviewer assignments
      specialIssueRelevance: 8.5, // Would calculate based on expertise matching
      responseTime: 12, // Would calculate from actual response data
    }))

    return NextResponse.json(formattedReviewers)
  } catch (error) {
    logger.error('Error fetching guest editor reviewers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviewers' },
      { status: 500 }
    )
  }
}
