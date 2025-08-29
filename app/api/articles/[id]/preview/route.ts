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
        fileUrl: articles.fileUrl,
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

    // In a real implementation, you would:
    // 1. Generate a secure, time-limited preview URL
    // 2. Use ImageKit's document preview capabilities
    // 3. Return the preview URL or redirect to it

    const previewUrl = article.fileUrl || `/files/articles/${articleId}/preview.pdf`

    // Redirect to the actual PDF preview
    return NextResponse.redirect(previewUrl)
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${params.id}/preview` })
    return NextResponse.json({ error: "Preview failed" }, { status: 500 })
  }
}
