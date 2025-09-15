import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { normalizeStatus } from "@/lib/status"
import { logError } from "@/lib/logger"
import { articles, users } from "@/lib/db/schema"
import { eq, and, desc, inArray } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has section editor role or higher
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get user's section from their profile
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    const userSection = user[0]?.specializations?.[0] || "General"

    // Fetch submissions for this section
    const submissions = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        status: articles.status,
  submitted_date: articles.submittedDate,
  author_id: articles.authorId,
  co_authors: articles.coAuthors,
  reviewer_ids: articles.reviewerIds,
        views: articles.views,
        metadata: articles.metadata
      })
      .from(articles)
      .where(eq(articles.category, userSection))
  .orderBy(desc(articles.submittedDate))
      .limit(50)

    // Get author details for each submission
    const authorIds = submissions.map(s => s.author_id).filter((v): v is string => typeof v === "string")
    const authors = authorIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email
          })
          .from(users)
          .where(inArray(users.id, authorIds))
      : []

    const authorMap = authors.reduce((acc, author) => {
      acc[author.id] = author
      return acc
    }, {} as Record<string, any>)

    // Transform submissions to match the expected format
    const transformedSubmissions = submissions.map(submission => {
  const authorKey = (submission.author_id as string) || "unknown"
  const author = authorMap[authorKey] || { name: "Unknown Author", email: "" }
      const submittedDate = submission.submitted_date ? new Date(submission.submitted_date) : new Date()
      const daysSinceSubmission = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
      const status = normalizeStatus(submission.status as string) || submission.status || "submitted"
      
      return {
        id: submission.id,
        title: submission.title || "Untitled Submission",
        author: author.name,
        coAuthors: submission.co_authors || [],
        submittedDate: submittedDate.toISOString().split('T')[0],
        status: status,
        priority: daysSinceSubmission > 14 ? 'high' : daysSinceSubmission > 7 ? 'medium' : 'low',
        reviewers: submission.reviewer_ids || [],
        daysSinceSubmission,
        qualityScore: 8.5, // Would calculate from review scores when available
        needsDecision: status === "associate_editor_review" || status === "under_review",
        abstract: submission.abstract || "Abstract not available"
      }
    })

    return NextResponse.json(transformedSubmissions)

  } catch (error) {
    logError(error as Error, { endpoint: "/api/section-editor/submissions", action: "fetchSectionEditorSubmissions" })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
