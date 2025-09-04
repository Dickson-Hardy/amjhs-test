import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialAssistantService } from "@/lib/workflow"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is editorial assistant
    if (session.user.role !== "editorial-assistant") {
      return NextResponse.json({ 
        error: "Access denied. Editorial assistant role required." 
      }, { status: 403 })
    }

    const body = await request.json()
    const { manuscriptId, associateEditorId, assignmentReason, additionalNotes } = body

    // For systems with a single associate editor, we can auto-assign
    // or allow manual assignment if specific editor ID is provided
    if (!manuscriptId) {
      return NextResponse.json({
        error: "Missing required field: manuscriptId is required"
      }, { status: 400 })
    }

    logInfo("Editorial assistant assigning manuscript to associate editor", {
      operation: "assignAssociateEditor",
      manuscriptId,
      associateEditorId: associateEditorId || "auto-assign",
      assignmentReason,
      editorialAssistantId: session.user.id
    })

    // Use the workflow to assign the associate editor
    const editorialAssistantService = new EditorialAssistantService()
    
    let result
    if (associateEditorId) {
      // Manual assignment to specific editor
      result = await editorialAssistantService.assignAssociateEditor(
        manuscriptId,
        associateEditorId,
        session.user.id
      )
    } else {
      // Auto-assign to the single associate editor
      result = await editorialAssistantService.autoAssignToAssociateEditor(
        manuscriptId,
        session.user.id
      )
    }

    if (!result.success) {
      logError(new Error("Failed to assign associate editor"), {
        operation: "assignAssociateEditor",
        manuscriptId,
        associateEditorId,
        error: result.message
      })
      
      return NextResponse.json({
        error: result.message || "Failed to assign associate editor"
      }, { status: 400 })
    }

    logInfo("Manuscript assigned to associate editor successfully", {
      operation: "assignAssociateEditor",
      manuscriptId,
      associateEditorId: 'associateEditorId' in result ? result.associateEditorId : associateEditorId,
      editorialAssistantId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: "Manuscript assigned to associate editor successfully",
      associateEditorId: 'associateEditorId' in result ? result.associateEditorId : associateEditorId
    })

  } catch (error) {
    logError(error instanceof Error ? error : new Error("Unknown error in associate editor assignment"), {
      operation: "assignAssociateEditor",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}