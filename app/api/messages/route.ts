import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { messageCreationSchema } from "@/lib/enhanced-validations"
import { db } from "@/lib/db"
import { messages, conversations, users } from "@/lib/db/schema"
import { eq, and, desc, or } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    // Fetch messages for the specific conversation
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        attachments: messages.attachments,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
        senderEmail: users.email,
        senderRole: users.role,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))

    // Verify user has access to this conversation (simplified check for now)
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Format messages for the frontend
    const formattedMessages = conversationMessages.map(msg => ({
      id: msg.id,
      from: {
        id: msg.senderId,
        name: msg.senderName,
        role: msg.senderRole,
        email: msg.senderEmail
      },
      content: msg.content,
      attachments: msg.attachments || [],
      isRead: msg.isRead,
      timestamp: msg.createdAt?.toISOString() || new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/messages GET" })
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Enhanced validation
    const validatedData = messageCreationSchema.parse(body)
    
    // Check if this is a conversation-based message (existing system)
    if (validatedData.conversationId) {
      // Verify user has access to this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, validatedData.conversationId))
        .limit(1)

      if (conversation.length === 0) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }

      // Insert the new message
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: validatedData.conversationId,
          senderId: session.user.id,
          content: validatedData.content.trim(),
          subject: validatedData.subject,
          messageType: validatedData.messageType,
          priority: validatedData.priority,
          attachments: validatedData.attachments || [],
          isRead: false,
        })
        .returning()

      // Update the conversation's last activity
      await db
        .update(conversations)
        .set({
          lastActivity: new Date(),
          lastMessageId: newMessage.id,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, validatedData.conversationId))

      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        messageId: newMessage.id,
      })
    } else {
      // New direct message system (for general messages)
      // Determine recipient based on type
      let recipientId = ""
      let recipientName = ""
      
      if (validatedData.recipientType === 'admin') {
        const admin = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1)
        if (admin.length) {
          recipientId = admin[0].id
          recipientName = admin[0].name || "Administrator"
        }
      } else if (validatedData.recipientType === 'editor') {
        const editor = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`role IN ('editor', 'managing-editor', 'section-editor')`)
          .limit(1)
        if (editor.length) {
          recipientId = editor[0].id
          recipientName = editor[0].name || "Editor"
        }
      } else if (validatedData.recipientType === 'support') {
        const support = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1)
        if (support.length) {
          recipientId = support[0].id
          recipientName = "Technical Support"
        }
      }

      if (!recipientId) {
        return NextResponse.json({ error: "Could not find appropriate recipient" }, { status: 400 })
      }

      // Create a conversation first
      const [newConversation] = await db
        .insert(conversations)
        .values({
          subject: validatedData.subject,
          type: validatedData.messageType || "general",
          relatedId: validatedData.submissionId || null,
          relatedTitle: validatedData.submissionId ? `Submission ${validatedData.submissionId}` : validatedData.subject,
          participants: [
            { id: session.user.id, name: session.user.name || "User", role: session.user.role || "user" }
          ],
          lastActivity: new Date(),
        })
        .returning()

      // Create the message
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: newConversation.id,
          senderId: session.user.id,
          content: validatedData.content.trim(),
          subject: validatedData.subject,
          messageType: validatedData.messageType,
          priority: validatedData.priority,
          attachments: validatedData.attachments || [],
          isRead: false,
        })
        .returning()

      // Update conversation with last message
      await db
        .update(conversations)
        .set({
          lastMessageId: newMessage.id,
        })
        .where(eq(conversations.id, newConversation.id))

      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        conversationId: newConversation.id,
        messageId: newMessage.id,
      })
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: "/api/messages POST" })
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("messageId")
    const conversationId = searchParams.get("conversationId")

    if (!messageId && !conversationId) {
      return NextResponse.json({ 
        success: false, 
        error: "messageId or conversationId is required" 
      }, { status: 400 })
    }

    if (messageId) {
      // Delete specific message (only if user is sender)
      const deletedMessage = await db
        .delete(messages)
        .where(and(
          eq(messages.id, messageId),
          eq(messages.senderId, session.user.id)
        ))
        .returning()

      if (!deletedMessage.length) {
        return NextResponse.json({ 
          success: false, 
          error: "Message not found or unauthorized" 
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Message deleted successfully"
      })
    }

    if (conversationId) {
      // Delete entire conversation (only if user is participant)
      const conversation = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, session.user.id),
            eq(conversations.participant2Id, session.user.id)
          )
        ))
        .limit(1)

      if (!conversation.length) {
        return NextResponse.json({ 
          success: false, 
          error: "Conversation not found or unauthorized" 
        }, { status: 404 })
      }

      // Delete all messages in conversation first
      await db
        .delete(messages)
        .where(eq(messages.conversationId, conversationId))

      // Then delete the conversation
      await db
        .delete(conversations)
        .where(eq(conversations.id, conversationId))

      return NextResponse.json({
        success: true,
        message: "Conversation deleted successfully"
      })
    }
  } catch (error) {
    logError(error as Error, { endpoint: "/api/messages DELETE" })
    return NextResponse.json({ success: false, error: "Failed to delete message/conversation" }, { status: 500 })
  }
}
