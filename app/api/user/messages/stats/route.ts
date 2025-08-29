import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { eq, and, count, sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total message count
    const totalResult = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.recipientId, session.user.id))

    // Get unread message count
    const unreadResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.recipientId, session.user.id),
        eq(messages.status, 'unread')
      ))

    // Get messages by type
    const editorialResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.recipientId, session.user.id),
        eq(messages.messageType, 'editorial')
      ))

    const reviewResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.recipientId, session.user.id),
        eq(messages.messageType, 'review')
      ))

    const systemResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.recipientId, session.user.id),
        eq(messages.messageType, 'system')
      ))

    const stats = {
      total: totalResult[0]?.count || 0,
      unread: unreadResult[0]?.count || 0,
      editorial: editorialResult[0]?.count || 0,
      review: reviewResult[0]?.count || 0,
      system: systemResult[0]?.count || 0
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/messages/stats` })
    return NextResponse.json({ success: false, error: "Failed to fetch message stats" }, { status: 500 })
  }
}
