import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
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

    // Prevent admin from suspending themselves
    if (params.id === session.user.id && status === "suspended") {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot suspend your own account" 
      }, { status: 400 })
    }

    // Prevent changing editor-in-chief status
    const existingUser = await db.select({ role: users.role }).from(users).where(eq(users.id, params.id))
    if (existingUser[0]?.role === "editor-in-chief" && status !== "active") {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot change editor-in-chief status" 
      }, { status: 400 })
    }

    const result = await db
      .update(users)
      .set({ 
        isActive: status === "active",
        updatedAt: new Date()
      })
      .where(eq(users.id, params.id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
      user: result[0]
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/users/${params.id}/status` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update user status" 
    }, { status: 500 })
  }
}
