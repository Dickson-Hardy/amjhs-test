import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reviewInvitations, articles, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      )
    }

    // Fetch the review invitation with article and reviewer details
    const invitation = await db
      .select({
        id: reviewInvitations.id,
        articleId: reviewInvitations.articleId,
        reviewerId: reviewInvitations.reviewerId,
        status: reviewInvitations.status,
        createdAt: reviewInvitations.createdAt,
        articleTitle: articles.title,
        articleAbstract: articles.abstract,
        articleKeywords: articles.keywords,
        manuscriptNumber: articles.manuscriptNumber,
        reviewerName: users.name,
        reviewerEmail: users.email,
      })
      .from(reviewInvitations)
      .innerJoin(articles, eq(reviewInvitations.articleId, articles.id))
      .innerJoin(users, eq(reviewInvitations.reviewerId, users.id))
      .where(eq(reviewInvitations.id, reviewId))
      .limit(1)

    if (invitation.length === 0) {
      return NextResponse.json(
        { error: "Review invitation not found" },
        { status: 404 }
      )
    }

    const invitationData = invitation[0]

    // Parse keywords if they exist and are stored as JSON string
    let parsedKeywords: string[] = []
    if (invitationData.articleKeywords) {
      try {
        if (typeof invitationData.articleKeywords === 'string') {
          parsedKeywords = JSON.parse(invitationData.articleKeywords)
        } else if (Array.isArray(invitationData.articleKeywords)) {
          parsedKeywords = invitationData.articleKeywords
        }
      } catch (error) {
        logger.error("Error parsing keywords:", error)
        parsedKeywords = []
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        ...invitationData,
        articleKeywords: parsedKeywords,
      },
    })

  } catch (error) {
    logger.error("Error fetching review invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
