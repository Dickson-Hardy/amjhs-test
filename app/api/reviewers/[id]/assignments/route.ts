import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, articles, users } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.id

    // Verify user can access this data
    if (session.user.id !== userId && !["admin", "editor"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get review assignments for this reviewer
    const reviewAssignments = await db
      .select({
        reviewId: reviews.id,
        articleId: reviews.articleId,
        status: reviews.status,
        createdAt: reviews.createdAt,
        title: articles.title,
        category: articles.category,
        submittedDate: articles.submittedDate,
        content: articles.content,
        abstract: articles.abstract,
        authorId: articles.authorId,
        coAuthors: articles.coAuthors,
        files: articles.files,
      })
      .from(reviews)
      .innerJoin(articles, eq(reviews.articleId, articles.id))
      .where(eq(reviews.reviewerId, userId))
      .orderBy(desc(reviews.createdAt))

    // Transform the data to match the expected interface
    const assignments = await Promise.all(
      reviewAssignments.map(async (assignment) => {
        // Get author names
        const authorNames = []
        
        // Get main author
        if (assignment.authorId) {
          const mainAuthor = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, assignment.authorId))
          if (mainAuthor[0]) {
            authorNames.push(mainAuthor[0].name)
          }
        }

        // Add co-authors if they exist
        if (assignment.coAuthors && Array.isArray(assignment.coAuthors)) {
          authorNames.push(...assignment.coAuthors)
        }

        // Calculate deadline (14 days from assignment)
        const deadline = new Date(assignment.createdAt)
        deadline.setDate(deadline.getDate() + 14)

        // Estimate word count from content
        const wordCount = assignment.content ? assignment.content.split(/\s+/).length : 0

        return {
          id: assignment.reviewId,
          articleId: assignment.articleId,
          title: assignment.title,
          category: assignment.category,
          submittedDate: assignment.submittedDate.toISOString(),
          deadline: deadline.toISOString(),
          status: assignment.status,
          priority: "medium" as const, // Default priority
          wordCount,
          authors: authorNames,
          abstract: assignment.abstract || "",
          files: assignment.files || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      assignments,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/reviewers/[id]/assignments` })
    return NextResponse.json({ success: false, error: "Failed to fetch reviewer assignments" }, { status: 500 })
  }
}
