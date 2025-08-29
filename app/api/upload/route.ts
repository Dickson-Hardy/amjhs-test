import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"
import { userDocuments } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// File upload validation schema
const fileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  fileData: z.string().min(1, "File data is required"), // Base64 encoded
  category: z.enum(["manuscript", "supplementary", "cover_letter", "ethics_approval", "conflict_disclosure"]),
  description: z.string().optional()
})

// Allowed file types and size limits
const ALLOWED_FILE_TYPES = {
  manuscript: ['.doc', '.docx', '.pdf', '.rtf'],
  supplementary: ['.doc', '.docx', '.pdf', '.xls', '.xlsx', '.zip', '.rar'],
  cover_letter: ['.doc', '.docx', '.pdf', '.txt'],
  ethics_approval: ['.pdf', '.jpg', '.jpeg', '.png'],
  conflict_disclosure: ['.doc', '.docx', '.pdf', '.txt']
}

const MAX_FILE_SIZES = {
  manuscript: 10 * 1024 * 1024, // 10MB
  supplementary: 50 * 1024 * 1024, // 50MB
  cover_letter: 5 * 1024 * 1024, // 5MB
  ethics_approval: 5 * 1024 * 1024, // 5MB
  conflict_disclosure: 2 * 1024 * 1024 // 2MB
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = fileUploadSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { fileName, fileType, fileSize, fileData, category, description } = validation.data

    // Validate file type
    const allowedTypes = ALLOWED_FILE_TYPES[category]
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `File type ${fileExtension} not allowed for ${category}. Allowed: ${allowedTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[category]
    if (fileSize > maxSize) {
      return NextResponse.json({ 
        error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB for ${category}` 
      }, { status: 400 })
    }

    // Generate unique file ID
    const fileId = uuidv4()
    const timestamp = new Date().toISOString()
    
    // Create file metadata
    const fileMetadata = {
      id: fileId,
      originalName: fileName,
      fileType: fileExtension,
      category,
      size: fileSize,
      uploadedBy: session.user.id,
      uploadedAt: timestamp,
      description: description || '',
      status: 'uploaded',
      virusScanned: false,
      processed: false
    }

    // Store file to Cloudinary
    try {
      // Decode base64 file data (handle potential data URL prefix)
      const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData
      const buffer = Buffer.from(base64, 'base64')
      
      // Generate unique filename for Cloudinary
      const uniqueFilename = `${fileId}_${Date.now()}`
      const folderPath = `manuscript-submissions/${category}/${session.user.id}`
      
      // Determine resource type based on file extension
      const resourceType = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension) ? 'image' : 'raw'
      
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(
        buffer,
        uniqueFilename,
        folderPath,
        resourceType
      )

      // Infer simple MIME type from extension
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
      
      // Store file metadata in database
      await db.insert(userDocuments).values({
        id: fileId,
        userId: session.user.id,
        documentType: category,
        fileName: `${uniqueFilename}${fileExtension}`,
        originalName: fileName,
        filePath: cloudinaryResult.secure_url, // Store Cloudinary URL
        fileSize: buffer.length,
        mimeType: mimeType,
        uploadedAt: new Date(),
        // Store additional Cloudinary metadata
        cloudinaryPublicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url
      })

      // Return file upload response
      return NextResponse.json({
        success: true,
        file: {
          ...fileMetadata,
          url: cloudinaryResult.secure_url,
          downloadUrl: `/api/files/${fileId}/download`,
          previewUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id
        },
        message: "File uploaded successfully to Cloudinary"
      })
    } catch (storageError) {
      logError(storageError as Error, { endpoint: "/api/upload", operation: "cloudinary_storage" })
      return NextResponse.json({ 
        error: "Failed to store file to Cloudinary",
        details: storageError instanceof Error ? storageError.message : String(storageError)
      }, { status: 500 })
    }  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload", operation: "POST" })
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const userId = searchParams.get("userId")

    // Only allow users to see their own files or admins to see all
    if (userId && session.user.role !== "admin" && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get files from database
    try {
      // Build query conditions
      const conditions: unknown[] = []
      
      // Filter by user permissions
      if (session.user.role === "admin") {
        // Admin can see all files
        if (userId) {
          conditions.push(eq(userDocuments.userId, userId))
        }
      } else {
        // Users can only see their own files
        conditions.push(eq(userDocuments.userId, session.user.id))
      }
      
      // Filter by category if specified
      if (category) {
        conditions.push(eq(userDocuments.documentType, category))
      }
      
      // Execute query with all conditions
      const files = conditions.length > 0 
        ? await db.select().from(userDocuments).where(and(...conditions)).orderBy(desc(userDocuments.uploadedAt))
        : await db.select().from(userDocuments).orderBy(desc(userDocuments.uploadedAt))
      
      return NextResponse.json({
        success: true,
        files: files.map(file => ({
          id: file.id,
          originalName: file.originalName,
          fileName: file.fileName,
          fileType: file.mimeType,
          documentType: file.documentType,
          size: file.fileSize,
          uploadedAt: file.uploadedAt,
          url: `/api/files/${file.id}`,
          downloadUrl: `/api/files/${file.id}/download`,
          previewUrl: `/api/files/${file.id}/preview`
        })),
        message: "Files retrieved successfully"
      })
    } catch (error) {
      logError(error as Error, { endpoint: "/api/upload", operation: "file_listing" })
      return NextResponse.json({ 
        error: "Failed to retrieve files" 
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: "/api/upload", operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
