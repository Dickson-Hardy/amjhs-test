import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      recommendation, 
      comments, 
      confidentialComments, 
      rating,
      strengths,
      weaknesses,
      suggestions 
    } = await request.json()
    
    const resolvedParams = await Promise.resolve(params)
    const reviewId = resolvedParams.id

    // Combine all feedback into comments
    const fullComments = `
STRENGTHS:
${strengths}

WEAKNESSES:
${weaknesses}

SUGGESTIONS FOR IMPROVEMENT:
${suggestions}

DETAILED COMMENTS:
${comments}
    `.trim()

    // Update review with completed status and feedback
    await db
      .update(reviews)
      .set({ 
        status: "completed",
        recommendation,
        comments: fullComments,
        confidentialComments,
        rating: parseInt(rating),
        submittedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/reviews/[id]/submit` })
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 })
  }
}
