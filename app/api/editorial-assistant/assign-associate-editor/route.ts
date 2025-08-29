import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialAssistantService } from "@/lib/workflow"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { users } from "@/lib/db/schema"
import { db } from "@/lib/db"

// Assignment validation schema
const assignmentSchema = z.object({
  submissionId: z.string().uuid(),
  associateEditorId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = assignmentSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { submissionId, associateEditorId } = validation.data
    const editorialAssistantId = session.user.id

    // Assign associate editor
    const editorialAssistantService = new EditorialAssistantService()
    const result = await editorialAssistantService.assignAssociateEditor(
      submissionId,
      associateEditorId,
      editorialAssistantId
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/assign-associate-editor", action: "assignAssociateEditor" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get available associate editors for assignment
    const associateEditors = await db.query.users.findMany({
      where: eq(users.role, "editor"),
      columns: {
        id: true,
        name: true,
        email: true,
        expertise: true,
        specializations: true,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      associateEditors: associateEditors.filter(editor => editor.isActive)
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/assign-associate-editor", action: "fetchAssociateEditors" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
