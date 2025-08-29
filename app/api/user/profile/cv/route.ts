import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userDocuments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logError } from "@/lib/logger"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('cv') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 10MB." 
      }, { status: 400 })
    }

    // Create user upload directory
    const uploadDir = join(process.cwd(), 'uploads', 'cvs', session.user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `cv_${timestamp}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save file metadata to database
    try {
      // Mark previous CV files as inactive
      await db
        .update(userDocuments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(userDocuments.userId, session.user.id),
          eq(userDocuments.documentType, 'cv'),
          eq(userDocuments.isActive, true)
        ))

      // Insert new CV record
      const newDocument = await db
        .insert(userDocuments)
        .values({
          userId: session.user.id,
          documentType: 'cv',
          fileName: fileName,
          originalName: file.name,
          filePath: filePath,
          fileSize: file.size,
          mimeType: file.type,
          isActive: true,
          uploadedAt: new Date(),
          updatedAt: new Date()
        })
        .returning({
          id: userDocuments.id,
          fileName: userDocuments.fileName,
          originalName: userDocuments.originalName,
          fileSize: userDocuments.fileSize,
          uploadedAt: userDocuments.uploadedAt
        })

      logger.error(`CV uploaded successfully for user ${session.user.id}: ${fileName}`)
    } catch (dbError) {
      logger.error('Failed to save CV metadata to database:', dbError)
      // File was saved but metadata failed - still return success
    }

    return NextResponse.json({
      success: true,
      message: "CV uploaded successfully",
      fileName: fileName,
      fileSize: file.size,
      uploadDate: new Date().toISOString()
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/profile/cv`, action: 'upload' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to upload CV" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    
    // If fileName is provided, serve the file for download
    if (fileName) {
      const filePath = join(process.cwd(), 'uploads', 'cvs', session.user.id, fileName)
      
      // Verify file exists and belongs to user
      const fileRecord = await db
        .select({
          id: userDocuments.id,
          fileName: userDocuments.fileName,
          originalName: userDocuments.originalName,
          mimeType: userDocuments.mimeType,
        })
        .from(userDocuments)
        .where(and(
          eq(userDocuments.userId, session.user.id),
          eq(userDocuments.fileName, fileName),
          eq(userDocuments.documentType, 'cv'),
          eq(userDocuments.isActive, true)
        ))
        .limit(1)
      
      if (fileRecord.length === 0) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
      
      // Check if physical file exists
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
      }
      
      // Read and serve the file
      const { readFile } = await import('fs/promises')
      const fileBuffer = await readFile(filePath)
      
      // Create response with proper buffer handling - convert Buffer to Uint8Array
      const response = new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': fileRecord[0].mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileRecord[0].originalName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
      
      return response
    }

    // Get user's uploaded CV files (list view)
    const cvFiles = await db
      .select({
        id: userDocuments.id,
        fileName: userDocuments.fileName,
        originalName: userDocuments.originalName,
        fileSize: userDocuments.fileSize,
        mimeType: userDocuments.mimeType,
        uploadedAt: userDocuments.uploadedAt,
        isActive: userDocuments.isActive
      })
      .from(userDocuments)
      .where(and(
        eq(userDocuments.userId, session.user.id),
        eq(userDocuments.documentType, 'cv'),
        eq(userDocuments.isActive, true)
      ))
      .orderBy(userDocuments.uploadedAt)
    
    return NextResponse.json({
      success: true,
      files: cvFiles
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/profile/cv`, action: 'get' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to retrieve CV files" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')
    
    if (!fileId) {
      return NextResponse.json({ error: "No file ID specified" }, { status: 400 })
    }

    // Mark file as inactive in database
    const result = await db
      .update(userDocuments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(userDocuments.id, fileId),
        eq(userDocuments.userId, session.user.id),
        eq(userDocuments.documentType, 'cv'),
        eq(userDocuments.isActive, true)
      ))
      .returning({
        id: userDocuments.id,
        fileName: userDocuments.fileName,
        filePath: userDocuments.filePath
      })

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found or already deleted" }, { status: 404 })
    }

    // Optionally delete physical file from filesystem
    // In production, implement proper file cleanup with error handling
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      if (result[0].filePath) {
        const fullPath = path.join(process.cwd(), 'uploads', result[0].filePath);
        await fs.unlink(fullPath).catch(() => {
          // File may not exist, ignore error
          logger.error(`File not found for deletion: ${fullPath}`);
        });
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }
    
    return NextResponse.json({
      success: true,
      message: "CV deleted successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/profile/cv`, action: 'delete' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete CV" 
    }, { status: 500 })
  }
}
