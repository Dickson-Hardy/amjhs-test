import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { writeFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { advertisements, adminLogs } from "@/lib/db/schema"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { logError } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `ad_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Cloudinary instead of local storage
    const uploadResult = await uploadToCloudinary(
      buffer,
      filename,
      'advertisements',
      'image'
    ) as any
    
    // Save advertisement details to database
    const advertisementData = await saveAdvertisementToDatabase({
      filename,
      originalName: file.name,
      size: file.size,
      uploadedBy: session.user?.id || '',
      filePath: uploadResult.secure_url
    })
    
    // Log the upload action
    await logAdvertisementUpload(session.user?.id || '', session.user?.email || '', advertisementData)
    
    return NextResponse.json({
      success: true,
      message: "Advertisement uploaded successfully",
      filename,
      url: uploadResult.secure_url,
      id: advertisementData.id
    })
    
  } catch (error) {
    logger.error("Error uploading advertisement:", error)
    return NextResponse.json(
      { error: "Failed to upload advertisement" },
      { status: 500 }
    )
  }
}

async function saveAdvertisementToDatabase(adData: {
  filename: string;
  originalName: string;
  size: number;
  uploadedBy: string;
  filePath: string;
}) {
  try {
    // Save advertisement to database
    const advertisement = await db.insert(advertisements).values({
      title: adData.originalName.replace(/\.[^/.]+$/, ""), // Remove extension
      imageUrl: adData.filePath,
      position: 'sidebar-top', // Default position
      isActive: false, // Requires admin activation
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBy: adData.uploadedBy,
    }).returning()

    return advertisement[0]
  } catch (error) {
    logError(error as Error, { context: 'saveAdvertisementToDatabase' })
    throw new Error('Failed to save advertisement to database')
  }
}

async function logAdvertisementUpload(adminId: string, adminEmail: string, adData: any) {
  try {
    // Log the action to admin logs table
    await db.insert(adminLogs).values({
      id: uuidv4(),
      adminId: adminId,
      adminEmail: adminEmail,
      action: 'ADVERTISEMENT_UPLOADED',
      resourceType: 'advertisement',
      resourceId: adData.id,
      details: `Uploaded advertisement: ${adData.title} (${adData.filename})`,
      ipAddress: 'unknown', // Could extract from request headers
      userAgent: 'unknown', // Could extract from request headers
    })
  } catch (error) {
    logError(error as Error, { context: 'logAdvertisementUpload' })
  }
}
