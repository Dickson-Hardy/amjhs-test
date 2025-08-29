import { db } from "./db"
import { articles, authors, journals, volumes, issues } from "./db/schema"
import { and, or, ilike, desc, asc, sql, eq, gte, lte, inArray } from "drizzle-orm"
import { logger } from "./logger"

export interface SearchFilters {
  query?: string
  category?: string
  authors?: string[]
  keywords?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  volume?: string
  issue?: string
  status?: string
  hasFullText?: boolean
  hasPDF?: boolean
  citationCountMin?: number
  viewCountMin?: number
  downloadCountMin?: number
  sortBy?: 'relevance' | 'date' | 'citations' | 'views' | 'downloads' | 'title'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchSuggestion {
  type: 'title' | 'author' | 'keyword' | 'category'
  value: string
  count: number
}

export interface SearchResult {
  id: string
  title: string
  abstract: string
  authors: string[]
  authorAffiliations: string[]
  keywords: string[]
  category: string
  volume: string
  issue: string
  pages: string
  publishedDate: string
  doi?: string
  pdfUrl?: string
  status: string
  viewCount: number
  downloadCount: number
  citationCount: number
  relevanceScore: number
  highlightedTitle?: string
  highlightedAbstract?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  totalPages: number
  aggregations: {
    categories: Record<string, number>
    authors: Record<string, number>
    keywords: Record<string, number>
    years: Record<string, number>
    volumes: Record<string, number>
  }
  suggestions: SearchSuggestion[]
  executionTime: number
}

export class AdvancedSearchService {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      logger.info("Advanced search initiated", { filters })

      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      // Build base query with full-text search
      let baseQuery = db
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
          doi: articles.doi,
          pdfUrl: articles.pdfUrl,
          status: articles.status,
          viewCount: articles.viewCount,
          downloadCount: articles.downloadCount,
          citationCount: articles.citationCount,
          // Calculate relevance score
          relevanceScore: sql<number>`
            CASE 
              WHEN ${filters.query} IS NULL THEN 1.0
              ELSE (
                -- Title match weight: 3.0
                CASE WHEN LOWER(${articles.title}) LIKE LOWER(${'%' + (filters.query || '') + '%'}) THEN 3.0 ELSE 0 END +
                -- Abstract match weight: 1.5
                CASE WHEN LOWER(${articles.abstract}) LIKE LOWER(${'%' + (filters.query || '') + '%'}) THEN 1.5 ELSE 0 END +
                -- Keywords match weight: 2.0
                CASE WHEN EXISTS(
                  SELECT 1 FROM UNNEST(${articles.keywords}) AS keyword 
                  WHERE LOWER(keyword) LIKE LOWER(${'%' + (filters.query || '') + '%'})
                ) THEN 2.0 ELSE 0 END +
                -- Authors match weight: 2.5
                CASE WHEN EXISTS(
                  SELECT 1 FROM UNNEST(${articles.authors}) AS author 
                  WHERE LOWER(author) LIKE LOWER(${'%' + (filters.query || '') + '%'})
                ) THEN 2.5 ELSE 0 END +
                -- Citation boost (logarithmic)
                LOG(GREATEST(${articles.citationCount}, 1)) * 0.1 +
                -- Recent publication boost
                CASE WHEN ${articles.publishedDate} > NOW() - INTERVAL '1 year' THEN 0.5 ELSE 0 END
              )
            END
          `
        })
        .from(articles)

      // Apply filters
      const conditions = []

      // Text search
      if (filters.query) {
        const searchQuery = `%${filters.query.toLowerCase()}%`
        conditions.push(
          or(
            ilike(articles.title, searchQuery),
            ilike(articles.abstract, searchQuery),
            sql`EXISTS(
              SELECT 1 FROM UNNEST(${articles.keywords}) AS keyword 
              WHERE LOWER(keyword) LIKE ${searchQuery}
            )`,
            sql`EXISTS(
              SELECT 1 FROM UNNEST(${articles.authors}) AS author 
              WHERE LOWER(author) LIKE ${searchQuery}
            )`
          )
        )
      }

      // Category filter
      if (filters.category) {
        conditions.push(eq(articles.category, filters.category))
      }

      // Author filter
      if (filters.authors && filters.authors.length > 0) {
        conditions.push(
          sql`EXISTS(
            SELECT 1 FROM UNNEST(${articles.authors}) AS author 
            WHERE author = ANY(${filters.authors})
          )`
        )
      }

      // Keywords filter
      if (filters.keywords && filters.keywords.length > 0) {
        conditions.push(
          sql`EXISTS(
            SELECT 1 FROM UNNEST(${articles.keywords}) AS keyword 
            WHERE keyword = ANY(${filters.keywords})
          )`
        )
      }

      // Date range filter
      if (filters.dateRange) {
        conditions.push(
          and(
            gte(articles.publishedDate, filters.dateRange.start.toISOString()),
            lte(articles.publishedDate, filters.dateRange.end.toISOString())
          )
        )
      }

      // Volume/Issue filter
      if (filters.volume) {
        conditions.push(eq(articles.volume, filters.volume))
      }
      if (filters.issue) {
        conditions.push(eq(articles.issue, filters.issue))
      }

      // Status filter
      if (filters.status) {
        conditions.push(eq(articles.status, filters.status))
      }

      // Numeric filters
      if (filters.citationCountMin) {
        conditions.push(gte(articles.citationCount, filters.citationCountMin))
      }
      if (filters.viewCountMin) {
        conditions.push(gte(articles.viewCount, filters.viewCountMin))
      }
      if (filters.downloadCountMin) {
        conditions.push(gte(articles.downloadCount, filters.downloadCountMin))
      }

      // Boolean filters
      if (filters.hasFullText) {
        conditions.push(sql`${articles.abstract} IS NOT NULL AND LENGTH(${articles.abstract}) > 100`)
      }
      if (filters.hasPDF) {
        conditions.push(sql`${articles.pdfUrl} IS NOT NULL`)
      }

      // Apply all conditions
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions))
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'relevance'
      const sortOrder = filters.sortOrder || 'desc'
      
      switch (sortBy) {
        case 'relevance':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(sql`relevanceScore`) 
              : asc(sql`relevanceScore`)
          )
          break
        case 'date':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(articles.publishedDate) 
              : asc(articles.publishedDate)
          )
          break
        case 'citations':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(articles.citationCount) 
              : asc(articles.citationCount)
          )
          break
        case 'views':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(articles.viewCount) 
              : asc(articles.viewCount)
          )
          break
        case 'downloads':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(articles.downloadCount) 
              : asc(articles.downloadCount)
          )
          break
        case 'title':
          baseQuery = baseQuery.orderBy(
            sortOrder === 'desc' 
              ? desc(articles.title) 
              : asc(articles.title)
          )
          break
      }

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
      
      if (conditions.length > 0) {
        countQuery.where(and(...conditions))
      }

      const [results, countResult, aggregations, suggestions] = await Promise.all([
        baseQuery.limit(limit).offset(offset),
        countQuery,
        this.getAggregations(conditions),
        this.getSuggestions(filters.query)
      ])

      const total = countResult[0]?.count || 0
      const totalPages = Math.ceil(total / limit)

      // Add highlighting to results
      const highlightedResults = this.addHighlighting(results, filters.query)

      const executionTime = Date.now() - startTime

      logger.info("Advanced search completed", { 
        total, 
        resultsCount: results.length, 
        executionTime 
      })

      return {
        results: highlightedResults,
        total,
        page,
        limit,
        totalPages,
        aggregations,
        suggestions,
        executionTime
      }

    } catch (error) {
      logger.error("Advanced search failed", { error, filters })
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  private async getAggregations(conditions: unknown[]): Promise<SearchResponse['aggregations']> {
    let baseQuery = db.select().from(articles)
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions))
    }

    const results = await baseQuery

    // Calculate aggregations
    const categories: Record<string, number> = {}
    const authors: Record<string, number> = {}
    const keywords: Record<string, number> = {}
    const years: Record<string, number> = {}
    const volumes: Record<string, number> = {}

    results.forEach((article) => {
      // Categories
      if (article.category) {
        categories[article.category] = (categories[article.category] || 0) + 1
      }

      // Authors
      article.authors?.forEach((author) => {
        authors[author] = (authors[author] || 0) + 1
      })

      // Keywords
      article.keywords?.forEach((keyword) => {
        keywords[keyword] = (keywords[keyword] || 0) + 1
      })

      // Years
      if (article.publishedDate) {
        const year = new Date(article.publishedDate).getFullYear().toString()
        years[year] = (years[year] || 0) + 1
      }

      // Volumes
      if (article.volume) {
        volumes[article.volume] = (volumes[article.volume] || 0) + 1
      }
    })

    return {
      categories,
      authors: this.limitAggregation(authors, 50),
      keywords: this.limitAggregation(keywords, 100),
      years,
      volumes
    }
  }

  private limitAggregation(agg: Record<string, number>, limit: number): Record<string, number> {
    return Object.fromEntries(
      Object.entries(agg)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
    )
  }

  async getSuggestions(query?: string): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return []
    }

    try {
      const searchPattern = `%${query.toLowerCase()}%`

      // Get suggestions from different fields
      const [titleSuggestions, authorSuggestions, keywordSuggestions, categorySuggestions] = await Promise.all([
        // Title suggestions
        db
          .select({
            value: articles.title,
            count: sql<number>`count(*)`
          })
          .from(articles)
          .where(ilike(articles.title, searchPattern))
          .groupBy(articles.title)
          .orderBy(desc(sql`count(*)`))
          .limit(5),

        // Author suggestions
        db
          .select({
            authors: articles.authors
          })
          .from(articles)
          .where(sql`EXISTS(
            SELECT 1 FROM UNNEST(${articles.authors}) AS author 
            WHERE LOWER(author) LIKE ${searchPattern}
          )`)
          .limit(50),

        // Keyword suggestions
        db
          .select({
            keywords: articles.keywords
          })
          .from(articles)
          .where(sql`EXISTS(
            SELECT 1 FROM UNNEST(${articles.keywords}) AS keyword 
            WHERE LOWER(keyword) LIKE ${searchPattern}
          )`)
          .limit(50),

        // Category suggestions
        db
          .select({
            value: articles.category,
            count: sql<number>`count(*)`
          })
          .from(articles)
          .where(ilike(articles.category, searchPattern))
          .groupBy(articles.category)
          .orderBy(desc(sql`count(*)`))
          .limit(5)
      ])

      const suggestions: SearchSuggestion[] = []

      // Process title suggestions
      titleSuggestions.forEach((item) => {
        suggestions.push({
          type: 'title',
          value: item.value,
          count: item.count
        })
      })

      // Process author suggestions
      const authorCounts: Record<string, number> = {}
      authorSuggestions.forEach((item) => {
        item.authors?.forEach((author) => {
          if (author.toLowerCase().includes(query.toLowerCase())) {
            authorCounts[author] = (authorCounts[author] || 0) + 1
          }
        })
      })
      
      Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([author, count]) => {
          suggestions.push({
            type: 'author',
            value: author,
            count
          })
        })

      // Process keyword suggestions
      const keywordCounts: Record<string, number> = {}
      keywordSuggestions.forEach((item) => {
        item.keywords?.forEach((keyword) => {
          if (keyword.toLowerCase().includes(query.toLowerCase())) {
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
          }
        })
      })
      
      Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([keyword, count]) => {
          suggestions.push({
            type: 'keyword',
            value: keyword,
            count
          })
        })

      // Process category suggestions
      categorySuggestions.forEach((item) => {
        suggestions.push({
          type: 'category',
          value: item.value,
          count: item.count
        })
      })

      return suggestions.slice(0, 20)

    } catch (error) {
      logger.error("Failed to get search suggestions", { error, query })
      return []
    }
  }

  private addHighlighting(results: unknown[], query?: string): SearchResult[] {
    if (!query) {
      return results.map(result => ({
        ...result,
        relevanceScore: result.relevanceScore || 1.0
      }))
    }

    const highlightPattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

    return results.map((result) => ({
      ...result,
      relevanceScore: result.relevanceScore || 1.0,
      highlightedTitle: result.title?.replace(highlightPattern, '<mark>$1</mark>'),
      highlightedAbstract: result.abstract?.replace(highlightPattern, '<mark>$1</mark>')
    }))
  }

  async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    // This would typically come from search analytics
    // For now, return mock data based on common academic terms
    return [
      { query: "machine learning", count: 245 },
      { query: "artificial intelligence", count: 189 },
      { query: "climate change", count: 167 },
      { query: "quantum computing", count: 143 },
      { query: "blockchain", count: 128 },
      { query: "data science", count: 112 },
      { query: "neural networks", count: 98 },
      { query: "renewable energy", count: 87 },
      { query: "biotechnology", count: 76 },
      { query: "cybersecurity", count: 65 }
    ].slice(0, limit)
  }

  async saveSearchAnalytics(query: string, resultsCount: number, userId?: string): Promise<void> {
    try {
      // Save search analytics (would typically go to a separate analytics table)
      logger.info("Search analytics saved", { 
        query, 
        resultsCount, 
        userId, 
        timestamp: new Date().toISOString() 
      })
    } catch (error) {
      logger.error("Failed to save search analytics", { error })
    }
  }
}

// Export singleton instance
export const advancedSearchService = new AdvancedSearchService()
