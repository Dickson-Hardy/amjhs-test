import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, review_assignments, reviewerProfiles } from "@/lib/db/schema"
import { eq, count, sql, avg, and, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor permissions
    if (!["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const availability = searchParams.get("availability")

    // Fetch reviewers with their statistics
    const reviewersQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        affiliation: users.affiliation,
        expertise: users.expertise,
        orcid: users.orcid,
        // Calculate current load from active review assignments
        currentLoad: sql<number>`COALESCE((
          SELECT COUNT(*)::int 
          FROM ${review_assignments} 
          WHERE ${review_assignments.reviewerId} = ${users.id} 
          AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
        ), 0)`.as('currentLoad'),
        // Get reviewer profile data with defaults
        maxLoad: sql<number>`COALESCE((
          SELECT ${reviewerProfiles.maxReviewsPerMonth}
          FROM ${reviewerProfiles}
          WHERE ${reviewerProfiles.userId} = ${users.id}
        ), 3)`.as('maxLoad'),
        completedReviews: sql<number>`COALESCE((
          SELECT COUNT(*)::int
          FROM ${review_assignments}
          WHERE ${review_assignments.reviewerId} = ${users.id}
          AND ${review_assignments.status} = 'completed'
        ), 0)`.as('completedReviews'),
        pendingReviews: sql<number>`COALESCE((
          SELECT COUNT(*)::int
          FROM ${review_assignments}
          WHERE ${review_assignments.reviewerId} = ${users.id}
          AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
        ), 0)`.as('pendingReviews'),
        // Calculate average response time
        responseTime: sql<number>`COALESCE((
          SELECT AVG(EXTRACT(EPOCH FROM (${review_assignments.completedAt} - ${review_assignments.assignedAt}))/86400)::int
          FROM ${review_assignments}
          WHERE ${review_assignments.reviewerId} = ${users.id}
          AND ${review_assignments.status} = 'completed'
          AND ${review_assignments.completedAt} IS NOT NULL
        ), 14)`.as('responseTime'),
        // Calculate on-time completion rate
        onTimeRate: sql<number>`CASE 
          WHEN (SELECT COUNT(*) FROM ${review_assignments} WHERE ${review_assignments.reviewerId} = ${users.id} AND ${review_assignments.status} = 'completed') = 0 
          THEN 100
          ELSE COALESCE((
            SELECT (COUNT(*) FILTER (WHERE ${review_assignments.completedAt} <= ${review_assignments.dueDate}) * 100.0 / COUNT(*))::int
            FROM ${review_assignments}
            WHERE ${review_assignments.reviewerId} = ${users.id}
            AND ${review_assignments.status} = 'completed'
            AND ${review_assignments.completedAt} IS NOT NULL
          ), 100)
        END`.as('onTimeRate'),
        // Get average review score (quality rating)
        qualityScore: sql<number>`COALESCE((
          SELECT AVG(${review_assignments.reviewScore})::numeric(3,1)
          FROM ${review_assignments}
          WHERE ${review_assignments.reviewerId} = ${users.id}
          AND ${review_assignments.reviewScore} IS NOT NULL
        ), 4.0)`.as('qualityScore'),
        lastActive: users.lastActiveAt,
        status: sql<string>`CASE 
          WHEN ${users.isActive} = true AND ${users.applicationStatus} = 'approved' THEN 'active'
          WHEN ${users.isActive} = false THEN 'inactive'
          ELSE 'unavailable'
        END`.as('status'),
        // Calculate availability based on current load
        availability: sql<string>`CASE 
          WHEN COALESCE((
            SELECT COUNT(*)
            FROM ${review_assignments}
            WHERE ${review_assignments.reviewerId} = ${users.id}
            AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
          ), 0) = 0 THEN 'available'
          WHEN COALESCE((
            SELECT COUNT(*)
            FROM ${review_assignments}
            WHERE ${review_assignments.reviewerId} = ${users.id}
            AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
          ), 0) >= COALESCE((
            SELECT ${reviewerProfiles.maxReviewsPerMonth}
            FROM ${reviewerProfiles}
            WHERE ${reviewerProfiles.userId} = ${users.id}
          ), 3) THEN 'unavailable'
          ELSE 'limited'
        END`.as('availability')
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, users.id))
      .where(eq(users.role, "reviewer"))
      .orderBy(desc(users.name))

    const reviewers = await reviewersQuery

    // Transform the data to match the frontend interface
    const transformedReviewers = reviewers.map(reviewer => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      affiliation: reviewer.affiliation || undefined,
      expertise: Array.isArray(reviewer.expertise) ? reviewer.expertise : [],
      currentLoad: reviewer.currentLoad,
      maxLoad: reviewer.maxLoad,
      averageRating: reviewer.qualityScore, // Legacy field name
      onTimeRate: reviewer.onTimeRate,
      completedReviews: reviewer.completedReviews,
      pendingReviews: reviewer.pendingReviews,
      lastActive: reviewer.lastActive?.toISOString() || new Date().toISOString(),
      status: reviewer.status as "active" | "inactive" | "unavailable",
      responseTime: reviewer.responseTime,
      qualityScore: reviewer.qualityScore,
      orcid: reviewer.orcid || undefined,
      availability: reviewer.availability as "available" | "limited" | "unavailable"
    }))

    // Apply filters
    let filteredReviewers = transformedReviewers
    
    if (status && status !== "all") {
      filteredReviewers = filteredReviewers.filter(r => r.status === status)
    }
    
    if (availability && availability !== "all") {
      filteredReviewers = filteredReviewers.filter(r => r.availability === availability)
    }

    return NextResponse.json({
      success: true,
      reviewers: filteredReviewers
    })

  } catch (error) {
    console.error("Error fetching reviewers:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviewers" },
      { status: 500 }
    )
  }
}