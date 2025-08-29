import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAdminAction } from "@/lib/admin-logger"

// DOI validation regex pattern
const DOI_PATTERN = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { articleId, doi } = await request.json()

    // Validate input
    if (!articleId || !doi) {
      return NextResponse.json(
        { error: "Article ID and DOI are required" },
        { status: 400 }
      )
    }

    // Validate DOI format
    if (!DOI_PATTERN.test(doi)) {
      return NextResponse.json(
        { error: "Invalid DOI format. DOI should follow pattern: 10.xxxx/xxxxx" },
        { status: 400 }
      )
    }

    // Check if article exists
    const article = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1)

    if (article.length === 0) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    // Check if DOI is already in use
    const existingDOI = await db
      .select()
      .from(articles)
      .where(eq(articles.doi, doi))
      .limit(1)

    if (existingDOI.length > 0 && existingDOI[0].id !== articleId) {
      return NextResponse.json(
        { error: "DOI is already assigned to another article" },
        { status: 400 }
      )
    }

    // Validate DOI with CrossRef (optional check)
    let crossRefValid = false
    try {
      const crossRefResponse = await fetch(`https://api.crossref.org/works/${doi}`)
      crossRefValid = crossRefResponse.ok
    } catch (error) {
      // DOI might not exist in CrossRef yet, which is fine for new articles
      logger.error("CrossRef validation failed:", error)
    }

    // Update article with DOI
    const updatedArticle = await db
      .update(articles)
      .set({
        doi,
        doiRegistered: true,
        doiRegisteredAt: new Date()
      })
      .where(eq(articles.id, articleId))
      .returning()

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'VALIDATE_DOI',
      resourceType: 'article',
      resourceId: articleId,
      details: `Validated and assigned DOI ${doi} to article "${article[0].title}" (CrossRef valid: ${crossRefValid})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      article: updatedArticle[0],
      crossRefValid,
      message: `DOI ${doi} validated and assigned successfully`
    })

  } catch (error) {
    logger.error("Error validating DOI:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
