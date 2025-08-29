import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'

// PATCH /api/manuscripts/[manuscriptId]/comments/[commentId]/resolve - Mark comment as resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: manuscriptId, commentId } = params

    // Verify comment exists and user has permission to resolve it
    const { rows: commentRows } = await sql`
      SELECT c.id, c.user_id FROM manuscript_comments c
      JOIN submissions s ON c.manuscript_id = s.id
      LEFT JOIN submission_reviewers sr ON s.id = sr.submission_id
      WHERE c.id = ${commentId} 
      AND c.manuscript_id = ${manuscriptId}
      AND (
        c.user_id = ${session.user.id} OR
        s.author_id = ${session.user.id} OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = ${session.user.id} 
          AND role IN ('admin', 'editor', 'editor_in_chief', 'managing_editor')
        )
      )
    `

    if (commentRows.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found or insufficient permissions' 
      }, { status: 404 })
    }

    // Update comment status to resolved
    await sql`
      UPDATE manuscript_comments 
      SET status = 'resolved', updated_at = NOW()
      WHERE id = ${commentId}
    `

    // Create notification for comment author if resolver is different
    const comment = commentRows[0]
    if (comment.user_id !== session.user.id) {
      const { rows: resolverRows } = await sql`
        SELECT name FROM users WHERE id = ${session.user.id}
      `
      const resolverName = resolverRows[0]?.name

      await sql`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          created_at
        ) VALUES (
          ${comment.user_id},
          'comment_resolved',
          'Your comment has been resolved',
          ${`${resolverName} marked your comment as resolved`},
          ${JSON.stringify({ 
            manuscriptId, 
            commentId,
            resolverName 
          })},
          NOW()
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: 'Comment marked as resolved'
    })

  } catch (error) {
    logger.error('Error resolving comment:', error)
    return NextResponse.json({ 
      error: 'Failed to resolve comment' 
    }, { status: 500 })
  }
}

// DELETE /api/manuscripts/[manuscriptId]/comments/[commentId]/resolve - Unresolve comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: manuscriptId, commentId } = params

    // Verify comment exists and user has permission to unresolve it
    const { rows: commentRows } = await sql`
      SELECT c.id FROM manuscript_comments c
      JOIN submissions s ON c.manuscript_id = s.id
      WHERE c.id = ${commentId} 
      AND c.manuscript_id = ${manuscriptId}
      AND (
        c.user_id = ${session.user.id} OR
        s.author_id = ${session.user.id} OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = ${session.user.id} 
          AND role IN ('admin', 'editor', 'editor_in_chief', 'managing_editor')
        )
      )
    `

    if (commentRows.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found or insufficient permissions' 
      }, { status: 404 })
    }

    // Update comment status back to open
    await sql`
      UPDATE manuscript_comments 
      SET status = 'open', updated_at = NOW()
      WHERE id = ${commentId}
    `

    return NextResponse.json({
      success: true,
      message: 'Comment reopened'
    })

  } catch (error) {
    logger.error('Error unresolving comment:', error)
    return NextResponse.json({ 
      error: 'Failed to unresolve comment' 
    }, { status: 500 })
  }
}
