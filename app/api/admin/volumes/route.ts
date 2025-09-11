import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { volumes, articles } from '@/lib/db/schema'
import { eq, desc, and, count, sql } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-logger'
import { DOIGenerator } from '@/lib/doi'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/volumes
 * Fetch all volumes with article counts and metadata
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const includeStats = searchParams.get('includeStats') === 'true'

    // Build the query
    let query = db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        description: volumes.description,
        coverImage: volumes.coverImage,
        publishedDate: volumes.publishedDate,
        status: volumes.status,
        metadata: volumes.metadata,
        createdAt: volumes.createdAt,
        updatedAt: volumes.updatedAt,
        // Count articles in this volume
        articleCount: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text
        ), 0)`,
        // Count published articles
        publishedCount: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text 
          AND ${articles.status} = 'published'
        ), 0)`
      })
      .from(volumes)

    // Apply filters
    const conditions = []
    if (status) {
      conditions.push(eq(volumes.status, status))
    }
    if (year) {
      conditions.push(eq(volumes.year, parseInt(year)))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Order by year and volume number
    query = query.orderBy(desc(volumes.year), desc(volumes.number))

    const volumeList = await query

    let response: any = {
      success: true,
      volumes: volumeList
    }

    // Include additional statistics if requested
    if (includeStats) {
      const stats = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT v.id) as total_volumes,
          COUNT(DISTINCT a.id) as total_articles,
          COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_articles,
          MIN(v.year) as earliest_year,
          MAX(v.year) as latest_year
        FROM ${volumes} v
        LEFT JOIN ${articles} a ON a.volume = v.number::text
      `)

      response.statistics = stats[0]
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error("Error fetching volumes:", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/volumes
 * Create a new volume
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { number, year, title, description, coverImage, metadata = {} } = body

    // Validation
    if (!number || !year) {
      return NextResponse.json(
        { error: "Volume number and year are required" },
        { status: 400 }
      )
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid year provided" },
        { status: 400 }
      )
    }

    // Check if volume already exists
    const existingVolume = await db
      .select()
      .from(volumes)
      .where(and(
        eq(volumes.number, number),
        eq(volumes.year, year)
      ))
      .limit(1)

    if (existingVolume.length > 0) {
      const existing = existingVolume[0]
      
      // If it's a draft, we can update it instead of creating new
      if (existing.status === 'draft') {
        const updatedVolume = await db
          .update(volumes)
          .set({
            title: title || existing.title,
            description: description || existing.description,
            coverImage: coverImage || existing.coverImage,
            metadata: {
              ...existing.metadata,
              ...metadata,
              updatedBy: session.user.id,
              updatedByEmail: session.user.email
            },
            updatedAt: new Date()
          })
          .where(eq(volumes.id, existing.id))
          .returning()

        // Log the action
        await logAdminAction({
          adminId: session.user.id!,
          adminEmail: session.user.email!,
          action: 'UPDATE_VOLUME',
          resourceType: 'volume',
          resourceId: existing.id,
          details: `Updated draft volume ${number} for year ${year}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        })

        return NextResponse.json({
          success: true,
          volume: updatedVolume[0],
          message: `Updated existing draft volume ${number} for year ${year}`
        })
      } else {
        return NextResponse.json(
          { 
            error: `Volume ${number} for year ${year} already exists with status: ${existing.status}`,
            existingVolume: {
              id: existing.id,
              number: existing.number,
              year: existing.year,
              title: existing.title,
              status: existing.status
            }
          },
          { status: 409 } // 409 Conflict instead of 400
        )
      }
    }

    // Create the volume
    const newVolume = await db
      .insert(volumes)
      .values({
        number,
        year,
        title: title || `Volume ${number}`,
        description: description || `Volume ${number} - ${year}`,
        coverImage,
        status: 'draft',
        metadata: {
          ...metadata,
          createdBy: session.user.id,
          createdByEmail: session.user.email
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    // Log the action
    try {
      await logAdminAction({
        adminId: session.user.id!,
        adminEmail: session.user.email!,
        action: 'CREATE_VOLUME',
        resourceType: 'volume',
        resourceId: newVolume[0].id,
        details: `Created volume ${number} for year ${year}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (logError) {
      // Log the logging error but don't fail the whole operation
      logger.warn("Failed to log admin action:", { error: logError })
    }

    return NextResponse.json({
      success: true,
      volume: newVolume[0],
      message: `Volume ${number} created successfully`
    })

  } catch (error) {
    logger.error("Error creating volume:", { 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })
    
    return NextResponse.json(
      { 
        error: "Failed to create volume",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/volumes
 * Update an existing volume
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, title, description, coverImage, metadata = {} } = body

    if (!id) {
      return NextResponse.json(
        { error: "Volume ID is required" },
        { status: 400 }
      )
    }

    // Check if volume exists
    const existingVolume = await db
      .select()
      .from(volumes)
      .where(eq(volumes.id, id))
      .limit(1)

    if (existingVolume.length === 0) {
      return NextResponse.json(
        { error: "Volume not found" },
        { status: 404 }
      )
    }

    // Update the volume
    const updatedVolume = await db
      .update(volumes)
      .set({
        title,
        description,
        coverImage,
        metadata: {
          ...existingVolume[0].metadata,
          ...metadata,
          updatedBy: session.user.id,
          updatedByEmail: session.user.email
        },
        updatedAt: new Date()
      })
      .where(eq(volumes.id, id))
      .returning()

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'UPDATE_VOLUME',
      resourceType: 'volume',
      resourceId: id,
      details: `Updated volume ${existingVolume[0].number} (${existingVolume[0].year})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      volume: updatedVolume[0],
      message: "Volume updated successfully"
    })

  } catch (error) {
    logger.error("Error updating volume:", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}