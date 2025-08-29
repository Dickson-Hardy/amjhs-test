import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, submissions, reviews, userApplications, userQualifications, userPublications, userReferences, reviewerProfiles, editorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prevent admin from deleting themselves
    if (params.id === session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete your own account" 
      }, { status: 400 })
    }

    // Check if user exists and get their role
    const existingUser = await db.select({ role: users.role }).from(users).where(eq(users.id, params.id))
    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }

    // Prevent deletion of editor-in-chief
    if (existingUser[0].role === "editor-in-chief") {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete editor-in-chief account" 
      }, { status: 400 })
    }

    // Check if user has active submissions or reviews
    const activeSubmissions = await db
      .select({ count: submissions.id })
      .from(submissions)
      .where(eq(submissions.authorId, params.id))
      .limit(1)

    const activeReviews = await db
      .select({ count: reviews.id })
      .from(reviews)
      .where(eq(reviews.reviewerId, params.id))
      .limit(1)

    if (activeSubmissions.length > 0 || activeReviews.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete user with active submissions or reviews. Please reassign or complete them first." 
      }, { status: 400 })
    }

    // Delete user and all related data in a transaction
    await db.transaction(async (tx) => {
      // Delete related profile data
      await tx.delete(userApplications).where(eq(userApplications.userId, params.id))
      await tx.delete(userQualifications).where(eq(userQualifications.userId, params.id))
      await tx.delete(userPublications).where(eq(userPublications.userId, params.id))
      await tx.delete(userReferences).where(eq(userReferences.userId, params.id))
      await tx.delete(reviewerProfiles).where(eq(reviewerProfiles.userId, params.id))
      await tx.delete(editorProfiles).where(eq(editorProfiles.userId, params.id))
      
      // Finally delete the user
      await tx.delete(users).where(eq(users.id, params.id))
    })

    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/users/${params.id}` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete user" 
    }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const userId = params.id

    // Get user details with related data
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get submission count
    const submissionCount = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.authorId, userId))

    // Get review count
    const reviewCount = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.reviewerId, userId))

    return NextResponse.json({
      user: user[0],
      stats: {
        submissions: submissionCount[0].count,
        reviews: reviewCount[0].count
      }
    })

  } catch (error) {
    logger.error("Error fetching user details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
