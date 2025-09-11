import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { volumes, articles, submissions } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-logger'
import { DOIGenerator } from '@/lib/doi'
import { logger } from '@/lib/logger'

/**
 * POST /api/admin/volumes/[id]/articles
 * Assign articles to a volume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { id: volumeId } = await params
    const body = await request.json()
    const { articleIds, assignmentMode = 'assign', generateDOIs = true } = body

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: "Article IDs array is required" },
        { status: 400 }
      )
    }

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

    if (volumeData.status === 'published' && assignmentMode === 'assign') {
      return NextResponse.json(
        { error: "Cannot assign articles to published volume" },
        { status: 400 }
      )
    }

    // Validate all articles exist and are in acceptable status
    const articlesToAssign = await db
      .select()
      .from(articles)
      .where(sql`${articles.id} = ANY(${articleIds})`)

    if (articlesToAssign.length !== articleIds.length) {
      return NextResponse.json(
        { error: "Some articles not found" },
        { status: 404 }
      )
    }

    // Check article statuses
    const invalidArticles = articlesToAssign.filter(article => 
      !['accepted', 'ready_for_publication'].includes(article.status)
    )

    if (invalidArticles.length > 0) {
      return NextResponse.json(
        { error: `${invalidArticles.length} articles are not in acceptable status for assignment` },
        { status: 400 }
      )
    }

    // Begin transaction to assign articles
    const results = await db.transaction(async (tx) => {
      const assignmentResults = []

      for (const article of articlesToAssign) {
        const updateData: any = {
          volume: volumeData.number,
          issue: null, // Volume-only assignment
          updatedAt: new Date()
        }

        // Generate DOI if requested and not already present
        if (generateDOIs && !article.doi) {
          try {
            const doi = DOIGenerator.generateDOI({
              year: volumeData.year,
              volume: volumeData.number,
              issue: '1', // Default issue for volume-only publication
              articleNumber: 1 // This should be incremented based on article order
            })
            updateData.doi = doi
            updateData.doiRegistered = false // Will be registered later
            updateData.doiRegisteredAt = null
          } catch (error) {
            logger.warn(`Failed to generate DOI for article ${article.id}`, { error })
          }
        }

        // Update article
        const updatedArticle = await tx
          .update(articles)
          .set(updateData)
          .where(eq(articles.id, article.id))
          .returning()

        assignmentResults.push({
          articleId: article.id,
          title: article.title,
          doi: updateData.doi || article.doi,
          status: 'assigned'
        })
      }

      return assignmentResults
    })

    // Log the bulk assignment action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'BULK_ASSIGN_ARTICLES_TO_VOLUME',
      resourceType: 'volume',
      resourceId: volumeId,
      details: `Assigned ${articleIds.length} articles to volume ${volumeData.number} (${volumeData.year})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Get updated volume with article count
    const updatedVolumeInfo = await db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        status: volumes.status,
        articleCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text
        )`
      })
      .from(volumes)
      .where(eq(volumes.id, volumeId))
      .limit(1)

    return NextResponse.json({
      success: true,
      volume: updatedVolumeInfo[0],
      assignedArticles: results,
      message: `${articleIds.length} articles assigned to volume ${volumeData.number} successfully`
    })

  } catch (error) {
    logger.error("Error assigning articles to volume", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/volumes/[id]/articles
 * Get all articles in a volume
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { id: volumeId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeMetadata = searchParams.get('includeMetadata') === 'true'

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

    // Build query for articles in this volume
    let whereConditions = [eq(articles.volume, volumeData.number)]
    
    // Apply status filter if provided
    if (status) {
      whereConditions.push(eq(articles.status, status))
    }

    const volumeArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        keywords: articles.keywords,
        category: articles.category,
        status: articles.status,
        doi: articles.doi,
        doiRegistered: articles.doiRegistered,
        volume: articles.volume,
        issue: articles.issue,
        pages: articles.pages,
        publishedDate: articles.publishedDate,
        submittedDate: articles.submittedDate,
        authorId: articles.authorId,
        coAuthors: articles.coAuthors,
        views: articles.views,
        downloads: articles.downloads,
        citations: articles.citations,
        ...(includeMetadata ? { 
          metadata: articles.metadata,
          files: articles.files 
        } : {}),
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt
      })
      .from(articles)
      .where(and(...whereConditions))
      .orderBy(articles.submittedDate)

    // Calculate statistics
    const statistics = {
      totalArticles: volumeArticles.length,
      publishedArticles: volumeArticles.filter(a => a.status === 'published').length,
      acceptedArticles: volumeArticles.filter(a => a.status === 'accepted').length,
      draftArticles: volumeArticles.filter(a => a.status === 'draft').length,
      totalViews: volumeArticles.reduce((sum, a) => sum + (a.views || 0), 0),
      totalDownloads: volumeArticles.reduce((sum, a) => sum + (a.downloads || 0), 0),
      articlesWithDOI: volumeArticles.filter(a => a.doi).length
    }

    return NextResponse.json({
      success: true,
      volume: volumeData,
      articles: volumeArticles,
      statistics,
      publicUrl: volumeData.status === 'published' ? `/archive/volume/${volumeData.number}` : null
    })

  } catch (error) {
    logger.error("Error fetching volume articles", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/volumes/[id]/articles
 * Update article assignments in a volume (reorder, update pages, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { id: volumeId } = await params
    const body = await request.json()
    const { articleUpdates } = body

    if (!articleUpdates || !Array.isArray(articleUpdates)) {
      return NextResponse.json(
        { error: "Article updates array is required" },
        { status: 400 }
      )
    }

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

    // Update articles in transaction
    const results = await db.transaction(async (tx) => {
      const updateResults = []

      for (const update of articleUpdates) {
        const { articleId, pages, order, metadata } = update

        if (!articleId) continue

        const updateData: any = {
          updatedAt: new Date()
        }

        if (pages) updateData.pages = pages
        if (metadata) updateData.metadata = metadata

        const updatedArticle = await tx
          .update(articles)
          .set(updateData)
          .where(and(
            eq(articles.id, articleId),
            eq(articles.volume, volumeData.number)
          ))
          .returning()

        if (updatedArticle.length > 0) {
          updateResults.push({
            articleId,
            updated: true,
            changes: updateData
          })
        }
      }

      return updateResults
    })

    // Log the bulk update action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'UPDATE_VOLUME_ARTICLES',
      resourceType: 'volume',
      resourceId: volumeId,
      details: `Updated ${results.length} articles in volume ${volumeData.number}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      updatedArticles: results,
      message: `${results.length} articles updated successfully`
    })

  } catch (error) {
    logger.error("Error updating volume articles", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}