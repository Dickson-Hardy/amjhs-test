import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { workflowTimeLimits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    const userRole = session.user.role
    if (!["admin", "managing-editor", "editor-in-chief"].includes(userRole || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const timeLimits = await db.select().from(workflowTimeLimits).orderBy(workflowTimeLimits.stage)

    return NextResponse.json({
      success: true,
      timeLimits
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/time-limits`, method: 'GET' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch time limits" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    const userRole = session.user.role
    if (!["admin", "managing-editor", "editor-in-chief"].includes(userRole || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { timeLimits } = await request.json()

    if (!Array.isArray(timeLimits)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid time limits data" 
      }, { status: 400 })
    }

    const results = []

    for (const timeLimit of timeLimits) {
      const { stage, timeLimitDays, reminderDays, escalationDays, isActive } = timeLimit

      if (!stage || typeof timeLimitDays !== 'number' || !Array.isArray(reminderDays) || !Array.isArray(escalationDays)) {
        results.push({ stage, success: false, error: "Invalid data format" })
        continue
      }

      try {
        // Check if time limit already exists
        const existing = await db
          .select()
          .from(workflowTimeLimits)
          .where(eq(workflowTimeLimits.stage, stage))
          .limit(1)

        if (existing.length > 0) {
          // Update existing
          await db
            .update(workflowTimeLimits)
            .set({
              timeLimitDays,
              reminderDays,
              escalationDays,
              isActive,
              updatedAt: new Date()
            })
            .where(eq(workflowTimeLimits.stage, stage))

          results.push({ stage, success: true, action: "updated" })
        } else {
          // Insert new
          await db.insert(workflowTimeLimits).values({
            stage,
            timeLimitDays,
            reminderDays,
            escalationDays,
            isActive,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          results.push({ stage, success: true, action: "created" })
        }
      } catch (dbError) {
        logError(dbError as Error, { 
          endpoint: `/api/admin/time-limits`, 
          method: 'POST',
          stage 
        })
        results.push({ stage, success: false, error: "Database operation failed" })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      success: successCount === totalCount,
      message: `Successfully processed ${successCount}/${totalCount} time limits`,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/time-limits`, method: 'POST' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save time limits" 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    const userRole = session.user.role
    if (!["admin", "managing-editor", "editor-in-chief"].includes(userRole || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { stage, updates } = await request.json()

    if (!stage || !updates) {
      return NextResponse.json({ 
        success: false, 
        error: "Stage and updates are required" 
      }, { status: 400 })
    }

    const allowedUpdates = ['timeLimitDays', 'reminderDays', 'escalationDays', 'isActive']
    const validUpdates: unknown = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = value
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid updates provided" 
      }, { status: 400 })
    }

    validUpdates.updatedAt = new Date()

    await db
      .update(workflowTimeLimits)
      .set(validUpdates)
      .where(eq(workflowTimeLimits.stage, stage))

    return NextResponse.json({
      success: true,
      message: `Time limit for stage '${stage}' updated successfully`,
      stage,
      updates: validUpdates
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/time-limits`, method: 'PUT' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update time limit" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    const userRole = session.user.role
    if (!["admin"].includes(userRole || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')

    if (!stage) {
      return NextResponse.json({ 
        success: false, 
        error: "Stage parameter is required" 
      }, { status: 400 })
    }

    await db
      .delete(workflowTimeLimits)
      .where(eq(workflowTimeLimits.stage, stage))

    return NextResponse.json({
      success: true,
      message: `Time limit for stage '${stage}' deleted successfully`,
      stage
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/time-limits`, method: 'DELETE' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete time limit" 
    }, { status: 500 })
  }
}
