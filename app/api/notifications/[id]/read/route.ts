import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { handleError } from '@/lib/modern-error-handler'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationId = params.id

    // Mark notification as read
    const { rowCount } = await sql`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE id = ${notificationId} AND user_id = ${session.user.id}
    `

    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    handleError(error, { 
      component: 'notifications-api', 
      action: 'mark_as_read',
      metadata: { notificationId: params.id }
    })
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
