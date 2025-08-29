import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const articleId = params.id

    // Increment view count for preview
    await db
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, articleId))

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${params.id}/view` })
    return NextResponse.json({ success: false, error: "Failed to track view" }, { status: 500 })
  }
}
