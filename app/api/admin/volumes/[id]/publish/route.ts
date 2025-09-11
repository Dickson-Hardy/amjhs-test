import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { volumes, articles } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-logger'
import { logger } from '@/lib/logger'

/**
 * PUT /api/admin/volumes/[id]/publish
 * Publish a volume (making all its articles publicly accessible)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const volumeId = params.id

    // Check if volume exists
    const volume = await db
      .select()
      .from(volumes)
      .where(eq(volumes.id, volumeId))
      .limit(1)

    if (volume.length === 0) {
      return NextResponse.json(
        { error: "Volume not found" },
        { status: 404 }
      )
    }

    const volumeData = volume[0]

    if (volumeData.status === 'published') {
      return NextResponse.json(
        { error: "Volume is already published" },
        { status: 400 }
      )
    }

    // Check if volume has articles
    const volumeArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.volume, volumeData.number))

    if (volumeArticles.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish volume without articles" },
        { status: 400 }
      )
    }

    // Check for articles that don't have required publication metadata
    const incompleteArticles = volumeArticles.filter(article => 
      !article.title || 
      !article.abstract || 
      !article.doi ||
      article.status !== 'accepted'
    )

    if (incompleteArticles.length > 0) {
      return NextResponse.json(
        { error: `${incompleteArticles.length} articles lack required metadata or are not in 'accepted' status` },
        { status: 400 }
      )
    }

    // Begin transaction to publish volume and all its articles
    await db.transaction(async (tx) => {
      // Update volume status to published
      await tx
        .update(volumes)
        .set({
          status: 'published',
          publishedDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(volumes.id, volumeId))

      // Update all articles in this volume to published status
      await tx
        .update(articles)
        .set({
          status: 'published',
          publishedDate: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(articles.volume, volumeData.number),
          eq(articles.status, 'accepted')
        ))
    })

    // Get updated volume data with article count
    const publishedVolume = await db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        description: volumes.description,
        publishedDate: volumes.publishedDate,
        status: volumes.status,
        articleCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text 
          AND ${articles.status} = 'published'
        )`
      })
      .from(volumes)
      .where(eq(volumes.id, volumeId))
      .limit(1)

    // Log the publication action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'PUBLISH_VOLUME',
      resourceType: 'volume',
      resourceId: volumeId,
      details: `Published volume ${volumeData.number} (${volumeData.year}) with ${volumeArticles.length} articles`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      volume: publishedVolume[0],
      articlesPublished: volumeArticles.length,
      message: `Volume ${volumeData.number} published successfully with ${volumeArticles.length} articles`,
      publicUrl: `/archive/volume/${volumeData.number}`
    })

  } catch (error) {
    logger.error("Error publishing volume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/volumes/[id]/publish
 * Unpublish a volume (revert to draft status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const volumeId = params.id

    // Check if volume exists
    const volume = await db
      .select()
      .from(volumes)
      .where(eq(volumes.id, volumeId))
      .limit(1)

    if (volume.length === 0) {
      return NextResponse.json(
        { error: "Volume not found" },
        { status: 404 }
      )
    }

    const volumeData = volume[0]

    if (volumeData.status !== 'published') {
      return NextResponse.json(
        { error: "Volume is not currently published" },
        { status: 400 }
      )
    }

    // Begin transaction to unpublish volume and all its articles
    await db.transaction(async (tx) => {
      // Update volume status to draft
      await tx
        .update(volumes)
        .set({
          status: 'draft',
          publishedDate: null,
          updatedAt: new Date()
        })
        .where(eq(volumes.id, volumeId))

      // Update all published articles in this volume back to accepted status
      await tx
        .update(articles)
        .set({
          status: 'accepted',
          publishedDate: null,
          updatedAt: new Date()
        })
        .where(and(
          eq(articles.volume, volumeData.number),
          eq(articles.status, 'published')
        ))
    })

    // Log the unpublish action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'UNPUBLISH_VOLUME',
      resourceType: 'volume',
      resourceId: volumeId,
      details: `Unpublished volume ${volumeData.number} (${volumeData.year})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: `Volume ${volumeData.number} unpublished successfully`
    })

  } catch (error) {
    logger.error("Error unpublishing volume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}