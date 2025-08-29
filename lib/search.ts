// lib/search.ts

import { sql } from "@vercel/postgres"
export async function searchArticles(query: string, limit: number, offset: number) {
  // Production full-text search with PostgreSQL
  const searchQuery = `
    SELECT *, ts_rank(search_vector, plainto_tsquery($1)) as rank
    FROM articles 
    WHERE search_vector @@ plainto_tsquery($1)
    ORDER BY rank DESC, published_date DESC
    LIMIT $2 OFFSET $3
  `

  try {
    const result = await sql.query(searchQuery, [query, limit, offset])
    return result.rows
  } catch (error) {
    logger.error("Database error:", error)
    throw new AppError("Failed to search articles.")
  }
}


export async function updateArticleSearchVector(articleId: string, title: string, abstract: string, keywords: string) {
  // Production search indexing
  await sql`
    UPDATE articles 
    SET search_vector = to_tsvector('english', ${title} || ' ' || ${abstract} || ' ' || ${keywords})
    WHERE id = ${articleId}
  `
}

// Get intelligent search suggestions based on existing content
async function getSearchSuggestions(query: string) {
  if (!query || query.trim().length < 2) {
    return { success: true, suggestions: [] }
  }

  try {
    // Get suggestions from article titles, keywords, and authors
    const titleSuggestions = await sql`
      SELECT DISTINCT title 
      FROM articles 
      WHERE title ILIKE ${`%${query}%`} 
      AND status = 'published'
      LIMIT 3
    `

    const keywordSuggestions = await sql`
      SELECT DISTINCT unnest(string_to_array(keywords, ',')) as keyword
      FROM articles 
      WHERE keywords ILIKE ${`%${query}%`}
      AND status = 'published'
      LIMIT 3
    `

    const authorSuggestions = await sql`
      SELECT DISTINCT u.name 
      FROM users u
      JOIN articles a ON u.id = a.author_id
      WHERE u.name ILIKE ${`%${query}%`}
      AND a.status = 'published'
      LIMIT 3
    `

    const categorySuggestions = await sql`
      SELECT DISTINCT category 
      FROM articles 
      WHERE category ILIKE ${`%${query}%`}
      AND status = 'published'
      LIMIT 2
    `

    // Combine and format suggestions
    const suggestions = [
      ...titleSuggestions.rows.map(row => ({ type: 'title', text: row.title })),
      ...keywordSuggestions.rows.map(row => ({ type: 'keyword', text: row.keyword.trim() })),
      ...authorSuggestions.rows.map(row => ({ type: 'author', text: row.name })),
      ...categorySuggestions.rows.map(row => ({ type: 'category', text: row.category }))
    ].slice(0, 8) // Limit to 8 total suggestions

    return { success: true, suggestions }
  } catch (error) {
    logger.error("Search suggestions error:", error)
    return { success: false, suggestions: [] }
  }
}

// Advanced search with multiple filters
async function advancedSearchArticles(filters: {
  query?: string
  author?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  keywords?: string[]
  limit?: number
  offset?: number
}) {
  const {
    query = '',
    author,
    category,
    dateFrom,
    dateTo,
    keywords = [],
    limit = 20,
    offset = 0
  } = filters

  try {
    let searchQuery = `
      SELECT 
        a.*,
        u.name as author_name,
        u.affiliation as author_affiliation,
        ${query ? `ts_rank(a.search_vector, plainto_tsquery($1)) as rank` : '1 as rank'}
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
    `

    const params: unknown[] = []
    let paramIndex = 1

    // Full-text search
    if (query) {
      searchQuery += ` AND a.search_vector @@ plainto_tsquery($${paramIndex})`
      params.push(query)
      paramIndex++
    }

    // Author filter
    if (author) {
      searchQuery += ` AND u.name ILIKE $${paramIndex}`
      params.push(`%${author}%`)
      paramIndex++
    }

    // Category filter
    if (category) {
      searchQuery += ` AND a.category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    // Date range filter
    if (dateFrom) {
      searchQuery += ` AND a.published_date >= $${paramIndex}`
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      searchQuery += ` AND a.published_date <= $${paramIndex}`
      params.push(dateTo)
      paramIndex++
    }

    // Keywords filter
    if (keywords.length > 0) {
      const keywordConditions = keywords.map((_, i) => `a.keywords ILIKE $${paramIndex + i}`).join(' AND ')
      searchQuery += ` AND (${keywordConditions})`
      keywords.forEach(keyword => params.push(`%${keyword}%`))
      paramIndex += keywords.length
    }

    // Order and pagination
    searchQuery += ` ORDER BY ${query ? 'rank DESC,' : ''} a.published_date DESC`
    searchQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await sql.query(searchQuery, params)
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
    `
    
    const countParams: unknown[] = []
    let countParamIndex = 1

    // Apply same filters to count query
    if (query) {
      countQuery += ` AND a.search_vector @@ plainto_tsquery($${countParamIndex})`
      countParams.push(query)
      countParamIndex++
    }

    if (author) {
      countQuery += ` AND u.name ILIKE $${countParamIndex}`
      countParams.push(`%${author}%`)
      countParamIndex++
    }

    if (category) {
      countQuery += ` AND a.category = $${countParamIndex}`
      countParams.push(category)
      countParamIndex++
    }

    if (dateFrom) {
      countQuery += ` AND a.published_date >= $${countParamIndex}`
      countParams.push(dateFrom)
      countParamIndex++
    }

    if (dateTo) {
      countQuery += ` AND a.published_date <= $${countParamIndex}`
      countParams.push(dateTo)
      countParamIndex++
    }

    if (keywords.length > 0) {
      const keywordConditions = keywords.map((_, i) => `a.keywords ILIKE $${countParamIndex + i}`).join(' AND ')
      countQuery += ` AND (${keywordConditions})`
      keywords.forEach(keyword => countParams.push(`%${keyword}%`))
    }

    const countResult = await sql.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    return {
      articles: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  } catch (error) {
    logger.error("Advanced search error:", error)
    throw new AppError("Failed to perform advanced search.")
  }
}

export const AdvancedSearch = {
  searchArticles,
  advancedSearchArticles,
  updateArticleSearchVector,
  getSearchSuggestions,
}
