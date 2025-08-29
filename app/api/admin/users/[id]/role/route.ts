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

    const { role } = await request.json()
    
    if (!role || !["admin", "editor-in-chief", "managing-editor", "section-editor", "editor", "reviewer", "author"].includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid role. Must be one of: admin, editor-in-chief, managing-editor, section-editor, editor, reviewer, author" 
      }, { status: 400 })
    }

    // Prevent admin from changing their own role to non-admin
    if (params.id === session.user.id && role !== "admin") {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot change your own role from admin" 
      }, { status: 400 })
    }

    // Prevent changing editor-in-chief role
    const existingUser = await db.select({ role: users.role }).from(users).where(eq(users.id, params.id))
    if (existingUser[0]?.role === "editor-in-chief" && role !== "editor-in-chief") {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot change editor-in-chief role" 
      }, { status: 400 })
    }

    const result = await db
      .update(users)
      .set({ 
        role,
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
      message: `User role updated to ${role}`,
      user: result[0]
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/admin/users/${params.id}/role` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update user role" 
    }, { status: 500 })
  }
}
