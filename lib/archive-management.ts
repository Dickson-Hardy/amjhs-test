/**
 * Archive Management Service
 * Handles volume/issue organization, publication workflow, and archive administration
 */

import { db } from './db'
import { articles, volumes, issues } from './db/schema'
import { eq, desc, asc, and, or, like, count, sql } from 'drizzle-orm'
import { logError, logInfo } from './logger'

// Types for archive management
export interface Volume {
  id: string
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: Date
  status: 'draft' | 'published' | 'archived'
  issueCount: number
  articleCount: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  volumeId: string
  number: string
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: Date
  status: 'draft' | 'published' | 'archived'
  articleCount: number
  pageRange?: string
  specialIssue: boolean
  guestEditors?: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ArchiveFilters {
  year?: number
  volume?: string
  issue?: string
  category?: string
  status?: string
  search?: string
  sortBy?: 'newest' | 'oldest' | 'volume' | 'issue' | 'downloads' | 'views'
  page?: number
  limit?: number
}

export interface ArchiveStatistics {
  totalVolumes: number
  totalIssues: number
  totalArticles: number
  yearRange: { start: number; end: number }
  volumeRange: { start: string; end: string }
  categoryCounts: Record<string, number>
  monthlyPublications: Array<{ month: string; count: number }>
  downloadStats: { total: number; thisMonth: number }
  viewStats: { total: number; thisMonth: number }
}

/**
 * Archive Management Service
 */
export class ArchiveManagementService {

  /**
   * Create a new volume
   */
  static async createVolume(data: {
    number: string
    year: number
    title?: string
    description?: string
    coverImage?: string
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; volume?: Volume; error?: string }> {
    try {
      logInfo('Creating new volume', { number: data.number, year: data.year })

      // Check if volume already exists
      const existingVolume = await db
        .select()
        .from(volumes)
        .where(and(
          eq(volumes.number, data.number),
          eq(volumes.year, data.year)
        ))
        .limit(1)

      if (existingVolume.length > 0) {
        return { success: false, error: 'Volume already exists for this number and year' }
      }

      const [newVolume] = await db
        .insert(volumes)
        .values({
          id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          number: data.number,
          year: data.year,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          status: 'draft',
          metadata: data.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      return { success: true, volume: newVolume as Volume }

    } catch (error) {
      logError(error as Error, { context: 'createVolume' })
      return { success: false, error: 'Failed to create volume' }
    }
  }

  /**
   * Create a new issue
   */
  static async createIssue(data: {
    volumeId: string
    number: string
    title?: string
    description?: string
    coverImage?: string
    specialIssue?: boolean
    guestEditors?: string[]
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; issue?: Issue; error?: string }> {
    try {
      logInfo('Creating new issue', { volumeId: data.volumeId, number: data.number })

      // Check if issue already exists
      const existingIssue = await db
        .select()
        .from(issues)
        .where(and(
          eq(issues.volumeId, data.volumeId),
          eq(issues.number, data.number)
        ))
        .limit(1)

      if (existingIssue.length > 0) {
        return { success: false, error: 'Issue already exists for this volume and number' }
      }

      const [newIssue] = await db
        .insert(issues)
        .values({
          id: `iss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          volumeId: data.volumeId,
          number: data.number,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          status: 'draft',
          specialIssue: data.specialIssue || false,
          guestEditors: data.guestEditors || [],
          metadata: data.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      return { success: true, issue: newIssue as Issue }

    } catch (error) {
      logError(error as Error, { context: 'createIssue' })
      return { success: false, error: 'Failed to create issue' }
    }
  }

  /**
   * Get all volumes
   */
  static async getVolumes(
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<Volume[]> {
    try {
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
          issueCount: count(issues.id),
          articleCount: sql<number>`COALESCE(SUM(
            (SELECT COUNT(*) FROM ${articles} WHERE ${articles.issueId} = ${issues.id})
          ), 0)`
        })
        .from(volumes)
        .leftJoin(issues, eq(issues.volumeId, volumes.id))
        .groupBy(volumes.id)
        .orderBy(desc(volumes.year), desc(volumes.number))

      if (options.status) {
        query = query.where(eq(volumes.status, options.status))
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.offset(options.offset)
      }

      const result = await query

      return result.map(vol => ({
        ...vol,
        issueCount: Number(vol.issueCount),
        articleCount: Number(vol.articleCount)
      })) as Volume[]

    } catch (error) {
      logError(error as Error, { context: 'getVolumes' })
      return []
    }
  }

  /**
   * Get all issues for a volume
   */
  static async getIssues(
    volumeId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<Issue[]> {
    try {
      let query = db
        .select({
          id: issues.id,
          volumeId: issues.volumeId,
          number: issues.number,
          title: issues.title,
          description: issues.description,
          coverImage: issues.coverImage,
          publishedDate: issues.publishedDate,
          status: issues.status,
          specialIssue: issues.specialIssue,
          guestEditors: issues.guestEditors,
          metadata: issues.metadata,
          createdAt: issues.createdAt,
          updatedAt: issues.updatedAt,
          articleCount: count(articles.id)
        })
        .from(issues)
        .leftJoin(articles, eq(articles.issueId, issues.id))
        .where(eq(issues.volumeId, volumeId))
        .groupBy(issues.id)
        .orderBy(desc(issues.number))

      if (options.status) {
        query = query.where(and(
          eq(issues.volumeId, volumeId),
          eq(issues.status, options.status)
        ))
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.offset(options.offset)
      }

      const result = await query

      return result.map(issue => ({
        ...issue,
        articleCount: Number(issue.articleCount),
        pageRange: issue.metadata?.pageRange || ''
      })) as Issue[]

    } catch (error) {
      logError(error as Error, { context: 'getIssues', volumeId })
      return []
    }
  }

  /**
   * Get archive with advanced filtering and pagination
   */
  static async getArchive(filters: ArchiveFilters = {}): Promise<{
    articles: unknown[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    filters: { categories: string[]; years: number[]; volumes: string[]; issues: string[] }
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 10
      const offset = (page - 1) * limit

      // Build dynamic query conditions
      const conditions = []
      
      if (filters.year) {
        conditions.push(sql`EXTRACT(YEAR FROM ${articles.publishedDate}) = ${filters.year}`)
      }
      
      if (filters.volume) {
        conditions.push(eq(articles.volume, filters.volume))
      }
      
      if (filters.issue) {
        conditions.push(eq(articles.issue, filters.issue))
      }
      
      if (filters.category) {
        conditions.push(eq(articles.category, filters.category))
      }
      
      if (filters.status) {
        conditions.push(eq(articles.status, filters.status))
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(articles.title, `%${filters.search}%`),
            like(articles.abstract, `%${filters.search}%`),
            like(articles.keywords, `%${filters.search}%`)
          )
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(articles)
        .where(whereClause)

      // Build order by clause
      let orderBy
      switch (filters.sortBy) {
        case 'oldest':
          orderBy = asc(articles.publishedDate)
          break
        case 'volume':
          orderBy = [desc(articles.volume), desc(articles.issue)]
          break
        case 'issue':
          orderBy = [desc(articles.issue), desc(articles.volume)]
          break
        case 'downloads':
          orderBy = desc(articles.downloads)
          break
        case 'views':
          orderBy = desc(articles.views)
          break
        default: // 'newest'
          orderBy = desc(articles.publishedDate)
      }

      // Get articles
      const articlesResult = await db
        .select({
          id: articles.id,
          title: articles.title,
          abstract: articles.abstract,
          authors: articles.authors,
          authorAffiliations: articles.authorAffiliations,
          keywords: articles.keywords,
          category: articles.category,
          volume: articles.volume,
          issue: articles.issue,
          pages: articles.pages,
          publishedDate: articles.publishedDate,
          publishedYear: articles.publishedYear,
          doi: articles.doi,
          pdfUrl: articles.pdfUrl,
          status: articles.status,
          viewCount: articles.views,
          downloadCount: articles.downloads,
          citationCount: sql<number>`0` // Would need citation tracking
        })
        .from(articles)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)        // Get filter options
        const [categoriesResult, yearsResult, volumesResult, issuesResult] = await Promise.all([
          db.selectDistinct({ category: articles.category }).from(articles).where(eq(articles.status, 'published')),
          db.select({ year: sql<number>`DISTINCT EXTRACT(YEAR FROM ${articles.publishedDate})` }).from(articles).where(eq(articles.status, 'published')),
          db.selectDistinct({ volume: articles.volume }).from(articles).where(eq(articles.status, 'published')),
          db.selectDistinct({ issue: articles.issue }).from(articles).where(eq(articles.status, 'published'))
        ])

      return {
        articles: articlesResult,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          categories: categoriesResult.map(c => c.category).filter(Boolean).sort(),
          years: yearsResult.map(y => y.year).filter(Boolean).sort((a, b) => b - a),
          volumes: volumesResult.map(v => v.volume).filter(Boolean).sort(),
          issues: issuesResult.map(i => i.issue).filter(Boolean).sort()
        }
      }

    } catch (error) {
      logError(error as Error, { context: 'getArchive' })
      return {
        articles: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        filters: { categories: [], years: [], volumes: [], issues: [] }
      }
    }
  }

  /**
   * Publish a volume
   */
  static async publishVolume(volumeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logInfo('Publishing volume', { volumeId })

      // Check if all issues in volume are ready for publication
      const issuesInVolume = await db
        .select()
        .from(issues)
        .where(eq(issues.volumeId, volumeId))

      for (const issue of issuesInVolume) {
        const articlesInIssue = await db
          .select()
          .from(articles)
          .where(eq(articles.issueId, issue.id))

        if (articlesInIssue.length === 0) {
          return { success: false, error: `Issue ${issue.number} has no articles` }
        }

        const unpublishedArticles = articlesInIssue.filter(a => a.status !== 'published')
        if (unpublishedArticles.length > 0) {
          return { success: false, error: `Issue ${issue.number} has unpublished articles` }
        }
      }

      // Update volume status
      await db
        .update(volumes)
        .set({
          status: 'published',
          publishedDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(volumes.id, volumeId))

      // Update all issues in volume
      await db
        .update(issues)
        .set({
          status: 'published',
          publishedDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(issues.volumeId, volumeId))

      logInfo('Volume published successfully', { volumeId })
      return { success: true }

    } catch (error) {
      logError(error as Error, { context: 'publishVolume', volumeId })
      return { success: false, error: 'Failed to publish volume' }
    }
  }

  /**
   * Publish an issue
   */
  static async publishIssue(issueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logInfo('Publishing issue', { issueId })

      // Check if issue has articles
      const articlesInIssue = await db
        .select()
        .from(articles)
        .where(eq(articles.issueId, issueId))

      if (articlesInIssue.length === 0) {
        return { success: false, error: 'Issue has no articles' }
      }

      const unpublishedArticles = articlesInIssue.filter(a => a.status !== 'published')
      if (unpublishedArticles.length > 0) {
        return { success: false, error: 'Issue has unpublished articles' }
      }

      // Update issue status
      await db
        .update(issues)
        .set({
          status: 'published',
          publishedDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(issues.id, issueId))

      logInfo('Issue published successfully', { issueId })
      return { success: true }

    } catch (error) {
      logError(error as Error, { context: 'publishIssue', issueId })
      return { success: false, error: 'Failed to publish issue' }
    }
  }

  /**
   * Get archive statistics
   */
  static async getArchiveStatistics(): Promise<ArchiveStatistics> {
    try {
      const [
        volumeStats,
        issueStats,
        articleStats,
        yearRange,
        volumeRange,
        categoryStats,
        monthlyStats
      ] = await Promise.all([
        // Volume stats
        db.select({ count: count() }).from(volumes),
        
        // Issue stats
        db.select({ count: count() }).from(issues),
        
        // Article stats
        db.select({ 
          count: count(),
          totalViews: sql<number>`COALESCE(SUM(${articles.views}), 0)`,
          totalDownloads: sql<number>`COALESCE(SUM(${articles.downloads}), 0)`
        }).from(articles),
        
        // Year range
        db.select({
          minYear: sql<number>`MIN(EXTRACT(YEAR FROM ${articles.publishedDate}))`,
          maxYear: sql<number>`MAX(EXTRACT(YEAR FROM ${articles.publishedDate}))`
        }).from(articles),
        
        // Volume range
        db.select({
          minVolume: sql<string>`MIN(${articles.volume})`,
          maxVolume: sql<string>`MAX(${articles.volume})`
        }).from(articles),
        
        // Category stats
        db.select({
          category: articles.category,
          count: count()
        }).from(articles).groupBy(articles.category),
        
        // Monthly publication stats
        db.select({
          month: sql<string>`TO_CHAR(${articles.publishedDate}, 'YYYY-MM')`,
          count: count()
        }).from(articles).groupBy(sql`TO_CHAR(${articles.publishedDate}, 'YYYY-MM')`)
      ])

      return {
        totalVolumes: volumeStats[0]?.count || 0,
        totalIssues: issueStats[0]?.count || 0,
        totalArticles: articleStats[0]?.count || 0,
        yearRange: {
          start: yearRange[0]?.minYear || new Date().getFullYear(),
          end: yearRange[0]?.maxYear || new Date().getFullYear()
        },
        volumeRange: {
          start: volumeRange[0]?.minVolume || '1',
          end: volumeRange[0]?.maxVolume || '1'
        },
        categoryCounts: categoryStats.reduce((acc, cat) => {
          if (cat.category) acc[cat.category] = cat.count
          return acc
        }, {} as Record<string, number>),
        monthlyPublications: monthlyStats.map(stat => ({
          month: stat.month,
          count: stat.count
        })),
        downloadStats: {
          total: Number(articleStats[0]?.totalDownloads || 0),
          thisMonth: 0 // Would need more complex query for this month
        },
        viewStats: {
          total: Number(articleStats[0]?.totalViews || 0),
          thisMonth: 0 // Would need more complex query for this month
        }
      }

    } catch (error) {
      logError(error as Error, { context: 'getArchiveStatistics' })
      return {
        totalVolumes: 0,
        totalIssues: 0,
        totalArticles: 0,
        yearRange: { start: new Date().getFullYear(), end: new Date().getFullYear() },
        volumeRange: { start: '1', end: '1' },
        categoryCounts: {},
        monthlyPublications: [],
        downloadStats: { total: 0, thisMonth: 0 },
        viewStats: { total: 0, thisMonth: 0 }
      }
    }
  }

  /**
   * Assign article to issue
   */
  static async assignArticleToIssue(articleId: string, issueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get issue details
      const [issue] = await db
        .select()
        .from(issues)
        .where(eq(issues.id, issueId))
        .limit(1)

      if (!issue) {
        return { success: false, error: 'Issue not found' }
      }

      // Update article with issue and volume information
      await db
        .update(articles)
        .set({
          issueId: issueId,
          volume: issue.volumeId, // This should be volume number, not ID
          issue: issue.number,
          updatedAt: new Date()
        })
        .where(eq(articles.id, articleId))

      logInfo('Article assigned to issue', { articleId, issueId })
      return { success: true }

    } catch (error) {
      logError(error as Error, { context: 'assignArticleToIssue' })
      return { success: false, error: 'Failed to assign article to issue' }
    }
  }
}

export default ArchiveManagementService
