import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { userDocuments, articles, submissions, editorAssignments } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { promises as fs } from "fs"
import { canUserAccessManuscript } from "@/lib/workflow"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const fileId = params.id

    // Get file from database and stream it
    try {
      const [fileRecord] = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.id, fileId))
        .limit(1)

      if (!fileRecord) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      // Check permissions - Enhanced for editorial roles
      const hasAccess = await checkFileAccessPermission(
        fileRecord,
        session.user.id,
        session.user.role
      )

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      // Check if file exists on filesystem
      try {
        await fs.access(fileRecord.filePath)
      } catch {
        return NextResponse.json({ error: "File not found on server" }, { status: 404 })
      }

      // Read file and stream it
      const fileBuffer = await fs.readFile(fileRecord.filePath)
      
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': fileRecord.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileRecord.originalName}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (error) {
      logError(error as Error, { endpoint: `/api/files/${fileId}/download`, operation: "file_download" })
      return NextResponse.json({ 
        error: "Failed to download file" 
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: `/api/files/${context.params}/download`, operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

/**
 * Enhanced permission checking for file access
 * Supports editorial roles accessing manuscript files
 */
async function checkFileAccessPermission(
  fileRecord: any,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    // Admin has access to everything
    if (userRole === "admin") {
      return true
    }

    // File owner has access
    if (fileRecord.userId === userId) {
      return true
    }

    // For editorial roles, check if they have access to related manuscripts
    if (["editorial-assistant", "editor", "managing-editor", "editor-in-chief", "section-editor"].includes(userRole)) {
      // Check if this file is associated with a manuscript they can access
      const hasManuscriptAccess = await checkManuscriptFileAccess(fileRecord, userId, userRole)
      if (hasManuscriptAccess) {
        return true
      }
    }

    return false

  } catch (error) {
    logError(error as Error, { 
      context: "checkFileAccessPermission",
      fileId: fileRecord.id,
      userId,
      userRole 
    })
    return false
  }
}

/**
 * Check if user can access file based on manuscript association
 */
async function checkManuscriptFileAccess(
  fileRecord: any,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    // This is a simplified check - in a full implementation, you'd need
    // to properly link files to manuscripts/articles
    
    // For editorial assistants - check if any manuscripts in their queue
    if (userRole === "editorial-assistant") {
      const manuscriptsInQueue = await db
        .select({ count: submissions.id })
        .from(submissions)
        .where(or(
          eq(submissions.status, "submitted"),
          eq(submissions.status, "editorial_assistant_review"),
          eq(submissions.status, "associate_editor_assignment")
        ))

      return manuscriptsInQueue.length > 0
    }

    // For associate editors - check if they have any assignments
    if (userRole === "editor") {
      const assignments = await db
        .select({ count: editorAssignments.id })
        .from(editorAssignments)
        .where(and(
          eq(editorAssignments.editorId, userId),
          or(
            eq(editorAssignments.status, "pending"),
            eq(editorAssignments.status, "active")
          )
        ))

      return assignments.length > 0
    }

    // Managing editors and editor-in-chief have broader access
    if (["managing-editor", "editor-in-chief", "section-editor"].includes(userRole)) {
      return true
    }

    return false

  } catch (error) {
    logError(error as Error, { 
      context: "checkManuscriptFileAccess",
      fileId: fileRecord.id,
      userId,
      userRole 
    })
    return false
  }
} 