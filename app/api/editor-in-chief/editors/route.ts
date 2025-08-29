import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, editorProfiles, articles } from "@/lib/db/schema"
import { sql, eq, inArray } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only editor-in-chief and admin can access this
    if (!session?.user || !["editor-in-chief", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all editors with their profiles and workload
    const editors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        affiliation: users.affiliation,
        isActive: users.isActive,
        editorType: editorProfiles.editorType,
        assignedSections: editorProfiles.assignedSections,
        currentWorkload: editorProfiles.currentWorkload,
        maxWorkload: editorProfiles.maxWorkload,
        isAcceptingSubmissions: editorProfiles.isAcceptingSubmissions,
        editorialExperience: editorProfiles.editorialExperience,
        startDate: editorProfiles.startDate,
      })
      .from(users)
      .leftJoin(editorProfiles, eq(users.id, editorProfiles.userId))
      .where(inArray(users.role, ['section-editor', 'managing-editor', 'editor-in-chief']))

    // Get performance metrics for each editor
    const editorPerformance = await Promise.all(
      editors.map(async (editor) => {
        // Get submissions handled by this editor in last 3 months
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const performance = await db
          .select({
            totalHandled: sql<number>`COUNT(*)`,
            onTimeDecisions: sql<number>`
              COUNT(CASE WHEN 
                EXTRACT(EPOCH FROM (updated_at - submitted_date)) / 86400 <= 30 
                AND status IN ('accepted', 'rejected', 'revision_requested')
              THEN 1 END)
            `,
            avgDecisionTime: sql<number>`
              AVG(EXTRACT(EPOCH FROM (updated_at - submitted_date)) / 86400)
              FILTER (WHERE status IN ('accepted', 'rejected', 'revision_requested'))
            `,
          })
          .from(articles)
          .where(
            sql`editor_id = ${editor.id} AND updated_at >= ${threeMonthsAgo}`
          )

        const perf = performance[0] || { totalHandled: 0, onTimeDecisions: 0, avgDecisionTime: 0 }
        const performanceScore = perf.totalHandled > 0 
          ? Math.round((perf.onTimeDecisions / perf.totalHandled) * 100)
          : 100 // New editors get 100% until they have data

        return {
          ...editor,
          performance: {
            score: performanceScore,
            totalHandled: perf.totalHandled,
            onTimeDecisions: perf.onTimeDecisions,
            avgDecisionTime: Math.round(perf.avgDecisionTime || 0),
          }
        }
      })
    )

    // Format for frontend
    const formattedEditors = editorPerformance.map((editor) => ({
      id: editor.id,
      name: editor.name,
      email: editor.email,
      role: editor.role,
      section: editor.assignedSections?.length > 0 
        ? editor.assignedSections.join(', ') 
        : 'General',
      workload: editor.currentWorkload || 0,
      maxWorkload: editor.maxWorkload || 10,
      performance: editor.performance.score,
      isActive: editor.isActive,
      isAcceptingSubmissions: editor.isAcceptingSubmissions,
      editorType: editor.editorType,
      affiliation: editor.affiliation,
      startDate: editor.startDate?.toISOString(),
      avgDecisionTime: editor.performance.avgDecisionTime,
      totalHandled: editor.performance.totalHandled,
    }))

    // Get editor statistics
    const editorStats = {
      totalEditors: formattedEditors.length,
      activeEditors: formattedEditors.filter(e => e.isActive).length,
      overloadedEditors: formattedEditors.filter(e => e.workload > e.maxWorkload).length,
      avgPerformance: formattedEditors.length > 0 
        ? Math.round(formattedEditors.reduce((sum, e) => sum + e.performance, 0) / formattedEditors.length)
        : 0,
    }

    return NextResponse.json({
      success: true,
      editors: formattedEditors,
      stats: editorStats,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/editor-in-chief/editors` })
    return NextResponse.json({ success: false, error: "Failed to fetch editors" }, { status: 500 })
  }
}
