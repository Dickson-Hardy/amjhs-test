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

      // Check permissions
      if (session.user.role !== "admin" && fileRecord.userId !== session.user.id) {
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
      
      return new NextResponse(fileBuffer as unknown, {
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