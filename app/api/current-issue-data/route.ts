import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"
import { issues, articles, volumes } from "@/lib/db/schema"

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
    
    // Get articles for this issue (if we have the proper relationship)
    // For now, return the issue data without articles since the relationship may not exist
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
      articles: [], // Return empty for now since we need to check article-issue relationship
    })

  } catch (error) {
    logger.error("Error fetching current issue data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current issue data",
      },
      { status: 500 }
    )
  }
}
