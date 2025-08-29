import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { reviews, articles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"
import { emailTemplates } from "@/lib/email-templates"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const reviewId = params.id
    const action = params.action

    if (!["accept", "decline"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      )
    }

    // Get review details
    const review = await db
      .select({
        id: reviews.id,
        articleId: reviews.articleId,
        reviewerId: reviews.reviewerId,
        status: reviews.status,
        articleTitle: articles.title,
        reviewerName: users.name,
        reviewerEmail: users.email,
      })
      .from(reviews)
      .innerJoin(articles, eq(reviews.articleId, articles.id))
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (review.length === 0) {
      return Response.json(
        { error: "Review invitation not found" },
        { status: 404 }
      )
    }

    const reviewData = review[0]

    // Check if review is still pending
    if (reviewData.status !== "pending") {
      return Response.json(
        { error: "Review invitation has already been responded to" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { alternativeReviewers, declineReason } = body

    // Update review status
    const newStatus = action === "accept" ? "accepted" : "declined"
    
    await db
      .update(reviews)
      .set({
        status: newStatus,
        submittedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))

    // Generate manuscript number
    const manuscriptNumber = `AMHSJ-${new Date().getFullYear()}-${reviewData.articleId.slice(-8).toUpperCase()}`

    if (action === "accept") {
      // Send confirmation email with access instructions
      const deadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString()
      const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reviewer/dashboard/review/${reviewId}`

      try {
        const emailContent = emailTemplates.reviewAcceptanceConfirmation(
          reviewData.reviewerName,
          reviewData.articleTitle,
          manuscriptNumber,
          accessUrl,
          deadline
        )

        await sendEmail({
          to: reviewData.reviewerEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } catch (emailError) {
        logger.error("Failed to send confirmation email:", emailError)
      }

      return Response.json({
        success: true,
        message: "Review invitation accepted successfully",
        accessUrl,
        deadline,
      })

    } else {
      // Handle decline
      // Store decline reason and alternative reviewers if provided
      if (declineReason || alternativeReviewers) {
        // In a real implementation, you might want to store this in a separate table
        logger.info("Decline reason:", declineReason)
        logger.info("Alternative reviewers:", alternativeReviewers)
      }

      // Send notification to editorial team
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL || "editor@amhsj.org",
          subject: `Review Invitation Declined - ${reviewData.articleTitle}`,
          html: `
            <h3>Review Invitation Declined</h3>
            <p><strong>Reviewer:</strong> ${reviewData.reviewerName}</p>
            <p><strong>Article:</strong> ${reviewData.articleTitle}</p>
            <p><strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
            ${declineReason ? `<p><strong>Reason:</strong> ${declineReason}</p>` : ''}
            ${alternativeReviewers ? `<p><strong>Alternative Reviewers Suggested:</strong> ${alternativeReviewers}</p>` : ''}
            <p>Please assign a new reviewer for this manuscript.</p>
          `,
        })
      } catch (emailError) {
        logger.error("Failed to send decline notification:", emailError)
      }

      return Response.json({
        success: true,
        message: "Review invitation declined successfully",
      })
    }

  } catch (error) {
    logger.error("Error processing reviewer response:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    const review = await db
      .select({
        id: reviews.id,
        articleId: reviews.articleId,
        reviewerId: reviews.reviewerId,
        status: reviews.status,
        createdAt: reviews.createdAt,
        articleTitle: articles.title,
        articleAbstract: articles.abstract,
        articleKeywords: articles.keywords,
        reviewerName: users.name,
        reviewerEmail: users.email,
      })
      .from(reviews)
      .innerJoin(articles, eq(reviews.articleId, articles.id))
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (review.length === 0) {
      return Response.json(
        { error: "Review invitation not found" },
        { status: 404 }
      )
    }

    const reviewData = review[0]
    const manuscriptNumber = `AMHSJ-${new Date().getFullYear()}-${reviewData.articleId.slice(-8).toUpperCase()}`

    return Response.json({
      invitation: {
        ...reviewData,
        manuscriptNumber,
      },
    })

  } catch (error) {
    logger.error("Error retrieving review invitation:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
