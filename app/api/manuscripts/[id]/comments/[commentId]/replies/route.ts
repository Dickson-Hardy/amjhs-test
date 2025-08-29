import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { z } from 'zod'

const ReplySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
  mentions: z.array(z.string()).optional()
})

// POST /api/manuscripts/[manuscriptId]/comments/[commentId]/replies - Add reply to comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: manuscriptId, commentId } = params
    const body = await request.json()

    // Validate input
    const validatedData = ReplySchema.parse(body)

    // Verify comment exists and user has access
    const { rows: commentRows } = await sql`
      SELECT c.id FROM manuscript_comments c
      JOIN submissions s ON c.manuscript_id = s.id
      LEFT JOIN submission_reviewers sr ON s.id = sr.submission_id
      WHERE c.id = ${commentId} 
      AND c.manuscript_id = ${manuscriptId}
      AND (
        s.author_id = ${session.user.id} OR
        sr.reviewer_id = ${session.user.id} OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = ${session.user.id} 
          AND role IN ('admin', 'editor', 'editor_in_chief', 'managing_editor')
        )
      )
    `

    if (commentRows.length === 0) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 })
    }

    // Get user info
    const { rows: userRows } = await sql`
      SELECT name, avatar_url FROM users WHERE id = ${session.user.id}
    `
    const user = userRows[0]

    // Create reply
    const { rows: replyRows } = await sql`
      INSERT INTO comment_replies (
        comment_id,
        user_id,
        user_name,
        content,
        created_at
      ) VALUES (
        ${commentId},
        ${session.user.id},
        ${user.name},
        ${validatedData.content},
        NOW()
      )
      RETURNING *
    `

    const reply = {
      id: replyRows[0].id,
      userId: replyRows[0].user_id,
      userName: replyRows[0].user_name,
      userAvatar: user.avatar_url,
      content: replyRows[0].content,
      createdAt: replyRows[0].created_at
    }

    // Send notifications for mentions
    if (validatedData.mentions && validatedData.mentions.length > 0) {
      await sendReplyMentionNotifications(
        manuscriptId,
        commentId,
        validatedData.mentions,
        reply,
        session.user.id
      )
    }

    return NextResponse.json({
      success: true,
      reply
    })

  } catch (error) {
    logger.error('Error adding reply:', error)
    return NextResponse.json({ 
      error: error instanceof z.ZodError 
        ? 'Invalid input data' 
        : 'Failed to add reply' 
    }, { status: 500 })
  }
}

// Helper function to send mention notifications for replies
async function sendReplyMentionNotifications(
  manuscriptId: string,
  commentId: string,
  mentions: string[],
  reply: unknown,
  senderId: string
) {
  try {
    // Get mentioned users
    const { rows: mentionedUsers } = await sql`
      SELECT id, name, email FROM users 
      WHERE name = ANY(${mentions}) AND id != ${senderId}
    `

    // Create notifications
    for (const user of mentionedUsers) {
      await sql`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          created_at
        ) VALUES (
          ${user.id},
          'mention',
          'You were mentioned in a reply',
          ${`${reply.userName} mentioned you in a reply to a comment`},
          ${JSON.stringify({ 
            manuscriptId, 
            commentId,
            replyId: reply.id,
            senderName: reply.userName 
          })},
          NOW()
        )
      `
    }
  } catch (error) {
    logger.error('Error sending reply mention notifications:', error)
  }
}
