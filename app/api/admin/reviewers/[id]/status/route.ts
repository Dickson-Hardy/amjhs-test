import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, reviewerProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    
    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid status. Must be one of: active, inactive, suspended" 
      }, { status: 400 })
    }

    // Check if user exists and is a reviewer
    const existingUser = await db
      .select({ 
        role: users.role, 
        isActive: users.isActive 
      })
      .from(users)
      .where(eq(users.id, params.id))

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }

    if (existingUser[0].role !== "reviewer") {
      return NextResponse.json({ 
        success: false, 
        error: "User is not a reviewer" 
      }, { status: 400 })
    }

    // Update user status
    const isActive = status === "active"
    await db
      .update(users)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, params.id))

    // Update reviewer profile status
    await db
      .update(reviewerProfiles)
      .set({ 
        isActive: isActive,
        updatedAt: new Date()
      })
      .where(eq(reviewerProfiles.userId, params.id))

    return NextResponse.json({
      success: true,
      message: `Reviewer status updated to ${status}`,
      status
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/reviewers/${params.id}/status` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update reviewer status" 
    }, { status: 500 })
  }
}
