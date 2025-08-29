import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DOIGenerator } from "@/lib/doi"
import { logError, logInfo } from "@/lib/logger"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { articleId, metadata } = await request.json()

    // Validate required metadata
    if (!metadata.title || !metadata.authors || !metadata.volume) {
      return NextResponse.json({ 
        error: "Missing required metadata for DOI registration" 
      }, { status: 400 })
    }

    // Get article data if not provided
    let articleData = metadata
    if (articleId && !metadata.articleId) {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, articleId),
        with: {
          authors: true
        }
      })

      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }

      // Format article data for DOI
      articleData = {
        articleId: article.id,
        title: article.title,
        authors: article.authors.map((author: unknown) => ({
          given: author.firstName,
          family: author.lastName,
          orcid: author.orcid,
          affiliation: author.affiliation || "Unknown"
        })),
        abstract: article.abstract,
        publicationDate: article.publishedAt || article.createdAt,
        volume: article.volume || "1",
        issue: article.issue || "1",
        pages: article.pages || "",
        keywords: article.keywords || [],
        category: article.category || "Computer Science"
      }
    }

    // Generate DOI
    const doi = DOIGenerator.generateDOI({
      year: new Date().getFullYear(),
      volume: articleData.volume,
      issue: articleData.issue,
      articleNumber: parseInt(articleData.articleId?.slice(-3)) || 1,
    })

    // Register with CrossRef
    const registered = await DOIGenerator.registerWithCrossRef(doi, articleData)

    if (registered) {
      // Update article with DOI information
      if (articleId) {
        await db
          .update(articles)
          .set({
            doi: doi,
            doiRegistered: true,
            doiRegisteredAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(articles.id, articleId))
      }

      logInfo("DOI registered successfully", { articleId, doi })

      return NextResponse.json({
        success: true,
        doi,
        message: "DOI registered successfully with CrossRef",
        registeredAt: new Date()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to register DOI with CrossRef",
      }, { status: 500 })
    }
  } catch (error) {
    logError(error as Error, { endpoint: "/api/integrations/crossref" })
    return NextResponse.json({ 
      success: false, 
      error: "DOI registration failed" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const doi = searchParams.get('doi')

    if (!doi) {
      return NextResponse.json({ error: "DOI parameter required" }, { status: 400 })
    }

    // Verify DOI with CrossRef
    const verification = await DOIGenerator.verifyDOI(doi)

    return NextResponse.json({
      success: true,
      verification
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/integrations/crossref" })
    return NextResponse.json({ 
      success: false, 
      error: "DOI verification failed" 
    }, { status: 500 })
  }
}
