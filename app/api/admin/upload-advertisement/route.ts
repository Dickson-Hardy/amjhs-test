import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { writeFile } from "fs/promises"
import path from "path"

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
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'advertisements', filename)

    // Save file
    await writeFile(uploadPath, buffer)
    
    // Save advertisement details to database
    const advertisementData = await saveAdvertisementToDatabase({
      filename,
      originalName: file.name,
      size: file.size,
      uploadedBy: session.user?.email || '',
      filePath: `/uploads/advertisements/${filename}`
    })
    
    // Log the upload action
    await logAdvertisementUpload(session.user?.email || '', advertisementData)
    
    return NextResponse.json({
      success: true,
      message: "Advertisement uploaded successfully",
      filename,
      url: `/uploads/advertisements/${filename}`
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
    // In a real implementation, save to your database:
    // const advertisement = await prisma.advertisement.create({
    //   data: {
    //     title: adData.originalName.replace(/\.[^/.]+$/, ""), // Remove extension
    //     filename: adData.filename,
    //     originalName: adData.originalName,
    //     filePath: adData.filePath,
    //     fileSize: adData.size,
    //     uploadedBy: adData.uploadedBy,
    //     position: 'sidebar-top', // Default position
    //     isActive: false, // Requires admin activation
    //     expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // })
    
    const advertisement = {
      id: Date.now().toString(),
      ...adData,
      uploadDate: new Date().toISOString(),
      isActive: false,
      position: 'sidebar-top',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    logger.error("Advertisement saved to database:", advertisement)
    return advertisement
  } catch (error) {
    logger.error('Error saving advertisement to database:', error)
    throw new AppError('Failed to save advertisement to database')
  }
}

async function logAdvertisementUpload(adminEmail: string, adData: unknown) {
  try {
    // In a real implementation, log the action:
    // await prisma.adminLog.create({
    //   data: {
    //     action: 'ADVERTISEMENT_UPLOADED',
    //     performedBy: adminEmail,
    //     details: `Uploaded advertisement: ${adData.originalName} (${adData.filename})`,
    //     relatedId: adData.id,
    //     timestamp: new Date()
    //   }
    // })
    
    logger.error(`Advertisement upload logged by ${adminEmail}: ${adData.filename}`)
  } catch (error) {
    logger.error('Error logging advertisement upload:', error)
  }
}
