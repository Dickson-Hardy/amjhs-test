import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"
import { issues, articles, volumes } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    // Get the latest published issue since there's no isCurrent field
    const latestIssue = await db
      .select()
      .from(issues)
      .where(eq(issues.status, "published"))
      .orderBy(desc(issues.publishedDate))
      .limit(1)

    if (latestIssue.length === 0) {
      return NextResponse.json({
        success: true,
        issue: null,
        articles: [],
      })
    }

    const currentIssue = latestIssue[0]
    
    // Get articles for this issue using volume and issue numbers
    const issueArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        status: articles.status,
        doi: articles.doi,
        volume: articles.volume,
        issue: articles.issue,
        pages: articles.pages,
        publishedDate: articles.publishedDate,
        authorId: articles.authorId,
        coAuthors: articles.coAuthors,
        views: articles.views,
        downloads: articles.downloads,
        citations: articles.citations,
        keywords: articles.keywords,
      })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.volume, currentIssue.volumeId?.toString() || currentIssue.number?.toString() || "1"),
          eq(articles.issue, currentIssue.number?.toString() || "1")
        )
      )
      .orderBy(desc(articles.publishedDate))

    return NextResponse.json({
      success: true,
      issue: {
        id: currentIssue.id,
        title: currentIssue.title,
        number: currentIssue.number,
        description: currentIssue.description,
        publishedDate: currentIssue.publishedDate,
        coverImage: currentIssue.coverImage,
        status: currentIssue.status,
        specialIssue: currentIssue.specialIssue,
        guestEditors: currentIssue.guestEditors,
      },
      articles: issueArticles,
    })

  } catch (error) {
    console.error("Error fetching current issue data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current issue data",
      },
      { status: 500 }
    )
  }
}
