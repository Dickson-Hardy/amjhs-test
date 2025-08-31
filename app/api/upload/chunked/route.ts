import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"
import { userDocuments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { uploadToCloudinary } from "@/lib/cloudinary"

// Chunk upload validation schema
const chunkUploadSchema = z.object({
  uploadId: z.string().optional(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  totalSize: z.number().min(1),
  chunkIndex: z.number().min(0),
  totalChunks: z.number().min(1),
  chunkData: z.string().min(1), // Base64 encoded chunk
  category: z.enum(["manuscript", "supplementary", "cover_letter", "ethics_approval", "conflict_disclosure"]),
  description: z.string().optional()
})

// Cloudinary upload result interface
interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  [key: string]: any
}

// In-memory storage for chunk metadata (in production, use Redis or database)
const uploadSessions: Map<string, {
  fileName: string
  fileType: string
  totalSize: number
  totalChunks: number
  category: string
  description?: string
  userId: string
  chunks: Map<number, Buffer>
  uploadedAt: Date
}> = new Map()

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  for (const [uploadId, session] of uploadSessions.entries()) {
    if (session.uploadedAt < oneHourAgo) {
      uploadSessions.delete(uploadId)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = chunkUploadSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { 
      uploadId: providedUploadId, 
      fileName, 
      fileType, 
      totalSize, 
      chunkIndex, 
      totalChunks, 
      chunkData, 
      category,
      description 
    } = validation.data

    // Get or create upload session
    let uploadId = providedUploadId
    let uploadSession = uploadId ? uploadSessions.get(uploadId) : undefined

    if (!uploadSession) {
      // Create new upload session
      uploadId = uuidv4()
      uploadSession = {
        fileName,
        fileType,
        totalSize,
        totalChunks,
        category,
        description,
        userId: session.user.id,
        chunks: new Map(),
        uploadedAt: new Date()
      }
      uploadSessions.set(uploadId, uploadSession)
    }

    // Validate session matches current upload
    if (uploadSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Upload session not found or unauthorized" }, { status: 403 })
    }

    // Decode and store chunk
    const chunkBuffer = Buffer.from(chunkData, 'base64')
    uploadSession.chunks.set(chunkIndex, chunkBuffer)

    // Check if all chunks are received
    const receivedChunks = uploadSession.chunks.size
    const isComplete = receivedChunks === totalChunks

    if (isComplete) {
      try {
        // Reassemble file from chunks
        const chunks: Buffer[] = []
        for (let i = 0; i < totalChunks; i++) {
          const chunk = uploadSession.chunks.get(i)
          if (!chunk) {
            throw new Error(`Missing chunk ${i}`)
          }
          chunks.push(chunk)
        }
        
        const completeFile = Buffer.concat(chunks)
        
        // Validate file size
        if (completeFile.length !== totalSize) {
          throw new Error(`File size mismatch. Expected ${totalSize}, got ${completeFile.length}`)
        }

        // Upload to Cloudinary
        const fileId = uuidv4()
        const uniqueFilename = `${fileId}_${Date.now()}`
        const folderPath = `manuscript-submissions/${category}/${session.user.id}`
        
        // Determine file extension
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
        const resourceType = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension) ? 'image' : 'raw'
        
        const cloudinaryResult = await uploadToCloudinary(
          completeFile,
          uniqueFilename,
          folderPath,
          resourceType
        ) as CloudinaryUploadResult

        // Store file metadata in database
        const mimeByExt: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.rtf': 'application/rtf',
          '.txt': 'text/plain',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.zip': 'application/zip',
          '.rar': 'application/vnd.rar'
        }
        const mimeType = mimeByExt[fileExtension] || 'application/octet-stream'

        await db.insert(userDocuments).values({
          id: fileId,
          userId: session.user.id,
          documentType: category,
          fileName: `${uniqueFilename}${fileExtension}`,
          originalName: fileName,
          filePath: cloudinaryResult.secure_url,
          fileSize: completeFile.length,
          mimeType: mimeType,
          uploadedAt: new Date(),
          cloudinaryPublicId: cloudinaryResult.public_id,
          cloudinaryUrl: cloudinaryResult.secure_url
        })

        // Clean up upload session
        uploadSessions.delete(uploadId)

        return NextResponse.json({
          success: true,
          completed: true,
          file: {
            id: fileId,
            originalName: fileName,
            url: cloudinaryResult.secure_url,
            downloadUrl: `/api/files/${fileId}/download`,
            previewUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id
          },
          message: "File uploaded successfully"
        })

      } catch (error) {
        // Clean up on error
        uploadSessions.delete(uploadId)
        logError(error as Error, { endpoint: "/api/upload/chunked", operation: "file_assembly" })
        return NextResponse.json({ 
          error: "Failed to process uploaded file",
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
      }
    } else {
      // Return progress update
      return NextResponse.json({
        success: true,
        completed: false,
        uploadId,
        progress: {
          chunksReceived: receivedChunks,
          totalChunks,
          percentage: Math.round((receivedChunks / totalChunks) * 100)
        },
        message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`
      })
    }

  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload/chunked", operation: "POST" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// Get upload session status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get("uploadId")

    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID required" }, { status: 400 })
    }

    const uploadSession = uploadSessions.get(uploadId)
    if (!uploadSession || uploadSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      progress: {
        chunksReceived: uploadSession.chunks.size,
        totalChunks: uploadSession.totalChunks,
        percentage: Math.round((uploadSession.chunks.size / uploadSession.totalChunks) * 100)
      }
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload/chunked", operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}