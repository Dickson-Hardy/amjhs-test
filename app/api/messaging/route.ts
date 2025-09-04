import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversations, users, articles, submissions } from "@/lib/db/schema"
import { eq, and, or, desc, inArray } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { z } from "zod"

const messageSchema = z.object({
  recipientType: z.enum(["author", "editor", "reviewer", "editorial-assistant", "associate-editor", "admin"]),
  recipientId: z.string().uuid().optional(),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  submissionId: z.string().uuid().optional(),
  messageType: z.enum(["editorial", "review", "system", "general"]).default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
})

// GET - Fetch messages for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Find conversations where user is a participant
    let whereConditions = or(
      eq(conversations.participant1Id, session.user.id),
      eq(conversations.participant2Id, session.user.id)
    )

    if (submissionId) {
      whereConditions = and(
        whereConditions,
        eq(conversations.relatedId, submissionId)
      )
    }

    const userConversations = await db
      .select()
      .from(conversations)
      .where(whereConditions)
      .orderBy(desc(conversations.lastActivity))
      .limit(limit)

    // Get messages for these conversations
    const conversationIds = userConversations.map(c => c.id)
    let allMessages = []

    if (conversationIds.length > 0) {
      const messagesData = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          subject: messages.subject,
          messageType: messages.messageType,
          priority: messages.priority,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          attachments: messages.attachments,
          // Sender info
          senderName: users.name,
          senderRole: users.role,
          senderEmail: users.email,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(inArray(messages.conversationId, conversationIds))
        .orderBy(desc(messages.createdAt))

      // Group messages by conversation and add conversation context
      for (const msg of messagesData) {
        const conversation = userConversations.find(c => c.id === msg.conversationId)
        allMessages.push({
          id: msg.id,
          submissionId: conversation?.relatedId || null,
          submissionTitle: conversation?.relatedTitle || null,
          senderId: msg.senderId,
          senderName: msg.senderName || "Unknown",
          senderRole: msg.senderRole || "user",
          senderEmail: msg.senderEmail || "",
          recipientId: session.user.id,
          recipientName: session.user.name || "You",
          subject: msg.subject || conversation?.subject || "No Subject",
          content: msg.content,
          messageType: msg.messageType || "general",
          priority: msg.priority || "medium",
          createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
          readAt: null,
          isRead: msg.isRead || false,
          threadId: msg.conversationId,
          parentMessageId: null,
          attachments: msg.attachments || [],
        })
      }
    }

    return NextResponse.json({
      success: true,
      messages: allMessages,
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/messaging GET" })
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Resolve recipient based on type and context
    let recipientId = validatedData.recipientId
    let recipientInfo = null

    if (!recipientId) {
      const resolvedId = await resolveRecipient(validatedData.recipientType, validatedData.submissionId, session.user.id)
      if (!resolvedId) {
        return NextResponse.json({ error: "Could not find recipient" }, { status: 400 })
      }
      recipientId = resolvedId
    }

    // Get recipient details
    const recipient = await db
      .select({ id: users.id, name: users.name, role: users.role, email: users.email })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1)

    if (!recipient.length) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    recipientInfo = recipient[0]

    // Get submission info if provided
    let submissionTitle = null
    if (validatedData.submissionId) {
      const submission = await db
        .select({ title: articles.title })
        .from(articles)
        .where(eq(articles.id, validatedData.submissionId))
        .limit(1)

      submissionTitle = submission[0]?.title || null
    }

    // Find existing conversation or create new one
    let conversationId = null
    const existingConversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.relatedId, validatedData.submissionId || ""),
          or(
            and(
              eq(conversations.participant1Id, session.user.id),
              eq(conversations.participant2Id, recipientId)
            ),
            and(
              eq(conversations.participant1Id, recipientId),
              eq(conversations.participant2Id, session.user.id)
            )
          )
        )
      )
      .limit(1)

    if (existingConversation.length) {
      conversationId = existingConversation[0].id
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(conversations)
        .values({
          subject: validatedData.subject,
          type: validatedData.messageType,
          relatedId: validatedData.submissionId || null,
          relatedTitle: submissionTitle,
          participant1Id: session.user.id,
          participant2Id: recipientId,
          lastActivity: new Date(),
        })
        .returning()

      conversationId = newConversation[0].id
    }

    // Create the message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        content: validatedData.content,
        subject: validatedData.subject,
        messageType: validatedData.messageType,
        priority: validatedData.priority,
        isRead: false,
        attachments: [],
      })
      .returning()

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastActivity: new Date(),
        lastMessageId: newMessage[0].id,
      })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage[0].id,
        submissionId: validatedData.submissionId,
        submissionTitle,
        senderId: session.user.id,
        senderName: session.user.name || "You",
        senderRole: session.user.role || "user",
        recipientId,
        recipientName: recipientInfo.name || "Unknown",
        subject: validatedData.subject,
        content: validatedData.content,
        createdAt: newMessage[0].createdAt?.toISOString() || new Date().toISOString(),
        readAt: null,
        isRead: false,
        threadId: conversationId,
        parentMessageId: null,
        attachments: [],
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }

    logError(error as Error, { endpoint: "/api/messaging POST" })
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

// Helper function to resolve recipient based on type and context
async function resolveRecipient(recipientType: string, submissionId?: string, currentUserId?: string): Promise<string | null> {
  try {
    switch (recipientType) {
      case "admin":
        const admin = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1)
        return admin[0]?.id || null

      case "editor":
        if (submissionId) {
          // Get assigned editor for this submission
          const submission = await db
            .select({ editorId: articles.editorId })
            .from(articles)
            .where(eq(articles.id, submissionId))
            .limit(1)
          
          if (submission[0]?.editorId) {
            return submission[0].editorId
          }
        }
        
        // Fall back to any editor
        const editor = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "editor"))
          .limit(1)
        return editor[0]?.id || null

      case "associate-editor":
        if (submissionId) {
          // Get assigned associate editor for this submission
          const submission = await db
            .select({ editorId: articles.editorId })
            .from(articles)
            .where(eq(articles.id, submissionId))
            .limit(1)
          
          if (submission[0]?.editorId) {
            return submission[0].editorId
          }
        }
        
        // Fall back to any associate editor (use editor role for now)
        const associateEditor = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "editor"))
          .limit(1)
        return associateEditor[0]?.id || null

      case "editorial-assistant":
        const editorialAssistant = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "editorial-assistant"))
          .limit(1)
        return editorialAssistant[0]?.id || null

      case "reviewer":
        if (submissionId) {
          // Get assigned reviewers for this submission
          const submission = await db
            .select({ reviewerIds: articles.reviewerIds })
            .from(articles)
            .where(eq(articles.id, submissionId))
            .limit(1)
          
          if (submission[0]?.reviewerIds && Array.isArray(submission[0].reviewerIds) && submission[0].reviewerIds.length > 0) {
            return submission[0].reviewerIds[0] // Return first reviewer
          }
        }
        return null

      case "author":
        if (submissionId) {
          const submission = await db
            .select({ authorId: articles.authorId })
            .from(articles)
            .where(eq(articles.id, submissionId))
            .limit(1)
          return submission[0]?.authorId || null
        }
        return null

      default:
        return null
    }
  } catch (error) {
    logError(error as Error, { function: "resolveRecipient", recipientType, submissionId })
    return null
  }
}