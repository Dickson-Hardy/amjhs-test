import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify the article exists and user has access to it
    const [article] = await db
      .select({ authorId: articles.authorId })
      .from(articles)
      .where(eq(articles.id, articleId))

    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 })
    }

    // Check if user is the author or has appropriate role
    const hasAccess = session.user.id === article.authorId || 
                     ["admin", "editor"].includes(session.user.role || "")

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch reviews for this article
    const articleReviews = await db
      .select({
        id: reviews.id,
        status: reviews.status,
        recommendation: reviews.recommendation,
        comments: reviews.comments,
        rating: reviews.rating,
        submittedAt: reviews.submittedAt,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
        reviewerEmail: users.email,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.articleId, articleId))
      .orderBy(desc(reviews.createdAt))

    // Format reviews for frontend (hide confidential comments from authors)
    const formattedReviews = articleReviews.map((review) => ({
      id: review.id,
      reviewerName: review.reviewerName || "Anonymous Reviewer",
      status: review.status,
      submittedAt: review.submittedAt?.toISOString(),
      comments: review.comments,
      decision: review.recommendation,
    }))

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${articleId}/reviews` })
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 })
  }
}