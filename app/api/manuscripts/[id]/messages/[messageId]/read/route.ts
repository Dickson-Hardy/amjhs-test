import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; messageId: string }> | { id: string; messageId: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const { id: manuscriptId, messageId } = params;
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Update message as read if the current user is the recipient or participant
    await db
      .update(messages)
      .set({
        isRead: true,
      })
      .where(eq(messages.id, messageId))

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    const params = await Promise.resolve(context.params);
    const { id: manuscriptId, messageId } = params;
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/messages/${messageId}/read` })
    return NextResponse.json({ success: false, error: "Failed to mark message as read" }, { status: 500 })
  }
}
