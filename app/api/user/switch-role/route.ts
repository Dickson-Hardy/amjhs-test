import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only editorial assistants can switch roles
    if (session.user.role !== "editorial-assistant") {
      return NextResponse.json({ 
        error: "Only editorial assistants can switch roles" 
      }, { status: 403 })
    }

    const body = await request.json()
    const { targetRole, reason } = body

    // Validate target role
    if (targetRole !== "associate-editor") {
      return NextResponse.json({ 
        error: "Invalid target role. Only 'associate-editor' is allowed." 
      }, { status: 400 })
    }

    // Check if there's already an associate editor (optional constraint)
    const existingAssociateEditor = await db.query.users.findFirst({
      where: eq(users.role, "associate-editor")
    })

    if (existingAssociateEditor && existingAssociateEditor.id !== session.user.id) {
      return NextResponse.json({ 
        error: "There is already an associate editor assigned. Please contact an administrator." 
      }, { status: 409 })
    }

    // Update the user's role
    await db.update(users)
      .set({ 
        role: targetRole,
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))

    // Log the role change
    logError(new Error(`Role change logged`), {
      service: 'RoleSwitcher',
      action: 'switchRole',
      userId: session.user.id,
      fromRole: session.user.role,
      toRole: targetRole,
      reason: reason || 'No reason provided'
    })

    return NextResponse.json({ 
      success: true, 
      message: `Role successfully switched to ${targetRole}`,
      newRole: targetRole
    })

  } catch (error) {
    logError(error as Error, {
      service: 'RoleSwitcher',
      action: 'switchRole',
      userId: session?.user?.id
    })

    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
