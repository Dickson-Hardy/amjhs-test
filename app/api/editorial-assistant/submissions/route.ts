import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { submissions, articles, users } from "@/lib/db/schema"
import { eq, and, or, isNull, notInArray, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let whereCondition

    switch (filter) {
      case "pending_screening":
        // Get submissions that need initial screening
        whereCondition = or(
          eq(submissions.status, "submitted"),
          eq(submissions.status, "under_review")
        )
        break
      case "screening_in_progress":
        whereCondition = eq(submissions.status, "screening")
        break
      case "screening_completed":
        whereCondition = eq(submissions.status, "screening_completed")
        break
      case "rejected":
        whereCondition = eq(submissions.status, "rejected")
        break
      default:
        // All submissions accessible to editorial assistant
        whereCondition = undefined
    }

    // Build query with joins
    let query = db
      .select({
        id: submissions.id,
        status: submissions.status,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        authorId: submissions.authorId,
        articleId: submissions.articleId,
        title: articles.title,
        abstract: articles.abstract,
        keywords: articles.keywords,
        category: articles.category, // Using category instead of submissionType
        coAuthors: articles.coAuthors,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))

    if (whereCondition) {
      query = query.where(whereCondition)
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(submissions.createdAt)

    // Get total count for pagination
    let totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)

    if (whereCondition) {
      totalQuery = totalQuery.where(whereCondition)
    }

    const totalResults = await totalQuery
    const total = Number(totalResults[0]?.count || 0)

    // Format the results
    const formattedSubmissions = results.map(submission => ({
      id: submission.id,
      status: submission.status,
      title: submission.title || 'Untitled Submission',
      abstract: submission.abstract,
      keywords: submission.keywords || [],
      category: submission.category, // Using category instead of submissionType
      coAuthors: submission.coAuthors || [],
      authorId: submission.authorId,
      authorName: submission.authorName,
      authorEmail: submission.authorEmail,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      requiresScreening: ["submitted", "under_review"].includes(submission.status || "")
    }))

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filter
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/editorial-assistant/submissions", 
      action: "fetchSubmissions" 
    })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}