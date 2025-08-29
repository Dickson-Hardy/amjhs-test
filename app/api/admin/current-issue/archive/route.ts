import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { issues } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

// PUT - Archive current issue
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { issueId } = body

    if (!issueId) {
      return NextResponse.json({
        success: false,
        error: "Issue ID is required"
      }, { status: 400 })
    }

    // Archive the issue
    const [archivedIssue] = await db.update(issues)
      .set({ 
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(issues.id, issueId))
      .returning()

    if (!archivedIssue) {
      return NextResponse.json({
        success: false,
        error: "Issue not found"
      }, { status: 404 })
    }

    logInfo('Issue archived', { 
      issueId,
      volume: archivedIssue.volume,
      number: archivedIssue.number,
      archivedBy: session.user.id 
    })

    return NextResponse.json({
      success: true,
      issue: archivedIssue
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/current-issue/archive' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to archive issue" 
    }, { status: 500 })
  }
}
