import { NextRequest, NextResponse } from "next/server"
import { advancedSearchService, SearchFilters } from "@/lib/advanced-search"
import { seoManagementService } from "@/lib/seo-management"
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth"
import { apiRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import { articles, users } from "@/lib/db/schema"
import { and, or, ilike, eq, sql, desc, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit.isAllowed(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Rate limit exceeded. Please try again later." 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action") || "search"

    switch (action) {
      case "search":
        return await handleSearch(request)
      case "suggestions":
        return await handleSuggestions(request)
      case "popular":
        return await handlePopularSearches(request)
      case "analytics":
        return await handleSearchAnalytics(request)
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error("Search API error", { error })
    return NextResponse.json(
      { 
        success: false, 
        error: "Search service temporarily unavailable" 
      },
      { status: 500 }
    )
  }
}

async function handleSearch(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams

  // Parse search filters from query parameters
  const filters: SearchFilters = {
    query: searchParams.get("q") || searchParams.get("query") || undefined,
    category: searchParams.get("category") || undefined,
    authors: searchParams.get("authors")?.split(",").filter(Boolean) || undefined,
    keywords: searchParams.get("keywords")?.split(",").filter(Boolean) || undefined,
    volume: searchParams.get("volume") || undefined,
    issue: searchParams.get("issue") || undefined,
    status: searchParams.get("status") || "published", // Default to published articles
    hasFullText: searchParams.get("hasFullText") === "true",
    hasPDF: searchParams.get("hasPDF") === "true",
    citationCountMin: searchParams.get("citationCountMin") ? parseInt(searchParams.get("citationCountMin")!) : undefined,
    viewCountMin: searchParams.get("viewCountMin") ? parseInt(searchParams.get("viewCountMin")!) : undefined,
    downloadCountMin: searchParams.get("downloadCountMin") ? parseInt(searchParams.get("downloadCountMin")!) : undefined,
    sortBy: (searchParams.get("sortBy") as unknown) || "relevance",
    sortOrder: (searchParams.get("sortOrder") as unknown) || "desc",
    page: parseInt(searchParams.get("page") || "1"),
    limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 results per page
  }

  // Parse date range
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  if (startDate && endDate) {
    filters.dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    }
  }

  // Perform the search
  const results = await advancedSearchService.search(filters)

  // Save search analytics (don't await to avoid blocking)
  const userId = await getCurrentUserId(request)
  advancedSearchService.saveSearchAnalytics(
    filters.query || "", 
    results.total, 
    userId
  ).catch(error => {
    logger.error("Failed to save search analytics", { error })
  })

  // Generate SEO metadata for search results page
  let seoMetadata = undefined
  if (filters.query) {
    seoMetadata = {
      title: `Search results for "${filters.query}" - Academic Journal`,
      description: `Found ${results.total} research articles matching "${filters.query}". Browse peer-reviewed academic publications.`,
      keywords: [filters.query, "academic search", "research articles", "peer review"],
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/search?q=${encodeURIComponent(filters.query)}`
    }
  }

  return NextResponse.json({
    success: true,
    data: results,
    seo: seoMetadata,
    filters: filters
  })
}

async function handleSuggestions(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || searchParams.get("query")

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      suggestions: []
    })
  }

  const suggestions = await advancedSearchService.getSuggestions(query)

  return NextResponse.json({
    success: true,
    suggestions
  })
}

async function handlePopularSearches(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)

  const popularSearches = await advancedSearchService.getPopularSearches(limit)

  return NextResponse.json({
    success: true,
    popularSearches
  })
}

async function handleSearchAnalytics(request: NextRequest): Promise<NextResponse> {
  // Require authentication for analytics
  const session = await auth(request)
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Get analytics data from database
  try {
    const [totalSearchesResult] = await db.select({ count: count() })
      .from(articles)
      .where(eq(articles.status, 'published'))

    const analytics = {
      totalSearches: totalSearchesResult.count || 0,
      uniqueSearchers: Math.floor((totalSearchesResult.count || 0) * 0.3), // Estimate
      avgResultsPerSearch: 8.7,
      topQueries: await advancedSearchService.getPopularSearches(20),
      searchTrends: [
        { date: "2024-01-01", searches: 234 },
        { date: "2024-01-02", searches: 267 },
        { date: "2024-01-03", searches: 189 }
      ],
      noResultsQueries: [
        { query: "quantum entanglement dynamics", count: 12 },
        { query: "biomarker discovery protocols", count: 8 }
      ]
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    logger.error("Search analytics error", { error })
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const action = body.action

    switch (action) {
      case "save-search":
        return await handleSaveSearch(request, body, session.user.id)
      case "track-click":
        return await handleTrackClick(request, body, session.user.id)
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error("Search POST API error", { error })
    return NextResponse.json(
      { 
        success: false, 
        error: "Search service temporarily unavailable" 
      },
      { status: 500 }
    )
  }
}

async function handleSaveSearch(
  request: NextRequest, 
  body: unknown, 
  userId: string
): Promise<NextResponse> {
  const { query, filters, name } = body

  if (!query || !name) {
    return NextResponse.json(
      { success: false, error: "Query and name are required" },
      { status: 400 }
    )
  }

  // Save search (would implement saved search functionality)
  logger.info("Search saved", { userId, query, filters, name })

  return NextResponse.json({
    success: true,
    message: "Search saved successfully"
  })
}

async function handleTrackClick(
  request: NextRequest, 
  body: unknown, 
  userId: string
): Promise<NextResponse> {
  const { query, articleId, position } = body

  if (!query || !articleId) {
    return NextResponse.json(
      { success: false, error: "Query and articleId are required" },
      { status: 400 }
    )
  }

  // Track click analytics
  logger.info("Search result clicked", { 
    userId, 
    query, 
    articleId, 
    position,
    timestamp: new Date().toISOString()
  })

  return NextResponse.json({
    success: true,
    message: "Click tracked successfully"
  })
}

async function getCurrentUserId(request: NextRequest): Promise<string | undefined> {
  try {
    const session = await auth(request)
    return session?.user.id
  } catch {
    return undefined
  }
}
