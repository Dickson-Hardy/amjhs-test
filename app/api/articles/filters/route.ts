import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { sql, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const [categoriesResult, yearsResult] = await Promise.all([
      // Get unique categories
      db
        .select({ category: articles.category })
        .from(articles)
        .where(sql`${articles.status} = 'published'`)
        .groupBy(articles.category)
        .orderBy(articles.category),

      // Get unique years
      db
        .select({ year: sql<string>`EXTRACT(YEAR FROM ${articles.publishedDate})::text` })
        .from(articles)
        .where(sql`${articles.status} = 'published' AND ${articles.publishedDate} IS NOT NULL`)
        .groupBy(sql`EXTRACT(YEAR FROM ${articles.publishedDate})`)
        .orderBy(desc(sql`EXTRACT(YEAR FROM ${articles.publishedDate})`)),
    ])

    const categories = categoriesResult.map((r) => r.category).filter(Boolean)
    const years = yearsResult.map((r) => r.year).filter(Boolean)

    return NextResponse.json({
      success: true,
      categories,
      years,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/articles/filters" })
    return NextResponse.json({ success: false, error: "Failed to fetch filters" }, { status: 500 })
  }
}
