import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversations, users, articles, submissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { z } from "zod"

const messageSchema = z.object({
  submissionId: z.string().uuid(),
  subject: z.string().min(1).max(255),
  content: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  messageType: z.enum(["editorial", "system", "general"]).default("editorial")
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user has editorial assistant permissions
    if (!["editorial-assistant", "admin", "managing-editor", "editor-in-chief"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = messageSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { submissionId, subject, content, priority, messageType } = validation.data

    // Get submission and author information
    const submission = await db
      .select({
        id: submissions.id,
        articleId: submissions.articleId,
        authorId: submissions.authorId,
        status: submissions.status
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission.length) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const submissionData = submission[0]
    
    if (!submissionData.authorId) {
      return NextResponse.json({ error: "Author not found for this submission" }, { status: 404 })
    }

    // Get author and article details
    const author = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, submissionData.authorId))
      .limit(1)

    if (!author.length) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }

    let articleTitle = "Unknown Article"
    if (submissionData.articleId) {
      const article = await db
        .select({ title: articles.title })
        .from(articles)
        .where(eq(articles.id, submissionData.articleId))
        .limit(1)
      
      if (article.length) {
        articleTitle = article[0].title
      }
    }

    // Find or create conversation for this submission
    let conversationId = ""
    const existingConversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.relatedId, submissionId))
      .limit(1)

    if (existingConversation.length) {
      conversationId = existingConversation[0].id
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(conversations)
        .values({
          subject: `Editorial Communication: ${articleTitle}`,
          type: "submission",
          relatedId: submissionId,
          relatedTitle: articleTitle,
          participants: [
            { id: session.user.id, name: session.user.name || "Editorial Assistant", role: session.user.role || "editorial-assistant" },
            { id: author[0].id, name: author[0].name || "Author", role: "author" }
          ],
          lastActivity: new Date()
        })
        .returning({ id: conversations.id })
      
      conversationId = newConversation[0].id
    }

    // Create the message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId: conversationId,
        senderId: session.user.id,
        recipientId: submissionData.authorId,
        subject: subject,
        content: content,
        messageType: messageType,
        priority: priority,
        status: "unread",
        submissionId: submissionId,
        isRead: false,
        createdAt: new Date()
      })
      .returning()

    // Update conversation last activity
    await db
      .update(conversations)
      .set({ 
        lastActivity: new Date(),
        lastMessageId: newMessage[0].id
      })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      messageId: newMessage[0].id,
      conversationId: conversationId
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/message", action: "sendMessage" })
    return NextResponse.json({ 
      error: "Failed to send message" 
    }, { status: 500 })
  }
}