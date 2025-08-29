import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, submissions, reviews } from '@/lib/db/schema'
import { eq, count, desc } from 'drizzle-orm'

export async function GET() {
  try {
    // Get section editors with their workload information
    const sectionEditors = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        expertise: users.expertise,
        specialization: users.specialization,
      })
      .from(users)
      .where(eq(users.role, 'section_editor'))

    // For each editor, get their current workload
    const editorsWithWorkload = await Promise.all(
      sectionEditors.map(async (editor) => {
        // Get assigned submissions count
        const assignedSubmissions = await db
          .select({ count: count() })
          .from(submissions)
          .where(eq(submissions.assignedEditorId, editor.id))

        // Get pending reviews they're managing
        const pendingReviews = await db
          .select({ count: count() })
          .from(reviews)
          .leftJoin(submissions, eq(reviews.submissionId, submissions.id))
          .where(eq(submissions.assignedEditorId, editor.id))

        return {
          id: editor.id,
          name: `${editor.firstName} ${editor.lastName}`,
          email: editor.email,
          specialization: editor.specialization || 'General',
          expertise: editor.expertise ? editor.expertise.split(',') : [],
          currentSubmissions: assignedSubmissions[0]?.count || 0,
          capacity: 10, // Default capacity - would be stored in user settings
          pendingReviews: pendingReviews[0]?.count || 0,
          averageResponseTime: 14.5, // Days - would calculate from actual data
          performanceRating: 4.2, // Out of 5 - would calculate from performance metrics
          status: 'active',
          workloadPercentage: Math.round(((assignedSubmissions[0]?.count || 0) / 10) * 100),
          lastActive: new Date().toISOString().split('T')[0], // Would track actual last activity
        }
      })
    )

    return NextResponse.json(editorsWithWorkload)
  } catch (error) {
    logger.error('Error fetching editor workloads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch editor workloads' },
      { status: 500 }
    )
  }
}
