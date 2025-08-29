import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, reviewerProfiles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

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

    // Fetch reviewers who can review for this section
    const reviewers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        specializations: users.specializations,
        expertise: users.expertise,
        role: users.role,
        created_at: users.createdAt
      })
      .from(users)
      .where(eq(users.role, "reviewer"))

    // Get reviewer profiles for additional details
    const reviewerApplications = await db
      .select()
      .from(reviewerProfiles)
      .where(eq(reviewerProfiles.isActive, true))

    const applicationMap = reviewerApplications.reduce((acc, app) => {
      acc[app.userId] = app
      return acc
    }, {} as Record<string, any>)

    // Transform reviewers to match the expected format
    const transformedReviewers = reviewers
      .filter(reviewer => {
        // Filter reviewers by section/specialization
        if (!reviewer.specializations) return false
        return reviewer.specializations.some((spec: string) => 
          spec.toLowerCase().includes(userSection.toLowerCase()) ||
          userSection.toLowerCase().includes(spec.toLowerCase())
        )
      })
      .map(reviewer => {
        const application = applicationMap[reviewer.id]
        const lastActive = new Date(reviewer.created_at || Date.now())
        const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: reviewer.id,
          name: reviewer.name || "Unknown Reviewer",
          email: reviewer.email || "",
          expertise: reviewer.expertise || reviewer.specializations || [],
          availability: daysSinceActive < 7 ? 'available' : daysSinceActive < 30 ? 'limited' : 'unavailable',
          currentLoad: 2, // Would calculate from active review assignments
          maxLoad: application?.max_reviews_per_month || 5,
          averageReviewTime: 18, // Days - would calculate from completed reviews
          qualityRating: 4.2, // Out of 5 - would calculate from review quality scores
          completedReviews: 25, // Would count from reviews table
          lastActive: lastActive.toISOString().split('T')[0]
        }
      })

    return NextResponse.json(transformedReviewers)

  } catch (error) {
    logger.error("Error fetching section editor reviewers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
