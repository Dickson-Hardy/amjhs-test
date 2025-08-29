import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { handleError } from '@/lib/modern-error-handler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all notifications as read for the user using Drizzle
    const result = await db.execute(sql`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE user_id = ${session.user.id} AND is_read = false
    `)

    // Get count of updated rows (depends on database driver response)
    const updatedCount = (result as unknown).affectedRows || (result as any).rowCount || 0

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updatedCount
    })

  } catch (error) {
    handleError(error, { 
      component: 'notifications-api', 
      action: 'mark_all_as_read'
    })
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
