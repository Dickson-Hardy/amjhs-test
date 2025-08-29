import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, inArray, gte, lte, sql, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get total pending manuscripts
    const pendingStatuses = ["submitted", "editorial_assistant_review"]
    const totalPending = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(inArray(submissions.status, pendingStatuses))

    // Get manuscripts screened today
    const screenedToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(
        and(
          eq(submissions.status, "associate_editor_assignment"),
          gte(submissions.updatedAt, today)
        )
      )

    // Get overdue manuscripts (submitted more than 7 days ago)
    const overdueCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(
        and(
          inArray(submissions.status, pendingStatuses),
          lte(submissions.createdAt, oneWeekAgo)
        )
      )

    // Calculate average screening time (for manuscripts completed in last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const completedManuscripts = await db
      .select({
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.status, "associate_editor_assignment"),
          gte(submissions.updatedAt, thirtyDaysAgo)
        )
      )

    let totalScreeningTime = 0
    let validManuscripts = 0

    completedManuscripts.forEach(manuscript => {
      if (manuscript.createdAt && manuscript.updatedAt) {
        const screeningTime = manuscript.updatedAt.getTime() - manuscript.createdAt.getTime()
        const screeningHours = screeningTime / (1000 * 60 * 60)
        if (screeningHours > 0 && screeningHours < 168) { // Between 0 and 1 week
          totalScreeningTime += screeningHours
          validManuscripts++
        }
      }
    })

    const averageScreeningTime = validManuscripts > 0 ? Math.round(totalScreeningTime / validManuscripts) : 0

    const stats = {
      totalPending: totalPending[0]?.count || 0,
      screenedToday: screenedToday[0]?.count || 0,
      averageScreeningTime: averageScreeningTime,
      overdueCount: overdueCount[0]?.count || 0
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/stats", action: "fetchStats" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
