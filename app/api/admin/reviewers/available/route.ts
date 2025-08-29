import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, reviewerProfiles, reviews } from "@/lib/db/schema"
import { eq, and, ilike, sql, ne, notInArray } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('query') || ''
    const submissionId = searchParams.get('submissionId')

    // Base query to get reviewers
    let whereConditions = [
      eq(users.role, 'reviewer'),
      eq(users.isActive, true)
    ]

    // Add search query filter
    if (query) {
      whereConditions.push(
        sql`(${users.name} ILIKE ${'%' + query + '%'} OR ${users.email} ILIKE ${'%' + query + '%'} OR ${users.affiliation} ILIKE ${'%' + query + '%'})`
      )
    }

    // Exclude reviewers already assigned to this submission
    let excludeReviewerIds: string[] = []
    if (submissionId) {
      const assignedReviewers = await db
        .select({ reviewerId: reviews.reviewerId })
        .from(reviews)
        .where(eq(reviews.articleId, submissionId))
      
      excludeReviewerIds = assignedReviewers.map(r => r.reviewerId)
      
      if (excludeReviewerIds.length > 0) {
        whereConditions.push(notInArray(users.id, excludeReviewerIds))
      }
    }

    // Get available reviewers with their profile data
    const availableReviewers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        affiliation: users.affiliation,
        expertise: users.expertise,
        researchInterests: users.researchInterests,
        orcid: users.orcid,
        // Profile data
        availabilityStatus: reviewerProfiles.availabilityStatus,
        maxReviewsPerMonth: reviewerProfiles.maxReviewsPerMonth,
        currentReviewLoad: reviewerProfiles.currentReviewLoad,
        averageReviewTime: reviewerProfiles.averageReviewTime,
        completedReviews: reviewerProfiles.completedReviews,
        lateReviews: reviewerProfiles.lateReviews,
        overallRating: reviewerProfiles.overallRating,
        lastReviewDate: reviewerProfiles.lastReviewDate
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(users.id, reviewerProfiles.userId))
      .where(and(...whereConditions))
      .orderBy(users.name)
      .limit(50) // Limit results for performance

    // Filter by category/expertise if provided
    let filteredReviewers = availableReviewers
    if (category) {
      filteredReviewers = availableReviewers.filter(reviewer => {
        const expertise = reviewer.expertise as string[] || []
        const interests = reviewer.researchInterests as string[] || []
        
        return expertise.some(exp => 
          exp.toLowerCase().includes(category.toLowerCase())
        ) || interests.some(interest => 
          interest.toLowerCase().includes(category.toLowerCase())
        )
      })
    }

    // Format the response with additional computed fields
    const formattedReviewers = filteredReviewers.map(reviewer => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      affiliation: reviewer.affiliation,
      expertise: reviewer.expertise || [],
      researchInterests: reviewer.researchInterests || [],
      orcid: reviewer.orcid,
      
      // Availability info
      availabilityStatus: reviewer.availabilityStatus || 'available',
      currentReviewLoad: reviewer.currentReviewLoad || 0,
      maxReviewsPerMonth: reviewer.maxReviewsPerMonth || 3,
      canAcceptReview: (reviewer.currentReviewLoad || 0) < (reviewer.maxReviewsPerMonth || 3),
      
      // Performance metrics
      completedReviews: reviewer.completedReviews || 0,
      lateReviews: reviewer.lateReviews || 0,
      averageTime: reviewer.averageReviewTime || 0,
      reliabilityScore: reviewer.completedReviews > 0 
        ? Math.round(((reviewer.completedReviews - reviewer.lateReviews) / reviewer.completedReviews) * 100) 
        : 100,
      overallRating: reviewer.overallRating || 0,
      lastReviewDate: reviewer.lastReviewDate,
      
      // Computed availability score (0-100)
      availabilityScore: calculateAvailabilityScore({
        status: reviewer.availabilityStatus || 'available',
        currentLoad: reviewer.currentReviewLoad || 0,
        maxLoad: reviewer.maxReviewsPerMonth || 3,
        lastReview: reviewer.lastReviewDate
      })
    }))

    // Sort by availability score and performance
    formattedReviewers.sort((a, b) => {
      // Primary sort: availability score
      if (a.availabilityScore !== b.availabilityScore) {
        return b.availabilityScore - a.availabilityScore
      }
      // Secondary sort: completed reviews (experience)
      if (a.completedReviews !== b.completedReviews) {
        return b.completedReviews - a.completedReviews
      }
      // Tertiary sort: reliability score
      return b.reliabilityScore - a.reliabilityScore
    })

    return NextResponse.json({
      success: true,
      reviewers: formattedReviewers,
      total: formattedReviewers.length,
      filters: {
        category,
        query,
        excludedCount: excludeReviewerIds.length
      }
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/reviewers/available" })
    return NextResponse.json({ success: false, error: "Failed to fetch available reviewers" }, { status: 500 })
  }
}

function calculateAvailabilityScore(params: {
  status: string
  currentLoad: number
  maxLoad: number
  lastReview: string | null
}): number {
  const { status, currentLoad, maxLoad, lastReview } = params
  
  let score = 100
  
  // Availability status penalty
  if (status === 'limited') score -= 30
  if (status === 'unavailable') score -= 70
  
  // Current workload penalty
  const loadPercentage = (currentLoad / maxLoad) * 100
  if (loadPercentage >= 100) score -= 50
  else if (loadPercentage >= 80) score -= 30
  else if (loadPercentage >= 60) score -= 15
  
  // Recent activity bonus
  if (lastReview) {
    const daysSinceLastReview = Math.floor((new Date().getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastReview <= 30) score += 10 // Recently active
    else if (daysSinceLastReview >= 180) score -= 10 // Long inactive
  } else {
    score -= 5 // Never reviewed before
  }
  
  return Math.max(0, Math.min(100, score))
}
