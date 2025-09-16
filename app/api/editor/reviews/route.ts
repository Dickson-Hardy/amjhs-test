import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { review_assignments, users, articles } from "@/lib/db/schema"
import { eq, and, or, desc, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor permissions
    if (!["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Build query conditions
    let whereConditions = []
    
    if (status && status !== "all") {
      whereConditions.push(eq(review_assignments.status, status))
    }

    // Fetch reviews with reviewer and article information
    const reviewsQuery = db
      .select({
        id: review_assignments.id,
        manuscriptId: review_assignments.articleId,
        manuscriptTitle: articles.title,
        reviewerId: review_assignments.reviewerId,
        reviewerName: users.name,
        assignedDate: review_assignments.assignedAt,
        dueDate: review_assignments.dueDate,
        status: review_assignments.status,
        score: review_assignments.reviewScore,
        completedDate: review_assignments.completedAt,
        quality: sql<string>`CASE 
          WHEN ${review_assignments.reviewScore} >= 9 THEN 'excellent'
          WHEN ${review_assignments.reviewScore} >= 7 THEN 'good'
          WHEN ${review_assignments.reviewScore} >= 5 THEN 'fair'
          ELSE 'poor'
        END`.as('quality')
      })
      .from(review_assignments)
      .leftJoin(users, eq(review_assignments.reviewerId, users.id))
      .leftJoin(articles, eq(review_assignments.articleId, articles.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(review_assignments.assignedAt))

    const reviews = await reviewsQuery

    // Filter by search term if provided
    let filteredReviews = reviews
    if (search) {
      const searchLower = search.toLowerCase()
      filteredReviews = reviews.filter(review => 
        review.manuscriptTitle?.toLowerCase().includes(searchLower) ||
        review.reviewerName?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      reviews: filteredReviews
    })

  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}