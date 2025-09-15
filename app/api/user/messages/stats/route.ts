import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversations } from "@/lib/db/schema"
import { eq, and, count, sql, inArray, or } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find conversations where the user is a participant
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(or(
        eq(conversations.participant1Id, session.user.id),
        eq(conversations.participant2Id, session.user.id)
      ))

    const conversationIds = userConversations.map(c => c.id)

    if (conversationIds.length === 0) {
      // User has no conversations yet
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          unread: 0,
          editorial: 0,
          review: 0,
          system: 0
        }
      })
    }

    // Get total message count for user's conversations (excluding messages sent by the user)
    const totalResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.senderId} != ${session.user.id}` // Exclude messages sent by the user
      ))

    // Get unread message count
    const unreadResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.senderId} != ${session.user.id}`,
        eq(messages.isRead, false)
      ))

    // Get messages by type
    const editorialResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.senderId} != ${session.user.id}`,
        eq(messages.messageType, 'editorial')
      ))

    const reviewResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.senderId} != ${session.user.id}`,
        eq(messages.messageType, 'review')
      ))

    const systemResult = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.senderId} != ${session.user.id}`,
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
