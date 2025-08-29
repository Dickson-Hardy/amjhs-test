import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { issues, articles } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { logError } from "@/lib/logger"

// GET - Fetch all issues for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Fetch all issues with article counts
    const issuesWithCounts = await db.select({
      id: issues.id,
      volume: issues.volume,
      number: issues.number,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      publishedDate: issues.publishedDate,
      guestEditors: issues.guestEditors,
      coverImage: issues.coverImage,
      pageRange: issues.pageRange,
      doi: issues.doi,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      articlesCount: count(articles.id)
    })
    .from(issues)
    .leftJoin(articles, eq(articles.issueId, issues.id))
    .groupBy(issues.id)
    .orderBy(desc(issues.createdAt))

    return NextResponse.json({
      success: true,
      issues: issuesWithCounts
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/issues' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch issues" 
    }, { status: 500 })
  }
}
