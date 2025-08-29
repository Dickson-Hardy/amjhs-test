import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: manuscriptId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["editor", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewerId } = await request.json()

    // Create a new review assignment
    await db.insert(reviews).values({
      id: uuidv4(),
      articleId: manuscriptId,
      reviewerId: reviewerId,
      status: "pending",
      createdAt: new Date(),
    })

    // Update article's reviewer list
    const article = await db
      .select({ reviewerIds: articles.reviewerIds })
      .from(articles)
      .where(eq(articles.id, manuscriptId))

    const currentReviewers = article[0]?.reviewerIds || []
    const updatedReviewers = [...currentReviewers, reviewerId]

    await db
      .update(articles)
      .set({ 
        reviewerIds: updatedReviewers,
        status: "under_review"
      })
      .where(eq(articles.id, manuscriptId))

    return NextResponse.json({
      success: true,
      message: "Reviewer assigned successfully",
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/assign-reviewer` })
    return NextResponse.json({ success: false, error: "Failed to assign reviewer" }, { status: 500 })
  }
}
