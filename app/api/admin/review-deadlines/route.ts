import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { reviewDeadlineManager } from "@/lib/review-deadline-manager"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin permissions
    if (!["admin", "editor"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const results = await reviewDeadlineManager.processDeadlines()

    return NextResponse.json({
      success: true,
      message: "Deadline processing completed",
      data: {
        remindersProcessed: results.remindersProcessed,
        withdrawalsProcessed: results.withdrawalsProcessed,
        errors: results.errors,
        processedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error("Error processing review deadlines:", error)
    
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "Failed to process review deadlines"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin permissions
    if (!["admin", "editor"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get statistics about pending deadlines
    const stats = await getDeadlineStatistics()

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error("Error getting deadline statistics:", error)
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

async function getDeadlineStatistics() {
  const { db } = await import("@/lib/db")
  const { reviewInvitations } = await import("@/lib/db/schema")
  const { eq, and, lt, isNull, not } = await import("drizzle-orm")

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000))

  // Count pending invitations needing reminders
  const pendingReminders = await db
    .select({ count: reviewInvitations.id })
    .from(reviewInvitations)
    .where(
      and(
        eq(reviewInvitations.status, 'pending'),
        lt(reviewInvitations.invitedAt, sevenDaysAgo),
        isNull(reviewInvitations.firstReminderSent)
      )
    )

  // Count pending invitations needing withdrawal
  const pendingWithdrawals = await db
    .select({ count: reviewInvitations.id })
    .from(reviewInvitations)
    .where(
      and(
        eq(reviewInvitations.status, 'pending'),
        lt(reviewInvitations.invitedAt, fourteenDaysAgo),
        not(isNull(reviewInvitations.firstReminderSent))
      )
    )

  // Count total pending invitations
  const totalPending = await db
    .select({ count: reviewInvitations.id })
    .from(reviewInvitations)
    .where(eq(reviewInvitations.status, 'pending'))

  return {
    pendingReminders: pendingReminders.length,
    pendingWithdrawals: pendingWithdrawals.length,
    totalPending: totalPending.length,
    lastCheck: now.toISOString()
  }
}
