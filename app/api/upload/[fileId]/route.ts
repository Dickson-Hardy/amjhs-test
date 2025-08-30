import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { userDocuments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteFromCloudinary } from "@/lib/cloudinary"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = params

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    // Get file from database
    const files = await db.select().from(userDocuments).where(eq(userDocuments.id, fileId))
    
    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]

    // Check if user owns the file or is admin
    if (session.user.role !== "admin" && session.user.id !== file.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      // Delete from Cloudinary if cloudinaryPublicId exists
      if (file.cloudinaryPublicId) {
        await deleteFromCloudinary(file.cloudinaryPublicId)
      }
      
      // Delete from database
      await db.delete(userDocuments).where(eq(userDocuments.id, fileId))

      return NextResponse.json({
        success: true,
        message: "File deleted successfully"
      })
    } catch (error) {
      logError(error as Error, { endpoint: "/api/upload/[fileId]", operation: "DELETE" })
      return NextResponse.json({ 
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload/[fileId]", operation: "DELETE" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = params

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    // Get file from database
    const files = await db.select().from(userDocuments).where(eq(userDocuments.id, fileId))
    
    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]

    // Check if user owns the file or is admin
    if (session.user.role !== "admin" && session.user.id !== file.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.originalName,
        fileName: file.fileName,
        fileType: file.mimeType,
        documentType: file.documentType,
        size: file.fileSize,
        uploadedAt: file.uploadedAt,
        url: file.cloudinaryUrl || file.filePath,
        downloadUrl: `/api/files/${file.id}/download`,
        previewUrl: file.cloudinaryUrl || `/api/files/${file.id}/preview`,
        cloudinaryPublicId: file.cloudinaryPublicId
      }
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload/[fileId]", operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}