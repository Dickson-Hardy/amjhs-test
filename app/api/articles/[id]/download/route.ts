import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const articleId = params.id

    // Check if article exists and is published
    const [article] = await db
      .select({ 
        status: articles.status,
        files: articles.files 
      })
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1)

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    if (article.status !== "published") {
      return NextResponse.json({ error: "Article not available for download" }, { status: 403 })
    }

    // Increment download count
    await db
      .update(articles)
      .set({ downloads: sql`${articles.downloads} + 1` })
      .where(eq(articles.id, articleId))

    if (!article.files) {
      return NextResponse.json({ error: "Article files not found" }, { status: 404 })
    }

    // Parse files JSON and get the main manuscript file
    let files
    try {
      files = typeof article.files === 'string' 
        ? JSON.parse(article.files) 
        : article.files
    } catch (error) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 })
    }

    // Find the main manuscript file (usually the first PDF or the one marked as main)
    const manuscriptFile = files.find((file: any) => 
      file.type === 'manuscript' || file.name?.toLowerCase().includes('manuscript')
    ) || files[0]

    if (!manuscriptFile) {
      return NextResponse.json({ error: "Manuscript file not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      downloadUrl: manuscriptFile.url || `/api/files/${manuscriptFile.id}/download`,
      fileName: manuscriptFile.name || `article-${articleId}.pdf`,
      fileSize: manuscriptFile.size || 0,
      contentType: manuscriptFile.contentType || 'application/pdf'
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${articleId}/download` })
    return NextResponse.json({ success: false, error: "Download failed" }, { status: 500 })
  }
}
