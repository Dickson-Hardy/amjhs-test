import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, submissions } from "@/lib/db/schema"
import { sql, eq, desc, or, and, isNull } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only editor-in-chief and admin can access this
    if (!session?.user || !["editor-in-chief", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const priority = url.searchParams.get('priority') // 'high', 'medium', 'low', or null for all
    const status = url.searchParams.get('status') // specific status filter
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Base conditions for submissions needing EIC attention
    let whereConditions = [
      or(
        // New: Manuscripts that passed screening and need EIC review
        eq(submissions.status, 'editor_in_chief_review'),
        // No editor assigned
        isNull(articles.editorId),
        // Stuck in technical check for too long (>14 days)
        and(
          eq(articles.status, 'editorial_assistant_review'),
          sql`EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 > 14`
        ),
        // Under review for too long (>45 days)
        and(
          eq(articles.status, 'under_review'),
          sql`EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 > 45`
        ),
        // Appeals or conflicts
        sql`status IN ('appeal_pending', 'conflict_resolution')`
      )
    ]

    // Add status filter if specified
    if (status && status !== 'all') {
      if (status === 'editor_in_chief_review') {
        whereConditions = [eq(submissions.status, 'editor_in_chief_review')]
      } else {
        whereConditions.push(eq(articles.status, status))
      }
    }

    // Get submissions requiring EIC attention
    const submissionResults = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        status: articles.status,
        submissionStatus: submissions.status,
        submittedDate: articles.submittedDate,
        updatedAt: articles.updatedAt,
        editorId: articles.editorId,
        submissionId: submissions.id,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          affiliation: users.affiliation,
        },
        daysSinceSubmission: sql<number>`
          EXTRACT(EPOCH FROM (NOW() - COALESCE(submitted_date, articles.created_at))) / 86400
        `,
        daysSinceUpdate: sql<number>`
          EXTRACT(EPOCH FROM (NOW() - GREATEST(articles.updated_at, submissions.updated_at))) / 86400
        `,
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(submissions.updatedAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .where(and(...whereConditions))

    const totalCount = totalCountResult[0]?.count || 0

    // Process submissions and add priority/flags
    const processedSubmissions = submissionResults.map((submission) => {
      const daysSinceSubmission = submission.daysSinceSubmission || 0
      const daysSinceUpdate = submission.daysSinceUpdate || 0
      
      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'low'
      let needsEICDecision = false
      let conflictOfInterest = false

      // High priority conditions
      if (
        submission.submissionStatus === 'editor_in_chief_review' || // New manuscripts passed screening
        !submission.editorId || // No editor assigned
        (submission.status === 'editorial_assistant_review' && daysSinceUpdate > 14) ||
        (submission.status === 'under_review' && daysSinceUpdate > 45) ||
        submission.status === 'appeal_pending' ||
        submission.status === 'conflict_resolution'
      ) {
        priority = 'high'
        needsEICDecision = true
      }
      // Medium priority
      else if (
        (submission.status === 'editorial_assistant_review' && daysSinceUpdate > 7) ||
        (submission.status === 'under_review' && daysSinceUpdate > 30) ||
        daysSinceSubmission > 60
      ) {
        priority = 'medium'
      }

      // Check for conflict indicators (placeholder logic)
      if (submission.status === 'conflict_resolution') {
        conflictOfInterest = true
      }

      return {
        id: submission.id,
        submissionId: submission.submissionId,
        title: submission.title,
        author: submission.author?.name || 'Unknown Author',
        section: submission.category,
        submittedDate: submission.submittedDate?.toISOString() || '',
        status: submission.submissionStatus || submission.status, // Prefer submission status
        priority,
        assignedEditor: submission.editorId ? 'Assigned' : 'Unassigned',
        conflictOfInterest,
        needsEICDecision,
        needsAssociateEditorAssignment: submission.submissionStatus === 'editor_in_chief_review',
        daysSinceSubmission: Math.floor(daysSinceSubmission),
        daysSinceUpdate: Math.floor(daysSinceUpdate),
        authorEmail: submission.author?.email,
        authorAffiliation: submission.author?.affiliation,
      }
    })

    // Filter by priority if requested
    const filteredSubmissions = priority 
      ? processedSubmissions.filter(sub => sub.priority === priority)
      : processedSubmissions

    return NextResponse.json({
      success: true,
      submissions: filteredSubmissions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/editor-in-chief/submissions` })
    return NextResponse.json({ success: false, error: "Failed to fetch submissions" }, { status: 500 })
  }
}
