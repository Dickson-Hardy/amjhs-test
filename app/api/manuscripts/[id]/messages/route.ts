import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages, users, articles } from "@/lib/db/schema"
import { eq, and, or, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user has access to this manuscript
    const manuscript = await db
      .select()
      .from(articles)
      .where(eq(articles.id, manuscriptId))
      .limit(1)

    if (!manuscript.length) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 })
    }

    const manuscriptData = manuscript[0]
    
    // Check if user is author, editor, or admin
    const isAuthor = manuscriptData.authorId === session.user.id
    const isEditor = manuscriptData.editorId === session.user.id
    const isAdmin = session.user.role === "admin"
    const isEditorRole = ["section-editor", "managing-editor", "editor-in-chief"].includes(session.user.role || "")

    if (!isAuthor && !isEditor && !isAdmin && !isEditorRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch conversations related to this manuscript
    const manuscriptConversations = await db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        lastActivity: conversations.lastActivity,
        createdAt: conversations.createdAt,
        participants: conversations.participants,
      })
      .from(conversations)
      .where(eq(conversations.relatedId, manuscriptId))
      .orderBy(desc(conversations.lastActivity))

    // Get messages for each conversation
    const allMessages = []
    for (const conversation of manuscriptConversations) {
      const conversationMessages = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
          isRead: messages.isRead,
          attachments: messages.attachments,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt))

      // Add conversation metadata to messages
      for (const message of conversationMessages) {
        // Get sender info (handle null senderId)
        let senderName = "System"
        let senderRole = "system"
        if (message.senderId) {
          const sender = await db
            .select({ name: users.name, role: users.role })
            .from(users)
            .where(eq(users.id, message.senderId))
            .limit(1)
          senderName = sender[0]?.name || "Unknown"
          senderRole = sender[0]?.role || "user"
        }

        allMessages.push({
          ...message,
          subject: conversation.subject,
          senderName: senderName,
          senderRole: senderRole,
          threadId: conversation.id,
          submissionId: manuscriptId,
        })
      }
    }

    return NextResponse.json({
      success: true,
      messages: allMessages,
    })

  } catch (error) {
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/messages` })
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientType, subject, content, parentMessageId } = body

    if (!subject.trim() || !content.trim()) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    // Verify user has access to this manuscript
    const manuscript = await db
      .select()
      .from(articles)
      .where(eq(articles.id, manuscriptId))
      .limit(1)

    if (!manuscript.length) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 })
    }

    const manuscriptData = manuscript[0]

    // Determine recipient based on type
    let recipientId = ""
    let recipientName = ""
    
    if (recipientType === 'editor' && manuscriptData.editorId) {
      recipientId = manuscriptData.editorId
      const editor = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, manuscriptData.editorId))
        .limit(1)
      recipientName = editor[0]?.name || "Editor"
    } else if (recipientType === 'admin') {
      // Find an admin user
      const admin = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1)
      if (admin.length) {
        recipientId = admin[0].id
        recipientName = admin[0].name || "Administrator"
      }
    } else {
      // Default to author if current user is not author
      if (session.user.id !== manuscriptData.authorId && manuscriptData.authorId) {
        recipientId = manuscriptData.authorId
        const author = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, manuscriptData.authorId))
          .limit(1)
        recipientName = author[0]?.name || "Author"
      }
    }

    if (!recipientId) {
      return NextResponse.json({ error: "Could not determine message recipient" }, { status: 400 })
    }

    // Get recipient info for conversation
    const recipient = await db
      .select({ name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1)

    // Find or create conversation
    let conversationId = ""
    const existingConversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.relatedId, manuscriptId))
      .limit(1)

    if (existingConversation.length) {
      conversationId = existingConversation[0].id
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(conversations)
        .values({
          subject: subject,
          type: "manuscript",
          relatedId: manuscriptId,
          participants: [
            { id: session.user.id, name: session.user.name || "User", role: session.user.role || "author" },
            { id: recipientId, name: recipient[0]?.name || "Unknown", role: recipient[0]?.role || "user" }
          ],
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
        content,
        isRead: false,
      })
      .returning()

    // Update conversation last activity
    await db
      .update(conversations)
      .set({ lastActivity: new Date() })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({
      success: true,
      message: {
        ...newMessage[0],
        subject,
        senderName: session.user.name || "User",
        senderRole: session.user.role || "author",
        threadId: conversationId,
        submissionId: manuscriptId,
      },
    })

  } catch (error) {
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/messages` })
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}
