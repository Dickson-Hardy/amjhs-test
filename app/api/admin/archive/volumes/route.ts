import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { volumes, issues } from "@/lib/db/schema"
import { desc, eq, and } from "drizzle-orm"
import { logAdminAction } from "@/lib/admin-logger"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    // Get all volumes with their issues
    const allVolumes = await db
      .select({
        id: volumes.id,
        number: volumes.number,
        title: volumes.title,
        year: volumes.year,
        description: volumes.description,
        status: volumes.status,
        createdAt: volumes.createdAt,
        updatedAt: volumes.updatedAt
      })
      .from(volumes)
      .orderBy(desc(volumes.year), desc(volumes.number))

    // Get issues for each volume
    const volumesWithIssues = await Promise.all(
      allVolumes.map(async (volume) => {
        const volumeIssues = await db
          .select()
          .from(issues)
          .where(eq(issues.volumeId, volume.id))
          .orderBy(desc(issues.number))

        return {
          ...volume,
          issues: volumeIssues
        }
      })
    )

    return NextResponse.json({
      volumes: volumesWithIssues
    })

  } catch (error) {
    logger.error("Error fetching volumes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { number, title, year, description } = await request.json()

    // Validate input
    if (!number || !year) {
      return NextResponse.json(
        { error: "Volume number and year are required" },
        { status: 400 }
      )
    }

    // Check if volume already exists
    const existingVolume = await db
      .select()
      .from(volumes)
      .where(and(eq(volumes.number, number), eq(volumes.year, year)))
      .limit(1)

    if (existingVolume.length > 0) {
      return NextResponse.json(
        { error: "Volume with this number and year already exists" },
        { status: 400 }
      )
    }

    // Create new volume
    const newVolume = await db
      .insert(volumes)
      .values({
        number,
        title: title || `Volume ${number}`,
        year,
        description: description || "",
        status: "draft"
      })
      .returning()

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'CREATE_VOLUME',
      resourceType: 'volume',
      resourceId: newVolume[0].id,
      details: `Created volume ${number} (${year}) - ${title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      volume: newVolume[0],
      message: `Volume ${number} created successfully`
    })

  } catch (error) {
    logger.error("Error creating volume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
