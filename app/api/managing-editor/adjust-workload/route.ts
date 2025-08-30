import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, adminLogs, editorProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'managing-editor', 'editor-in-chief'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { editorId, newCapacity } = await request.json()

    if (!editorId || typeof newCapacity !== 'number' || newCapacity < 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Update editor workload capacity in editor_profiles table
    const [updatedProfile] = await db
      .update(editorProfiles)
      .set({ 
        maxWorkload: newCapacity,
        updatedAt: new Date()
      })
      .where(eq(editorProfiles.userId, editorId))
      .returning()

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Editor profile not found' }, { status: 404 })
    }

    // Log the action for audit trail
    await db.insert(adminLogs).values({
      adminId: session.user.id,
      action: 'Workload Adjustment',
      resourceType: 'editor_profile',
      resourceId: updatedProfile.id,
      details: `Adjusted workload capacity for editor ${editorId} to ${newCapacity}`,
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: `Workload capacity updated to ${newCapacity} for editor ${editorId}`,
      profile: {
        id: updatedProfile.id,
        maxWorkload: updatedProfile.maxWorkload,
        currentWorkload: updatedProfile.currentWorkload
      }
    })
  } catch (error) {
    console.error('Error adjusting workload:', error)
    return NextResponse.json(
      { error: 'Failed to adjust workload' },
      { status: 500 }
    )
  }
}
