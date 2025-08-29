import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages, emailLogs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, content, recipients, templateType } = await request.json()

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Subject, content, and recipients are required" }, { status: 400 })
    }

    // Create or find conversation for this submission
    let conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.relatedId, submissionId))
      .limit(1)

    let conversationId: string

    if (conversation.length === 0) {
      // Create new conversation
      const newConversation = await db.insert(conversations).values({
        subject: subject,
        type: 'editorial',
        relatedId: submissionId,
        relatedTitle: `Submission ${submissionId}`,
        participants: [
          { id: session.user.id, name: session.user.name || 'Admin', role: 'admin' },
          ...recipients.map((email: string) => ({ id: email, name: email, role: 'author' }))
        ],
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: conversations.id })

      conversationId = newConversation[0].id
    } else {
      conversationId = conversation[0].id
      
      // Update last activity
      await db
        .update(conversations)
        .set({ 
          lastActivity: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId))
    }

    // Add message to conversation
    const newMessage = await db.insert(messages).values({
      conversationId: conversationId,
      senderId: session.user.id,
      content: content,
      attachments: [],
      isRead: false,
      readBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: messages.id })

    // Log email for tracking
    try {
      await db.insert(emailLogs).values({
        submissionId: submissionId,
        toEmail: recipients[0], // Primary recipient
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'editorial@amhsj.org',
        subject: subject,
        body: content,
        emailType: templateType || 'admin_communication',
        status: 'pending',
        sentAt: new Date(),
        createdAt: new Date()
      })
    } catch (logError) {
      logger.error("Failed to log email:", logError)
    }

    // Integrate with hybrid email service
    const emailSent = await sendEmail({
      to: recipients,
      subject: subject,
      content: content,
      from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'editorial@amhsj.org',
      replyTo: process.env.REPLY_TO_EMAIL || 'editorial@amhsj.org'
    })

    if (!emailSent.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to send email",
        details: emailSent.error
      }, { status: 500 })
    }

    // Update email log status
    try {
      await db
        .update(emailLogs)
        .set({ 
          status: 'sent',
          updatedAt: new Date()
        })
        .where(eq(emailLogs.submissionId, submissionId))
    } catch (updateError) {
      logger.error("Failed to update email log:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      conversationId: conversationId,
      messageId: newMessage[0].id,
      emailSent: true
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    logError(error as Error, { endpoint: `/api/admin/submissions/${submissionId}/email` })
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}

// Email sending function - integrated with hybrid email service
async function sendEmail({ to, subject, content, from, replyTo }: {
  to: string[]
  subject: string
  content: string
  from: string
  replyTo: string
}) {
  try {
    // Import hybrid email service
    const { sendEmail: hybridSendEmail } = await import('@/lib/email-improved')
    
    // Create professional HTML template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0;">AMHSJ - Advances in Medicine & Health Sciences Journal</h1>
        </div>
        <div style="padding: 30px 20px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${content}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; margin-top: 30px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            This email was sent from the AMHSJ Editorial Management System.<br>
            Please do not reply to this email. For assistance, contact: ${replyTo}
          </p>
        </div>
      </div>
    `
    
    // Send to all recipients using hybrid email service
    const results = await Promise.allSettled(
      to.map(email => 
        hybridSendEmail({
          to: email,
          subject: subject,
          html: html,
          text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        })
      )
    )
    
    // Check if any emails failed
    const failures = results.filter(result => result.status === 'rejected')
    
    if (failures.length > 0) {
      logger.error(`Failed to send ${failures.length}/${to.length} emails`)
      return { 
        success: false, 
        error: `Failed to send ${failures.length}/${to.length} emails`,
        details: failures.map(f => f.status === 'rejected' ? f.reason : null)
      }
    }
    
    return { success: true, messageId: `hybrid-${Date.now()}` }
  } catch (error) {
    logger.error("Email sending failed:", error)
    return { success: false, error: isAppError(error) ? error.message : (isAppError(error) ? error.message : (error instanceof Error ? error.message : String(error))) }
  }
}
