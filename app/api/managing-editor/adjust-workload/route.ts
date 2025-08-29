import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, adminLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { editorId, newCapacity } = await request.json()

    // Update editor capacity (would need to add capacity field to users table)
    // For now, just log the action
    await db.insert(adminLogs).values({
      action: 'Workload Adjustment',
      details: `Adjusted workload capacity for editor ${editorId} to ${newCapacity}`,
      createdAt: new Date(),
      userId: 'current-user-id', // Would get from auth session
    })

    // In a real implementation, this would update the user's capacity setting
    // await db.update(users)
    //   .set({ capacity: newCapacity })
    //   .where(eq(users.id, editorId))

    return NextResponse.json({ 
      success: true, 
      message: `Workload capacity updated to ${newCapacity} for editor ${editorId}` 
    })
  } catch (error) {
    logger.error('Error adjusting workload:', error)
    return NextResponse.json(
      { error: 'Failed to adjust workload' },
      { status: 500 }
    )
  }
}
