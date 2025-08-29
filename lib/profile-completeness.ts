import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export interface ProfileCompletenessData {
  name: string | null
  email: string | null
  affiliation: string | null
  bio: string | null
  orcid: string | null
  expertise: string[] | null
  specializations: string[] | null
  researchInterests: string[] | null
  languagesSpoken: string[] | null
  isVerified: boolean | null
}

export interface ProfileCompletenessResult {
  score: number
  missingFields: string[]
  recommendations: string[]
  isComplete: boolean
}

/**
 * Profile Completeness Service
 * Calculates and manages user profile completion scores
 */
export class ProfileCompletenessService {
  
  /**
   * Calculate profile completeness score based on user data
   */
  static calculateProfileCompleteness(data: ProfileCompletenessData): ProfileCompletenessResult {
    let score = 0
    const missingFields: string[] = []
    const recommendations: string[] = []
    
    // process.env.AUTH_TOKEN_PREFIX + ' 'Information (40 points)
    if (data.name && data.name.trim().length >= 2) {
      score += 10
    } else {
      missingFields.push("Full name (minimum 2 characters)")
    }
    
    if (data.email && data.email.trim().length > 0) {
      score += 10
    } else {
      missingFields.push("Email address")
    }
    
    if (data.affiliation && data.affiliation.trim().length >= 3) {
      score += 10
    } else {
      missingFields.push("Institutional affiliation")
    }
    
    if (data.isVerified) {
      score += 10
    } else {
      missingFields.push("Email verification")
    }
    
    // Professional Information (35 points)
    if (data.bio && data.bio.trim().length >= 50) {
      score += 15
    } else {
      missingFields.push("Professional biography (minimum 50 characters)")
      recommendations.push("Add a detailed professional biography describing your background and expertise")
    }
    
    if (data.orcid && data.orcid.trim().length > 0) {
      score += 10
    } else {
      missingFields.push("ORCID identifier")
      recommendations.push("Add your ORCID identifier for better academic recognition")
    }
    
    if (data.expertise && data.expertise.length > 0) {
      score += 10
    } else {
      missingFields.push("Areas of expertise")
      recommendations.push("List your main areas of expertise and research focus")
    }
    
    // Academic Details (25 points)
    if (data.specializations && data.specializations.length > 0) {
      score += 10
    } else {
      missingFields.push("Academic specializations")
      recommendations.push("Specify your academic specializations and sub-fields")
    }
    
    if (data.researchInterests && data.researchInterests.length > 0) {
      score += 10
    } else {
      missingFields.push("Research interests")
      recommendations.push("Describe your current and future research interests")
    }
    
    if (data.languagesSpoken && data.languagesSpoken.length > 0) {
      score += 5
    } else {
      missingFields.push("Languages spoken")
      recommendations.push("List languages you can communicate in for international collaboration")
    }
    
    // Ensure score doesn't exceed 100
    score = Math.min(score, 100)
    
    // Determine if profile is complete enough for submission (80% threshold)
    const isComplete = score >= 80
    
    // Generate additional recommendations based on score
    if (score < 50) {
      recommendations.push("Complete basic profile information to get started")
    } else if (score < 80) {
      recommendations.push("Add more details to reach the 80% completion required for article submission")
    } else {
      recommendations.push("Great! Your profile is complete and ready for article submission")
    }
    
    return {
      score,
      missingFields,
      recommendations,
      isComplete
    }
  }
  
  /**
   * Get profile completeness for a specific user
   */
  static async getUserProfileCompleteness(userId: string): Promise<ProfileCompletenessResult> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          name: true,
          email: true,
          affiliation: true,
          bio: true,
          orcid: true,
          expertise: true,
          specializations: true,
          researchInterests: true,
          languagesSpoken: true,
          isVerified: true
        }
      })
      
      if (!user) {
        throw new NotFoundError("User not found")
      }
      
      const profileData: ProfileCompletenessData = {
        name: user.name,
        email: user.email,
        affiliation: user.affiliation,
        bio: user.bio,
        orcid: user.orcid,
        expertise: user.expertise,
        specializations: user.specializations,
        researchInterests: user.researchInterests,
        languagesSpoken: user.languagesSpoken,
        isVerified: user.isVerified
      }
      
      return this.calculateProfileCompleteness(profileData)
      
    } catch (error) {
      logger.error("Error calculating profile completeness:", error)
      return {
        score: 0,
        missingFields: ["Unable to calculate profile completeness"],
        recommendations: ["Please contact support if this issue persists"],
        isComplete: false
      }
    }
  }
  
  /**
   * Update profile completeness in database
   */
  static async updateProfileCompleteness(userId: string): Promise<number> {
    try {
      const completeness = await this.getUserProfileCompleteness(userId)
      
      // Update the user's profile completeness score
      await db
        .update(users)
        .set({
          profileCompleteness: completeness.score,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
      
      return completeness.score
      
    } catch (error) {
      logger.error("Error updating profile completeness:", error)
      return 0
    }
  }
  
  /**
   * Check if user can submit articles based on profile completeness
   */
  static async canSubmitArticles(userId: string): Promise<{
    canSubmit: boolean
    score: number
    missingFields: string[]
    recommendations: string[]
  }> {
    const completeness = await this.getUserProfileCompleteness(userId)
    
    return {
      canSubmit: completeness.isComplete,
      score: completeness.score,
      missingFields: completeness.missingFields,
      recommendations: completeness.recommendations
    }
  }
  
  /**
   * Get profile completion requirements for article submission
   */
  static getSubmissionRequirements(): {
    minimumScore: number
    requiredFields: string[]
    recommendedFields: string[]
  } {
    return {
      minimumScore: 0, // TEMPORARILY DISABLED: was 80
      requiredFields: [
        "Full name (minimum 2 characters)",
        "Email address",
        "Institutional affiliation",
        "Email verification",
        "Professional biography (minimum 50 characters)"
      ],
      recommendedFields: [
        "ORCID identifier",
        "Areas of expertise",
        "Academic specializations",
        "Research interests",
        "Languages spoken"
      ]
    }
  }
}
