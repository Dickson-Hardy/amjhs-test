import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if article exists and is published
    const [article] = await db
      .select({ status: articles.status })
      .from(articles)
      .where(eq(articles.id, articleId))

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      )
    }

    if (article.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Article not available for download" },
        { status: 403 }
      )
    }

    // Increment download count
    await db
      .update(articles)
      .set({ downloads: sql`${articles.downloads} + 1` })
      .where(eq(articles.id, articleId))

    // In a real implementation, you would:
    // 1. Get the file URL from the database
    // 2. Generate a signed URL for secure download
    // 3. Return the download URL

    return NextResponse.json({
      success: true,
      downloadUrl: `/files/articles/${articleId}/manuscript.pdf`, // Placeholder
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${articleId}/download` })
    return NextResponse.json({ success: false, error: "Download failed" }, { status: 500 })
  }
}
