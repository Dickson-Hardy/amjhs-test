/**
 * Archive Management API Routes
 * Handles volume/issue creation, publication, and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { sql, eq, desc, and, or } from "drizzle-orm"
import { logError, logInfo } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'archive'

    switch (action) {
      case 'volumes':
        return await handleGetVolumes(request)
      
      case 'issues':
        return await handleGetIssues(request)
      
      case 'statistics':
        return await handleGetStatistics(request)
      
      case 'archive':
      default:
        return await handleGetArchive(request)
    }

  } catch (error) {
    logError(error as Error, { context: 'archive-management-api-get' })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has editor or admin role
    if (!['editor', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()

    switch (action) {
      case 'update-article-publication':
        return await handleUpdateArticlePublication(body)
      
      case 'bulk-assign-volume-issue':
        return await handleBulkAssignVolumeIssue(body)
      
      case 'create-volume':
        return await handleCreateVolume(body)
      
      case 'create-issue':
        return await handleCreateIssue(body)
      
      case 'assign-article':
        return await handleAssignArticle(body)
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { context: 'archive-management-api-post' })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle getting volumes
 */
async function handleGetVolumes(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Get distinct volumes from published articles
    const volumesQuery = db.execute(sql`
      SELECT DISTINCT 
        volume,
        COUNT(*) as article_count,
        MIN(published_date) as first_published,
        MAX(published_date) as last_published
      FROM articles 
      WHERE status = 'published' 
      AND volume IS NOT NULL 
      AND volume != ''
      GROUP BY volume
      ORDER BY volume DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const volumes = await volumesQuery

    return NextResponse.json({
      success: true,
      volumes: volumes.map((vol: unknown) => ({
        number: vol.volume,
        articleCount: parseInt(vol.article_count),
        firstPublished: vol.first_published,
        lastPublished: vol.last_published,
        status: 'published'
      }))
    })
  } catch (error) {
    logError(error as Error, { context: 'get-volumes' })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volumes' },
      { status: 500 }
    )
  }
}

/**
 * Handle getting issues for a volume
 */
async function handleGetIssues(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const volumeNumber = searchParams.get('volumeId') || searchParams.get('volume')
  
  if (!volumeNumber) {
    return NextResponse.json(
      { success: false, error: 'Volume number is required' },
      { status: 400 }
    )
  }

  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Get distinct issues for the volume
    const issuesQuery = db.execute(sql`
      SELECT DISTINCT 
        issue,
        COUNT(*) as article_count,
        MIN(published_date) as first_published,
        MAX(published_date) as last_published
      FROM articles 
      WHERE status = 'published' 
      AND volume = ${volumeNumber}
      AND issue IS NOT NULL 
      AND issue != ''
      GROUP BY issue
      ORDER BY issue DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const issues = await issuesQuery

    return NextResponse.json({
      success: true,
      issues: issues.map((issue: unknown) => ({
        number: issue.issue,
        volume: volumeNumber,
        articleCount: parseInt(issue.article_count),
        firstPublished: issue.first_published,
        lastPublished: issue.last_published,
        status: 'published'
      }))
    })
  } catch (error) {
    logError(error as Error, { context: 'get-issues' })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

/**
 * Handle getting archive statistics
 */
async function handleGetStatistics(request: NextRequest) {
  try {
    const [
      totalArticles,
      volumeCount,
      recentActivity
    ] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`),
      db.execute(sql`SELECT COUNT(DISTINCT volume) as count FROM articles WHERE status = 'published' AND volume IS NOT NULL`),
      db.execute(sql`SELECT COUNT(*) as count FROM articles WHERE status = 'published' AND published_date >= NOW() - INTERVAL '30 days'`)
    ])

    const categoryStats = await db.execute(sql`
      SELECT 
        category,
        COUNT(*) as count
      FROM articles 
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `)

    return NextResponse.json({
      success: true,
      statistics: {
        totalArticles: parseInt((totalArticles[0] as unknown)?.count || '0'),
        totalVolumes: parseInt((volumeCount[0] as unknown)?.count || '0'),
        recentPublications: parseInt((recentActivity[0] as unknown)?.count || '0'),
        categoryBreakdown: categoryStats.map(cat => ({
          category: (cat as unknown).category,
          count: parseInt((cat as unknown).count)
        }))
      }
    })
  } catch (error) {
    logError(error as Error, { context: 'get-statistics' })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

/**
 * Handle getting archive with filtering
 */
async function handleGetArchive(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
  const volume = searchParams.get('volume')
  const issue = searchParams.get('issue')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    // Build basic filter conditions
    let conditions = ['status = \'published\'']
    
    if (year) conditions.push(`EXTRACT(YEAR FROM published_date) = ${year}`)
    if (volume) conditions.push(`volume = '${volume}'`)
    if (issue) conditions.push(`issue = '${issue}'`)
    if (category) conditions.push(`category = '${category}'`)
    if (search) conditions.push(`(title ILIKE '%${search}%' OR abstract ILIKE '%${search}%')`)

    const whereClause = conditions.join(' AND ')
    
    // Determine sort order
    let orderBy = 'published_date DESC'
    if (sortBy === 'oldest') orderBy = 'published_date ASC'
    else if (sortBy === 'title') orderBy = 'title ASC'
    else if (sortBy === 'category') orderBy = 'category ASC, published_date DESC'

    // Get articles with pagination
    const articlesResult = await db.execute(sql`
      SELECT 
        id, title, abstract, category, volume, issue, pages,
        published_date, doi, views, downloads,
        (SELECT name FROM users WHERE id = articles.author_id) as author_name
      FROM articles 
      WHERE ${sql.raw(whereClause)}
      ORDER BY ${sql.raw(orderBy)}
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Get total count for pagination
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total 
      FROM articles 
      WHERE ${sql.raw(whereClause)}
    `)

    const total = parseInt((countResult[0] as unknown)?.total || '0')

    return NextResponse.json({
      success: true,
      articles: articlesResult.map((article: unknown) => ({
        id: article.id,
        title: article.title,
        abstract: article.abstract,
        category: article.category,
        volume: article.volume,
        issue: article.issue,
        pages: article.pages,
        publishedDate: article.published_date,
        doi: article.doi,
        views: article.views || 0,
        downloads: article.downloads || 0,
        authorName: article.author_name
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    logError(error as Error, { context: 'get-archive' })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch archive' },
      { status: 500 }
    )
  }
}

/**
 * Handle updating article publication details
 */
async function handleUpdateArticlePublication(data: {
  articleId: string
  volume?: string
  issue?: string
  pages?: string
  publishedDate?: string
}) {
  const { articleId, volume, issue, pages, publishedDate } = data

  if (!articleId) {
    return NextResponse.json(
      { success: false, error: 'Article ID is required' },
      { status: 400 }
    )
  }

  try {
    await db.execute(sql`
      UPDATE articles 
      SET 
        volume = ${volume || null},
        issue = ${issue || null}, 
        pages = ${pages || null},
        published_date = ${publishedDate ? new Date(publishedDate) : null},
        updated_at = NOW()
      WHERE id = ${articleId}
    `)

    return NextResponse.json({
      success: true,
      message: 'Article publication details updated successfully'
    })
  } catch (error) {
    logError(error as Error, { context: 'update-article-publication' })
    return NextResponse.json(
      { success: false, error: 'Failed to update article publication details' },
      { status: 500 }
    )
  }
}

/**
 * Handle creating a new volume (simplified)
 */
async function handleCreateVolume(data: {
  number: string
  year: number
  title?: string
}) {
  const { number, year, title } = data

  if (!number || !year) {
    return NextResponse.json(
      { success: false, error: 'Volume number and year are required' },
      { status: 400 }
    )
  }

  try {
    // Check if volume already exists
    const existingVolume = await db.execute(sql`
      SELECT DISTINCT volume FROM articles WHERE volume = ${number}
    `)

    if (existingVolume.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Volume already exists' },
        { status: 400 }
      )
    }

    // For now, we just return success since volumes are created implicitly
    // when articles are assigned to them
    return NextResponse.json({
      success: true,
      message: `Volume ${number} created for year ${year}`,
      volume: { number, year, title }
    })
  } catch (error) {
    logError(error as Error, { context: 'create-volume' })
    return NextResponse.json(
      { success: false, error: 'Failed to create volume' },
      { status: 500 }
    )
  }
}

/**
 * Handle creating a new issue (simplified)
 */
async function handleCreateIssue(data: {
  volume: string
  number: string
  title?: string
}) {
  const { volume, number, title } = data

  if (!volume || !number) {
    return NextResponse.json(
      { success: false, error: 'Volume and issue number are required' },
      { status: 400 }
    )
  }

  try {
    // Check if issue already exists
    const existingIssue = await db.execute(sql`
      SELECT DISTINCT volume, issue FROM articles 
      WHERE volume = ${volume} AND issue = ${number}
    `)

    if (existingIssue.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Issue already exists' },
        { status: 400 }
      )
    }

    // For now, we just return success since issues are created implicitly
    // when articles are assigned to them
    return NextResponse.json({
      success: true,
      message: `Issue ${number} created for volume ${volume}`,
      issue: { volume, number, title }
    })
  } catch (error) {
    logError(error as Error, { context: 'create-issue' })
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}

/**
 * Handle bulk assignment of volume and issue to multiple articles
 */
async function handleBulkAssignVolumeIssue(data: {
  articleIds: string[]
  volume: string
  issue?: string
}) {
  const { articleIds, volume, issue } = data

  if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Article IDs array is required' },
      { status: 400 }
    )
  }

  if (!volume) {
    return NextResponse.json(
      { success: false, error: 'Volume is required' },
      { status: 400 }
    )
  }

  try {
    const placeholders = articleIds.map((_, index) => `'${articleIds[index]}'`).join(',')
    
    await db.execute(sql.raw(`
      UPDATE articles 
      SET 
        volume = '${volume}',
        issue = ${issue ? `'${issue}'` : 'NULL'},
        updated_at = NOW()
      WHERE id IN (${placeholders})
    `))

    return NextResponse.json({
      success: true,
      message: `Successfully assigned volume/issue to ${articleIds.length} articles`
    })
  } catch (error) {
    logError(error as Error, { context: 'bulk-assign-volume-issue' })
    return NextResponse.json(
      { success: false, error: 'Failed to bulk assign volume/issue' },
      { status: 500 }
    )
  }
}

/**
 * Handle assigning an article to volume/issue
 */
async function handleAssignArticle(data: { 
  articleId: string
  volume: string
  issue?: string 
}) {
  const { articleId, volume, issue } = data

  if (!articleId || !volume) {
    return NextResponse.json(
      { success: false, error: 'Article ID and volume are required' },
      { status: 400 }
    )
  }

  try {
    await db.execute(sql`
      UPDATE articles 
      SET 
        volume = ${volume},
        issue = ${issue || null},
        updated_at = NOW()
      WHERE id = ${articleId}
    `)

    return NextResponse.json({
      success: true,
      message: `Article assigned to volume ${volume}${issue ? `, issue ${issue}` : ''}`
    })
  } catch (error) {
    logError(error as Error, { context: 'assign-article' })
    return NextResponse.json(
      { success: false, error: 'Failed to assign article' },
      { status: 500 }
    )
  }
}
