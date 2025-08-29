import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviewInvitations, articles, users } from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch all review assignments for this reviewer
    const assignments = await db
      .select({
        id: reviewInvitations.id,
        articleId: reviewInvitations.articleId,
        status: reviewInvitations.status,
        createdAt: reviewInvitations.invitedAt,
        dueDate: reviewInvitations.reviewDeadline,
        articleTitle: articles.title,
        manuscriptNumber: articles.id, // Using article ID as manuscript identifier
        assignedDate: reviewInvitations.invitedAt,
        reviewStatus: reviewInvitations.status,
        completedAt: reviewInvitations.completedAt,
      })
      .from(reviewInvitations)
      .innerJoin(articles, eq(reviewInvitations.articleId, articles.id))
      .where(eq(reviewInvitations.reviewerId, userId))

    // Calculate statistics
    const totalAssigned = assignments.length
    
    const pendingAssignments = assignments.filter(a => 
      a.reviewStatus === "pending" || a.reviewStatus === "in_progress"
    )
    
    const completedAssignments = assignments.filter(a => 
      a.reviewStatus === "completed"
    )
    
    // Calculate overdue assignments
    const now = new Date()
    const overdueAssignments = assignments.filter(a => {
      if (a.reviewStatus === "completed") return false
      if (!a.dueDate) return false
      return new Date(a.dueDate) < now
    })

    // Transform assignments for frontend
    const transformedAssignments = assignments.map(assignment => ({
      ...assignment,
      assignedDate: assignment.createdAt,
      dueDate: assignment.dueDate || calculateDueDate(assignment.createdAt || new Date()),
    }))

    const stats = {
      totalAssigned,
      pending: pendingAssignments.length,
      completed: completedAssignments.length,
      overdue: overdueAssignments.length,
    }

    return NextResponse.json({
      success: true,
      assignments: transformedAssignments,
      stats,
    })

  } catch (error) {
    logger.error("Error fetching reviewer dashboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to calculate due date (21 days from assignment)
function calculateDueDate(assignedDate: Date | string): string {
  const assigned = new Date(assignedDate)
  const dueDate = new Date(assigned)
  dueDate.setDate(assigned.getDate() + 21) // 21 days review period
  return dueDate.toISOString()
}
