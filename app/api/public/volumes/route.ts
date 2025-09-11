import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { volumes, articles } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

/**
 * GET /api/public/volumes
 * Get all published volumes for public archive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const includeArticles = searchParams.get('includeArticles') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build base query for published volumes
    let query = db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        description: volumes.description,
        coverImage: volumes.coverImage,
        publishedDate: volumes.publishedDate,
        metadata: volumes.metadata,
        // Count published articles in each volume
        articleCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text 
          AND ${articles.status} = 'published'
        )`,
        // Get total views for volume
        totalViews: sql<number>`COALESCE((
          SELECT SUM(${articles.views}) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text 
          AND ${articles.status} = 'published'
        ), 0)`,
        // Get total downloads for volume
        totalDownloads: sql<number>`COALESCE((
          SELECT SUM(${articles.downloads}) 
          FROM ${articles} 
          WHERE ${articles.volume} = ${volumes.number}::text 
          AND ${articles.status} = 'published'
        ), 0)`
      })
      .from(volumes)
      .where(eq(volumes.status, 'published'))

    // Apply year filter if provided
    if (year) {
      query = query.where(and(
        eq(volumes.status, 'published'),
        eq(volumes.year, parseInt(year))
      ))
    }

    // Order by year and volume number (newest first)
    query = query.orderBy(desc(volumes.year), desc(volumes.number))

    // Apply pagination
    if (limit > 0) {
      query = query.limit(limit)
      if (offset > 0) {
        query = query.offset(offset)
      }
    }

    const publishedVolumes = await query

    // Get overall statistics
    const overallStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT v.id) as total_volumes,
        COUNT(DISTINCT a.id) as total_articles,
        MIN(v.year) as earliest_year,
        MAX(v.year) as latest_year,
        SUM(a.views) as total_views,
        SUM(a.downloads) as total_downloads,
        COUNT(DISTINCT a.category) as total_categories
      FROM ${volumes} v
      LEFT JOIN ${articles} a ON a.volume = v.number::text AND a.status = 'published'
      WHERE v.status = 'published'
    `)

    // Format response data
    const formattedVolumes = await Promise.all(
      publishedVolumes.map(async (volume) => {
        const baseVolume = {
          number: volume.number,
          year: volume.year,
          title: volume.title,
          description: volume.description,
          coverImage: volume.coverImage,
          publishedDate: volume.publishedDate,
          articleCount: Number(volume.articleCount),
          totalViews: Number(volume.totalViews),
          totalDownloads: Number(volume.totalDownloads),
          publicUrl: `/archive/volume/${volume.number}`,
          apiUrl: `/api/public/volumes/${volume.number}`
        }

        // Include articles if requested
        if (includeArticles && volume.articleCount > 0) {
          const volumeArticles = await db
            .select({
              id: articles.id,
              title: articles.title,
              abstract: articles.abstract,
              category: articles.category,
              doi: articles.doi,
              pages: articles.pages,
              publishedDate: articles.publishedDate,
              coAuthors: articles.coAuthors,
              views: articles.views,
              downloads: articles.downloads,
              citations: articles.citations
            })
            .from(articles)
            .where(and(
              eq(articles.volume, volume.number),
              eq(articles.status, 'published')
            ))
            .orderBy(articles.publishedDate, articles.submittedDate)
            .limit(10) // Limit to prevent large responses

          return {
            ...baseVolume,
            articles: volumeArticles.map(article => ({
              id: article.id,
              title: article.title,
              abstract: article.abstract?.substring(0, 200) + '...',
              category: article.category,
              doi: article.doi,
              pages: article.pages,
              publishedDate: article.publishedDate,
              authors: formatAuthors(article.coAuthors || []),
              views: article.views || 0,
              downloads: article.downloads || 0,
              citations: article.citations || 0,
              publicUrl: `/article/${article.id}`
            }))
          }
        }

        return baseVolume
      })
    )

    // Get year-wise publication statistics
    const yearStats = await db.execute(sql`
      SELECT 
        v.year,
        COUNT(DISTINCT v.id) as volume_count,
        COUNT(DISTINCT a.id) as article_count,
        SUM(a.views) as total_views,
        SUM(a.downloads) as total_downloads
      FROM ${volumes} v
      LEFT JOIN ${articles} a ON a.volume = v.number::text AND a.status = 'published'
      WHERE v.status = 'published'
      GROUP BY v.year
      ORDER BY v.year DESC
    `)

    // Get category distribution
    const categoryStats = await db.execute(sql`
      SELECT 
        a.category,
        COUNT(*) as article_count,
        COUNT(DISTINCT a.volume) as volume_count
      FROM ${articles} a
      JOIN ${volumes} v ON v.number::text = a.volume AND v.status = 'published'
      WHERE a.status = 'published'
      GROUP BY a.category
      ORDER BY article_count DESC
    `)

    return NextResponse.json({
      success: true,
      volumes: formattedVolumes,
      statistics: {
        overview: overallStats[0],
        byYear: yearStats,
        byCategory: categoryStats
      },
      pagination: {
        limit,
        offset,
        total: formattedVolumes.length,
        hasMore: formattedVolumes.length === limit
      },
      meta: {
        generatedAt: new Date().toISOString(),
        includeArticles,
        filters: { year }
      }
    })

  } catch (error) {
    console.error("Error fetching public volumes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Helper function to format authors array
 */
function formatAuthors(coAuthors: any[]): string[] {
  if (!Array.isArray(coAuthors)) return []
  
  return coAuthors.map(author => {
    if (typeof author === 'string') return author
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`
    }
    return author.name || 'Unknown Author'
  })
}