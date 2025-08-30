import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const articleId = params.id

    // Get article info
    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        files: articles.files,
        status: articles.status,
      })
      .from(articles)
      .where(eq(articles.id, articleId))

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    if (article.status !== "published") {
      return NextResponse.json({ error: "Article not available for preview" }, { status: 403 })
    }

    // Get the article files and generate preview URL
    let files
    try {
      files = typeof article.files === 'string' 
        ? JSON.parse(article.files) 
        : article.files || []
    } catch (error) {
      files = []
    }

    // Find the main manuscript file for preview
    const manuscriptFile = files.find((file: any) => 
      file.type === 'manuscript' || file.name?.toLowerCase().includes('manuscript')
    ) || files[0]

    if (!manuscriptFile) {
      return NextResponse.json({ error: "Preview file not found" }, { status: 404 })
    }

    // Generate preview URL (could be direct file URL or processed preview)
    const previewUrl = manuscriptFile.previewUrl || 
                      manuscriptFile.url || 
                      `/api/files/${manuscriptFile.id}/preview`

    // Return preview URL for client to handle
    return NextResponse.json({
      success: true,
      previewUrl,
      fileName: manuscriptFile.name || `article-${articleId}-preview.pdf`,
      contentType: manuscriptFile.contentType || 'application/pdf'
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${params.id}/preview` })
    return NextResponse.json({ error: "Preview failed" }, { status: 500 })
  }
}
