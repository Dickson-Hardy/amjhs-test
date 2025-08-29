import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from '@/lib/db'
import { adminLogs, tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, action } = await request.json()

    // Update the task status based on the action
    let newStatus = 'pending'
    let completedAt = null
    
    switch (action) {
      case 'complete':
        newStatus = 'completed'
        completedAt = new Date()
        break
      case 'start':
        newStatus = 'in_progress'
        break
      case 'cancel':
        newStatus = 'cancelled'
        break
      case 'reopen':
        newStatus = 'pending'
        break
      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }, { status: 400 })
    }

    // Update the task in the database
    await db
      .update(tasks)
      .set({ 
        status: newStatus,
        completedAt,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))

    // Log the task action with correct schema
    await db.insert(adminLogs).values({
      id: uuidv4(),
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: `Task Action: ${action}`,
      resourceType: 'task',
      resourceId: taskId,
      details: `Performed action ${action} on task ${taskId}`,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Task action ${action} completed for task ${taskId}`,
      newStatus
    })
  } catch (error) {
    console.error('Error handling task action:', error)
    return NextResponse.json(
      { error: 'Failed to perform task action' },
      { status: 500 }
    )
  }
}
