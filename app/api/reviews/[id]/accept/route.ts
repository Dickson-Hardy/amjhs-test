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

    const resolvedParams = await Promise.resolve(params)
    const reviewId = resolvedParams.id

    // Update review status to in_progress
    await db
      .update(reviews)
      .set({ status: "in_progress" })
      .where(eq(reviews.id, reviewId))

    return NextResponse.json({
      success: true,
      message: "Review accepted successfully",
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/reviews/[id]/accept` })
    return NextResponse.json({ success: false, error: "Failed to accept review" }, { status: 500 })
  }
}
