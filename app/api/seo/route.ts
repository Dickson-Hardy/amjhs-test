import { NextRequest, NextResponse } from "next/server"
import { seoManagementService } from "@/lib/seo-management"
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action") || "sitemap"

    switch (action) {
      case "sitemap":
        return await handleSitemap(request)
      case "robots":
        return await handleRobots(request)
      case "article-seo":
        return await handleArticleSEO(request)
      case "homepage-seo":
        return await handleHomepageSEO(request)
      case "archive-seo":
        return await handleArchiveSEO(request)
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error("SEO API error", { error })
    return NextResponse.json(
      { 
        success: false, 
        error: "SEO service temporarily unavailable" 
      },
      { status: 500 }
    )
  }
}

async function handleSitemap(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get("format") || "xml"

  if (format === "xml") {
    const sitemapXML = await seoManagementService.generateSitemapXML()
    
    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } else {
    const sitemap = await seoManagementService.generateSitemap()
    
    return NextResponse.json({
      success: true,
      sitemap
    })
  }
}

async function handleRobots(request: NextRequest): Promise<NextResponse> {
  const robotsTxt = seoManagementService.generateRobotsTxt()
  
  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  })
}

async function handleArticleSEO(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  const articleId = searchParams.get("articleId")

  if (!articleId) {
    return NextResponse.json(
      { success: false, error: "Article ID is required" },
      { status: 400 }
    )
  }

  try {
    const seoMetadata = await seoManagementService.generateArticleSEO(articleId)
    
    return NextResponse.json({
      success: true,
      seo: seoMetadata
    })
  } catch (error) {
    logger.error("Failed to generate article SEO", { error, articleId })
    return NextResponse.json(
      { success: false, error: "Article not found or SEO generation failed" },
      { status: 404 }
    )
  }
}

async function handleHomepageSEO(request: NextRequest): Promise<NextResponse> {
  const seoMetadata = seoManagementService.generateHomepageSEO()
  
  return NextResponse.json({
    success: true,
    seo: seoMetadata
  })
}

async function handleArchiveSEO(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams
  
  const filters = {
    category: searchParams.get("category") || undefined,
    year: searchParams.get("year") || undefined,
    volume: searchParams.get("volume") || undefined,
  }

  const seoMetadata = seoManagementService.generateArchiveSEO(filters)
  
  return NextResponse.json({
    success: true,
    seo: seoMetadata
  })
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication for SEO management operations
    const session = await auth(request)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const action = body.action

    switch (action) {
      case "regenerate-sitemap":
        return await handleRegenerateSitemap(request)
      case "validate-seo":
        return await handleValidateSEO(request, body)
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error("SEO POST API error", { error })
    return NextResponse.json(
      { 
        success: false, 
        error: "SEO service temporarily unavailable" 
      },
      { status: 500 }
    )
  }
}

async function handleRegenerateSitemap(request: NextRequest): Promise<NextResponse> {
  try {
    // Force regeneration of sitemap
    const sitemap = await seoManagementService.generateSitemap()
    
    logger.info("Sitemap regenerated", { 
      entryCount: sitemap.length,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: `Sitemap regenerated with ${sitemap.length} entries`,
      entryCount: sitemap.length
    })
  } catch (error) {
    logger.error("Failed to regenerate sitemap", { error })
    return NextResponse.json(
      { success: false, error: "Sitemap regeneration failed" },
      { status: 500 }
    )
  }
}

async function handleValidateSEO(request: NextRequest, body: unknown): Promise<NextResponse> {
  const { url, type } = body

  if (!url || !type) {
    return NextResponse.json(
      { success: false, error: "URL and type are required" },
      { status: 400 }
    )
  }

  // process.env.AUTH_TOKEN_PREFIX + ' 'SEO validation (in production, would use external SEO APIs)
  const validation = {
    url,
    type,
    checks: {
      titleLength: { passed: true, message: "Title length is optimal" },
      descriptionLength: { passed: true, message: "Description length is optimal" },
      hasMetaKeywords: { passed: true, message: "Meta keywords present" },
      hasStructuredData: { passed: true, message: "Structured data found" },
      hasOpenGraph: { passed: true, message: "Open Graph tags present" },
      hasCanonical: { passed: true, message: "Canonical URL set" },
      mobileOptimized: { passed: true, message: "Mobile optimized" },
      fastLoading: { passed: true, message: "Page loads quickly" }
    },
    score: 95,
    recommendations: [
      "Consider adding more descriptive alt text to images",
      "Optimize images for faster loading"
    ]
  }

  return NextResponse.json({
    success: true,
    validation
  })
}
