import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { profileUpdateSchema } from "@/lib/enhanced-validations"
import { db } from "@/lib/db"
import { users, editorProfiles, submissions, reviews } from "@/lib/db/schema"
import { eq, and, not } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"
import { ProfileCompletenessService } from "@/lib/profile-completeness"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const userProfile = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        affiliation: users.affiliation,
        bio: users.bio,
        orcid: users.orcid,
        orcidVerified: users.orcidVerified,
        specializations: users.specializations,
        expertise: users.expertise,
        researchInterests: users.researchInterests,
        languagesSpoken: users.languagesSpoken,
        profileCompleteness: users.profileCompleteness,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!userProfile.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userProfile[0]
    let editorProfile = null

    // Get editor profile if user is an editor
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (allowedRoles.includes(user.role || "")) {
      const editorProfileResult = await db
        .select({
          editorType: editorProfiles.editorType,
          assignedSections: editorProfiles.assignedSections,
          currentWorkload: editorProfiles.currentWorkload,
          maxWorkload: editorProfiles.maxWorkload,
          isAcceptingSubmissions: editorProfiles.isAcceptingSubmissions,
        })
        .from(editorProfiles)
        .where(eq(editorProfiles.userId, session.user.id))
        .limit(1)

      if (editorProfileResult.length) {
        editorProfile = editorProfileResult[0]
      }
    }

    // Calculate real-time profile completeness
    const completenessResult = await ProfileCompletenessService.getUserProfileCompleteness(session.user.id)
    
    // Update the profile completeness in the database if it's different
    if (completenessResult.score !== (user.profileCompleteness || 0)) {
      await ProfileCompletenessService.updateProfileCompleteness(session.user.id)
    }

    // Determine user's primary section
    let primarySection = "General"
    if (editorProfile?.assignedSections && editorProfile.assignedSections.length > 0) {
      primarySection = editorProfile.assignedSections[0]
    } else if (user.specializations && user.specializations.length > 0) {
      primarySection = user.specializations[0]
    } else if (user.expertise && user.expertise.length > 0) {
      primarySection = user.expertise[0]
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        profileCompleteness: completenessResult.score, // Use real-time calculation
        editorProfile,
        primarySection,
        availableSections: editorProfile?.assignedSections || [primarySection],
        // Add completeness details
        completenessDetails: {
          score: completenessResult.score,
          missingFields: completenessResult.missingFields,
          recommendations: completenessResult.recommendations,
          isComplete: completenessResult.isComplete,
          canSubmitArticles: completenessResult.isComplete
        }
      },
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/profile` })
    return NextResponse.json({ success: false, error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Enhanced validation using Zod schema
    const validatedData = profileUpdateSchema.parse(body)

    // Update user profile
    const updatedProfile = await db
      .update(users)
      .set({
        name: validatedData.name.trim(),
        affiliation: validatedData.affiliation?.trim() || null,
        orcid: validatedData.orcid?.trim() || null,
        bio: validatedData.bio?.trim() || null,
        expertise: validatedData.expertise || [],
        specializations: validatedData.specializations || [],
        researchInterests: validatedData.researchInterests || [],
        languagesSpoken: validatedData.languagesSpoken || [],
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        affiliation: users.affiliation,
        bio: users.bio,
        orcid: users.orcid,
        orcidVerified: users.orcidVerified,
        specializations: users.specializations,
        expertise: users.expertise,
        researchInterests: users.researchInterests,
        languagesSpoken: users.languagesSpoken,
        profileCompleteness: users.profileCompleteness,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    // Update profile completeness after profile changes
    const newCompleteness = await ProfileCompletenessService.updateProfileCompleteness(session.user.id)

    if (!updatedProfile.length) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile[0],
        profileCompleteness: newCompleteness
      },
      message: "Profile updated successfully",
      completenessUpdated: true,
      newScore: newCompleteness
    })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: `/api/user/profile`, action: 'update' })
    return NextResponse.json({ success: false, error: "Failed to update user profile" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const confirmDelete = searchParams.get("confirm") === "true"

    if (!confirmDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Account deletion must be confirmed with ?confirm=true" 
      }, { status: 400 })
    }

    // Check if user has active submissions or reviews
    const activeSubmissions = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(
        eq(submissions.authorId, session.user.id),
        not(eq(submissions.status, "withdrawn"))
      ))
      .limit(1)

    const activeReviews = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, session.user.id),
        not(eq(reviews.status, "completed"))
      ))
      .limit(1)

    if (activeSubmissions.length > 0 || activeReviews.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete account with active submissions or reviews. Please complete or withdraw them first." 
      }, { status: 400 })
    }

    // Soft delete - deactivate account instead of hard delete
    const [deletedUser] = await db
      .update(users)
      .set({ 
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${session.user.id}@example.com`, // Anonymize email
        name: `Deleted User ${session.user.id.slice(0, 8)}` // Anonymize name
      })
      .where(eq(users.id, session.user.id))
      .returning({ id: users.id })

    if (!deletedUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to delete account" 
      }, { status: 500 })
    }

    logInfo("User account deleted", { 
      userId: session.user.id,
      deletedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/profile`, action: 'delete' })
    return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 })
  }
}
