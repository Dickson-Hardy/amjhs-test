import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, notifications } from "@/lib/db/schema"
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

    const { decision, comments } = await request.json()

    // Update article status based on decision
    let newStatus = "submitted"
    switch (decision) {
      case "accept":
        newStatus = "accepted"
        break
      case "minor_revision":
      case "major_revision":
        newStatus = "revision_requested"
        break
      case "reject":
        newStatus = "rejected"
        break
    }

    // Get article details for notification
    const article = await db
      .select({ authorId: articles.authorId, title: articles.title })
      .from(articles)
      .where(eq(articles.id, manuscriptId))

    await db
      .update(articles)
      .set({ status: newStatus })
      .where(eq(articles.id, manuscriptId))

    // Create notification for author
    if (article[0]?.authorId) {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: article[0].authorId,
        title: `Editorial Decision: ${article[0].title}`,
        message: `Your manuscript has received an editorial decision: ${decision.replace("_", " ")}. ${comments}`,
        type: "editorial",
        relatedId: manuscriptId,
        isRead: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Editorial decision recorded successfully",
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/decision` })
    return NextResponse.json({ success: false, error: "Failed to record decision" }, { status: 500 })
  }
}
