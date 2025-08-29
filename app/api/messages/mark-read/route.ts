import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { messages, conversations } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageIds, conversationId } = await request.json()

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: "Message IDs array required" }, { status: 400 })
    }

    // Verify user has access to the conversation
    if (conversationId) {
      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${conversations.participants}) AS participant
              WHERE participant->>'id' = ${session.user.id}
            )`
          )
        )
        .limit(1)

      if (conversation.length === 0) {
        return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 403 })
      }
    }

    // Mark messages as read by updating the read_by field
    const readTimestamp = new Date().toISOString()
    const readEntry = { userId: session.user.id, readAt: readTimestamp }

    for (const messageId of messageIds) {
      await db
        .update(messages)
        .set({
          readBy: sql`
            CASE 
              WHEN ${messages.readBy} IS NULL THEN ${JSON.stringify([readEntry])}::jsonb
              WHEN NOT (${messages.readBy} @> ${JSON.stringify([{ userId: session.user.id }])}::jsonb) THEN ${messages.readBy} || ${JSON.stringify([readEntry])}::jsonb
              ELSE ${messages.readBy}
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId))
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/messages/mark-read POST" })
    return NextResponse.json({ success: false, error: "Failed to mark messages as read" }, { status: 500 })
  }
}
