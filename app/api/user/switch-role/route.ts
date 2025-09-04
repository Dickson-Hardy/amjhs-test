import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, editorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  let session
  try {
    session = await getServerSession(authOptions)
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

    // Check if there's already an associate editor (check editorProfiles table)
    const existingAssociateEditor = await db.query.editorProfiles.findFirst({
      where: eq(editorProfiles.editorType, "associate")
    })

    if (existingAssociateEditor && existingAssociateEditor.userId !== session.user.id) {
      return NextResponse.json({ 
        error: "There is already an associate editor assigned. Please contact an administrator." 
      }, { status: 409 })
    }

    // Update the user's role to editor
    await db.update(users)
      .set({ 
        role: "editor",
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))

    // Create or update editor profile with associate type
    const existingProfile = await db.query.editorProfiles.findFirst({
      where: eq(editorProfiles.userId, session.user.id)
    })

    if (existingProfile) {
      // Update existing profile
      await db.update(editorProfiles)
        .set({
          editorType: "associate",
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(editorProfiles.userId, session.user.id))
    } else {
      // Create new profile
      await db.insert(editorProfiles).values({
        userId: session.user.id,
        editorType: "associate",
        assignedSections: [],
        currentWorkload: 0,
        maxWorkload: 10,
        isAcceptingSubmissions: true,
        startDate: new Date(),
        isActive: true
      })
    }

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
      message: `Role successfully switched to associate editor`,
      newRole: "editor",
      editorType: "associate"
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
