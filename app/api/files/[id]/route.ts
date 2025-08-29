import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { userDocuments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { promises as fs } from "fs"

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

    // Get file metadata from database
    try {
      const [fileRecord] = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.id, fileId))
        .limit(1)

      if (!fileRecord) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      // Check permissions
      if (session.user.role !== "admin" && fileRecord.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        file: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          fileName: fileRecord.fileName,
          fileType: fileRecord.mimeType,
          documentType: fileRecord.documentType,
          size: fileRecord.fileSize,
          uploadedBy: fileRecord.userId,
          uploadedAt: fileRecord.uploadedAt,
          status: 'uploaded',
          virusScanned: true,
          processed: true
        }
      })
    } catch (error) {
      logError(error as Error, { endpoint: `/api/files/${fileId}`, operation: "GET" })
      return NextResponse.json({ 
        error: "Failed to retrieve file metadata" 
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: `/api/files/${context.params}`, operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete file from database and filesystem
    try {
      const [fileRecord] = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.id, fileId))
        .limit(1)

      if (!fileRecord) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      // Check permissions
      if (session.user.role !== "admin" && fileRecord.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      // Delete file from filesystem
      try {
        if (fileRecord.filePath && await fs.access(fileRecord.filePath).then(() => true).catch(() => false)) {
          await fs.unlink(fileRecord.filePath)
        }
      } catch (fsError) {
        logError(fsError as Error, { endpoint: `/api/files/${fileId}`, operation: "file_deletion" })
      }

      // Delete from database
      await db.delete(userDocuments).where(eq(userDocuments.id, fileId))

      return NextResponse.json({
        success: true,
        message: "File deleted successfully"
      })
    } catch (error) {
      logError(error as Error, { endpoint: `/api/files/${fileId}`, operation: "DELETE" })
      return NextResponse.json({ 
        error: "Failed to delete file" 
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: `/api/files/${context.params}`, operation: "DELETE" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 