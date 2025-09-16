import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, reviewerProfiles, userApplications } from "@/lib/db/schema"
import { eq, count, sql, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    // Get all reviewers with their profiles
    const reviewers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastActiveAt,
        affiliation: users.affiliation,
        expertise: users.expertise,
        maxLoad: reviewerProfiles.maxReviewsPerMonth,
        currentLoad: reviewerProfiles.currentReviewLoad,
        averageRating: reviewerProfiles.qualityScore,
        completedReviews: reviewerProfiles.completedReviews,
        onTimeRate: reviewerProfiles.averageReviewTime
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(users.id, reviewerProfiles.userId))
      .where(eq(users.role, "reviewer"))
      .orderBy(desc(users.createdAt))

    // Calculate stats
    const totalReviewers = reviewers.length
    const activeReviewers = reviewers.filter(r => r.isActive === true).length
    const pendingInvitations = await db
      .select({ count: count() })
      .from(userApplications)
      .where(sql`${userApplications.requestedRole} = 'reviewer' AND ${userApplications.status} = 'pending'`)

    const averageResponseTime = reviewers.reduce((sum, r) => sum + (r.onTimeRate || 0), 0) / reviewers.length || 0
    const overallRating = reviewers.reduce((sum, r) => sum + (r.averageRating || 0), 0) / reviewers.length || 0
    const onTimePercentage = reviewers.filter(r => r.onTimeRate && r.onTimeRate <= 14).length / reviewers.length * 100 || 0

    return NextResponse.json({
      reviewers: reviewers.map(reviewer => ({
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        affiliation: reviewer.affiliation || "Not specified",
        expertise: reviewer.expertise || [],
        status: reviewer.isActive ? 'active' : 'inactive',
        currentLoad: reviewer.currentLoad || 0,
        maxLoad: reviewer.maxLoad || 5,
        averageRating: (reviewer.averageRating || 0) / 20, // Convert 0-100 quality score to 0-5 rating
        completedReviews: reviewer.completedReviews || 0,
        onTimeRate: reviewer.onTimeRate ? (reviewer.onTimeRate <= 14 ? 100 : 0) : 0, // Convert review time to percentage
        lastActive: reviewer.lastLoginAt ? reviewer.lastLoginAt.toISOString().split('T')[0] : 'Never',
        joinDate: reviewer.createdAt ? reviewer.createdAt.toISOString().split('T')[0] : 'Unknown'
      })),
      stats: {
        totalReviewers,
        activeReviewers,
        pendingInvitations: pendingInvitations[0].count,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        overallRating: Math.round(overallRating * 10) / 10,
        onTimePercentage: Math.round(onTimePercentage)
      }
    })

  } catch (error) {
    console.error("Error fetching reviewers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
