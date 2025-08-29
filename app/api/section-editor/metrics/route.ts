import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users } from "@/lib/db/schema"
import { eq, and, count, avg, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has section editor role or higher
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get user's section from their profile
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    const userSection = user[0]?.specializations?.[0] || "General"

    // Calculate section metrics
    const [
      totalSubmissionsResult,
      myAssignmentsResult,
      pendingDecisionsResult,
      acceptedArticlesResult,
      averageReviewTimeResult
    ] = await Promise.all([
      // Total submissions in this section
      db.select({ count: count() })
        .from(articles)
        .where(eq(articles.category, userSection)),
      
      // My assignments (articles assigned to this editor)
      db.select({ count: count() })
        .from(articles)
        .where(and(
          eq(articles.editor_id, session.user.id),
          eq(articles.category, userSection)
        )),
      
      // Pending decisions (articles needing editorial decision)
      db.select({ count: count() })
        .from(articles)
        .where(and(
          eq(articles.editor_id, session.user.id),
          eq(articles.status, "reviewer_decision_received")
        )),
      
      // Accepted articles for acceptance rate calculation
      db.select({ count: count() })
        .from(articles)
        .where(and(
          eq(articles.category, userSection),
          eq(articles.status, "accepted")
        )),
      
      // Average review time (placeholder calculation)
      db.select({ avg: avg(articles.views) })
        .from(articles)
        .where(eq(articles.category, userSection))
    ])

    const totalSubmissions = totalSubmissionsResult[0]?.count || 0
    const myAssignments = myAssignmentsResult[0]?.count || 0
    const pendingDecisions = pendingDecisionsResult[0]?.count || 0
    const acceptedArticles = acceptedArticlesResult[0]?.count || 0
    
    const acceptanceRate = totalSubmissions > 0 ? (acceptedArticles / totalSubmissions) * 100 : 0
    const averageReviewTime = 28 // Placeholder - would need to calculate from actual review data
    const sectionRanking = 3 // Placeholder - would need to calculate based on section performance

    const metrics = {
      totalSubmissions,
      myAssignments,
      pendingDecisions,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      averageReviewTime,
      sectionRanking
    }

    return NextResponse.json(metrics)

  } catch (error) {
    logger.error("Error fetching section editor metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
