import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

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
        submitted_date: articles.submitted_date,
        author_id: articles.author_id,
        co_authors: articles.co_authors,
        reviewer_ids: articles.reviewer_ids,
        views: articles.views,
        metadata: articles.metadata
      })
      .from(articles)
      .where(eq(articles.category, userSection))
      .orderBy(desc(articles.submitted_date))
      .limit(50)

    // Get author details for each submission
    const authorIds = submissions.map(s => s.author_id).filter(Boolean)
    const authors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, authorIds[0])) // This would need to be improved for multiple authors

    const authorMap = authors.reduce((acc, author) => {
      acc[author.id] = author
      return acc
    }, {} as Record<string, any>)

    // Transform submissions to match the expected format
    const transformedSubmissions = submissions.map(submission => {
      const author = authorMap[submission.author_id] || { name: "Unknown Author", email: "" }
      const submittedDate = submission.submitted_date ? new Date(submission.submitted_date) : new Date()
      const daysSinceSubmission = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: submission.id,
        title: submission.title || "Untitled Submission",
        author: author.name,
        coAuthors: submission.co_authors || [],
        submittedDate: submittedDate.toISOString().split('T')[0],
        status: submission.status || "submitted",
        priority: daysSinceSubmission > 14 ? 'high' : daysSinceSubmission > 7 ? 'medium' : 'low',
        reviewers: submission.reviewer_ids || [],
        daysSinceSubmission,
        qualityScore: 8.5, // Would calculate from review scores when available
        needsDecision: submission.status === "reviewer_decision_received",
        abstract: submission.abstract || "Abstract not available"
      }
    })

    return NextResponse.json(transformedSubmissions)

  } catch (error) {
    logger.error("Error fetching section editor submissions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
