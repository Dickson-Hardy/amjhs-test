import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { z } from 'zod'
import { logError } from '@/lib/logger'

// Validation schemas
const CommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  position: z.object({
    start: z.number(),
    end: z.number(),
    text: z.string()
  }),
  userRole: z.enum(['admin', 'editor', 'reviewer', 'author']),
  mentions: z.array(z.string()).optional()
})

const ReplySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
  mentions: z.array(z.string()).optional()
})

// GET /api/manuscripts/[id]/comments - Get all comments for a manuscript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params)
    const manuscriptId = params.id

    // Verify user has access to this manuscript
    const { rows: accessRows } = await sql`
      SELECT 1 FROM submissions s
      LEFT JOIN submission_reviewers sr ON s.id = sr.submission_id
      LEFT JOIN users u ON u.id = s.author_id OR u.id = sr.reviewer_id
      WHERE s.id = ${manuscriptId} 
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

    if (accessRows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get comments with replies
    const { rows: commentRows } = await sql`
      SELECT 
        c.id,
        c.manuscript_id,
        c.user_id,
        c.user_name,
        c.user_role,
        c.content,
        c.position,
        c.status,
        c.created_at,
        c.updated_at,
        c.mentions,
        u.avatar_url as user_avatar
      FROM manuscript_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.manuscript_id = ${manuscriptId}
      AND c.status != 'deleted'
      ORDER BY c.created_at ASC
    `

    const comments = []

    for (const comment of commentRows) {
      // Get replies for each comment
      const { rows: replyRows } = await sql`
        SELECT 
          r.id,
          r.user_id,
          r.user_name,
          r.content,
          r.created_at,
          u.avatar_url as user_avatar
        FROM comment_replies r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.comment_id = ${comment.id}
        ORDER BY r.created_at ASC
      `

      const replies = replyRows.map(reply => ({
        id: reply.id,
        userId: reply.user_id,
        userName: reply.user_name,
        userAvatar: reply.user_avatar,
        content: reply.content,
        createdAt: reply.created_at
      }))

      comments.push({
        id: comment.id,
        manuscriptId: comment.manuscript_id,
        userId: comment.user_id,
        userName: comment.user_name,
        userRole: comment.user_role,
        userAvatar: comment.user_avatar,
        content: comment.content,
        position: JSON.parse(comment.position),
        status: comment.status,
        replies,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        mentions: JSON.parse(comment.mentions || '[]')
      })
    }

    return NextResponse.json({
      success: true,
      comments
    })

  } catch (error) {
    logError(error as Error, {
      context: 'GET /api/manuscripts/[id]/comments',
      manuscriptId
    })
    return NextResponse.json({ 
      error: 'Failed to fetch comments' 
    }, { status: 500 })
  }
}

// POST /api/manuscripts/[id]/comments - Add a new comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params)
    const manuscriptId = params.id
    const body = await request.json()

    // Validate input
    const validatedData = CommentSchema.parse(body)

    // Verify user has access to comment on this manuscript
    const { rows: accessRows } = await sql`
      SELECT 1 FROM submissions s
      LEFT JOIN submission_reviewers sr ON s.id = sr.submission_id
      WHERE s.id = ${manuscriptId} 
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

    if (accessRows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get user info
    const { rows: userRows } = await sql`
      SELECT name, avatar_url FROM users WHERE id = ${session.user.id}
    `
    const user = userRows[0]

    // Create comment
    const { rows: commentRows } = await sql`
      INSERT INTO manuscript_comments (
        manuscript_id,
        user_id,
        user_name,
        user_role,
        content,
        position,
        status,
        mentions,
        created_at,
        updated_at
      ) VALUES (
        ${manuscriptId},
        ${session.user.id},
        ${user.name},
        ${validatedData.userRole},
        ${validatedData.content},
        ${JSON.stringify(validatedData.position)},
        'open',
        ${JSON.stringify(validatedData.mentions || [])},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const comment = {
      id: commentRows[0].id,
      manuscriptId: commentRows[0].manuscript_id,
      userId: commentRows[0].user_id,
      userName: commentRows[0].user_name,
      userRole: commentRows[0].user_role,
      userAvatar: user.avatar_url,
      content: commentRows[0].content,
      position: JSON.parse(commentRows[0].position),
      status: commentRows[0].status,
      replies: [],
      createdAt: commentRows[0].created_at,
      updatedAt: commentRows[0].updated_at,
      mentions: JSON.parse(commentRows[0].mentions || '[]')
    }

    // Send notifications for mentions
    if (validatedData.mentions && validatedData.mentions.length > 0) {
      await sendMentionNotifications(
        manuscriptId, 
        validatedData.mentions, 
        comment,
        session.user.id
      )
    }

    return NextResponse.json({
      success: true,
      comment
    })

  } catch (error) {
    logError(error as Error, {
      context: 'POST /api/manuscripts/[id]/comments',
      manuscriptId: params.id
    })
    return NextResponse.json({ 
      error: error instanceof z.ZodError 
        ? 'Invalid input data' 
        : 'Failed to add comment' 
    }, { status: 500 })
  }
}

// Helper function to send mention notifications
async function sendMentionNotifications(
  manuscriptId: string,
  mentions: string[],
  comment: unknown,
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
          'You were mentioned in a comment',
          ${`${comment.userName} mentioned you in a comment on manuscript ${manuscriptId}`},
          ${JSON.stringify({ 
            manuscriptId, 
            commentId: comment.id,
            senderName: comment.userName 
          })},
          NOW()
        )
      `
    }
  } catch (error) {
    logError(error as Error, {
      context: 'sendMentionNotifications',
      manuscriptId,
      mentions
    })
  }
}
