import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversations, users, articles } from "@/lib/db/schema"
import { eq, and, desc, asc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query conditions
    let conditions = [eq(messages.recipientId, session.user.id)]
    
    if (type && type !== 'all') {
      conditions.push(eq(messages.messageType, type as any))
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(messages.status, status as any))
    }

    // Fetch messages for the current user
    const userMessages = await db
      .select({
        id: messages.id,
        subject: messages.subject,
        content: messages.content,
        messageType: messages.messageType,
        priority: messages.priority,
        status: messages.status,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        submissionId: messages.submissionId,
        isReply: messages.isReply,
        parentMessageId: messages.parentMessageId,
        attachments: messages.attachments,
        // Sender info
        senderName: users.name,
        senderRole: users.role,
        senderEmail: users.email,
        // Submission info if available
        submissionTitle: articles.title,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(articles, eq(messages.submissionId, articles.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit)

    // Format messages for the frontend
    const formattedMessages = userMessages.map(msg => ({
      id: msg.id,
      subject: msg.subject,
      content: msg.content,
      messageType: msg.messageType || 'general',
      priority: msg.priority || 'medium',
      status: msg.status || 'unread',
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sender: {
        id: msg.senderId,
        name: msg.senderName || 'Unknown',
        role: msg.senderRole || 'user',
        email: msg.senderEmail || ''
      },
      recipients: [{
        id: msg.recipientId,
        name: session.user.name || 'Unknown',
        role: session.user.role || 'user',
        email: session.user.email || ''
      }],
      submissionId: msg.submissionId,
      submissionTitle: msg.submissionTitle,
      isReply: msg.isReply || false,
      parentMessageId: msg.parentMessageId,
      attachments: msg.attachments || [],
      thread: [] // Will be populated if needed
    }))

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/messages` })
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 })
  }
}
