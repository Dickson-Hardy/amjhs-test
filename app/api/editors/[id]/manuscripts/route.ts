import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, reviews } from "@/lib/db/schema"
import { eq, desc, and, inArray } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["editor", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params

    // Get manuscripts assigned to this editor
    const manuscriptResults = await db
      .select({
        id: articles.id,
        title: articles.title,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        authorId: articles.authorId,
        coAuthors: articles.coAuthors,
        reviewerIds: articles.reviewerIds,
        abstract: articles.abstract,
        content: articles.content,
      })
      .from(articles)
      .where(eq(articles.editorId, userId))
      .orderBy(desc(articles.submittedDate))

    // Transform the data to match the expected interface
    const manuscripts = await Promise.all(
      manuscriptResults.map(async (manuscript) => {
        // Get author names
        const authorNames = []
        
        // Get main author
        if (manuscript.authorId) {
          const mainAuthor = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, manuscript.authorId))
          if (mainAuthor[0]) {
            authorNames.push(mainAuthor[0].name)
          }
        }

        // Add co-authors if they exist
        if (manuscript.coAuthors && Array.isArray(manuscript.coAuthors)) {
          authorNames.push(...manuscript.coAuthors)
        }

        // Get reviewer information
        const reviewerInfo = []
        if (manuscript.reviewerIds && Array.isArray(manuscript.reviewerIds)) {
          const reviewerResults = await db
            .select({
              reviewerId: reviews.reviewerId,
              status: reviews.status,
              name: users.name,
            })
            .from(reviews)
            .innerJoin(users, eq(reviews.reviewerId, users.id))
            .where(
              and(
                eq(reviews.articleId, manuscript.id),
                inArray(reviews.reviewerId, manuscript.reviewerIds)
              )
            )

          reviewerInfo.push(...reviewerResults.map(r => ({
            id: r.reviewerId,
            name: r.name,
            status: r.status,
          })))
        }

        // Calculate deadline (21 days from submission)
        const deadline = new Date(manuscript.submittedDate)
        deadline.setDate(deadline.getDate() + 21)

        // Estimate word count from content
        const wordCount = manuscript.content ? manuscript.content.split(/\s+/).length : 0

        return {
          id: manuscript.id,
          title: manuscript.title,
          authors: authorNames,
          category: manuscript.category,
          submittedDate: manuscript.submittedDate.toISOString(),
          status: manuscript.status as "submitted" | "under_review" | "revision_requested" | "accepted" | "rejected" | "published",
          priority: "medium" as const, // Default priority
          reviewers: reviewerInfo,
          deadline: deadline.toISOString(),
          wordCount,
          abstract: manuscript.abstract || "",
        }
      })
    )

    return NextResponse.json({
      success: true,
      manuscripts,
    })
  } catch (error) {
    const { id } = await params
    logError(error as Error, { endpoint: `/api/editors/${id}/manuscripts` })
    return NextResponse.json({ success: false, error: "Failed to fetch editor manuscripts" }, { status: 500 })
  }
}
