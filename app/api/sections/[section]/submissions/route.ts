import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews, users } from "@/lib/db/schema"
import { eq, desc, sql, and, inArray } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request, context: { params: Promise<{ section: string }> | { section: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const section = decodeURIComponent(params.section);
    const session = await getServerSession(authOptions)
    
    // Check if user has editor permissions
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!session?.user || !allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build where conditions
    let whereConditions = [eq(articles.category, section)]
    
    if (status && status !== 'all') {
      whereConditions.push(eq(articles.status, status))
    }

    // Get section submissions
    const sectionSubmissions = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        authorId: articles.authorId,
        editorId: articles.editorId,
        reviewerIds: articles.reviewerIds,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        reviewerCount: sql<number>`(
          SELECT COUNT(*) FROM ${reviews} 
          WHERE ${reviews.articleId} = ${articles.id}
        )`,
        completedReviews: sql<number>`(
          SELECT COUNT(*) FROM ${reviews} 
          WHERE ${reviews.articleId} = ${articles.id} 
          AND ${reviews.status} = 'completed'
        )`,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(articles.submittedDate))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...whereConditions))

    const totalCount = totalCountResult[0]?.count || 0

    // Format submissions for frontend
    const formattedSubmissions = sectionSubmissions.map((submission) => ({
      id: submission.id,
      title: submission.title,
      abstract: submission.abstract,
      category: submission.category,
      status: submission.status,
      submittedDate: submission.submittedDate,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      author: submission.author,
      authorId: submission.authorId,
      editorId: submission.editorId,
      reviewerIds: submission.reviewerIds,
      reviewers: submission.reviewerCount || 0,
      completedReviews: submission.completedReviews || 0,
      lastUpdate: submission.updatedAt || submission.submittedDate,
      daysSinceSubmission: submission.submittedDate 
        ? Math.floor((Date.now() - new Date(submission.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      needsAction: submission.status === 'technical_check' || submission.status === 'revision_requested',
    }))

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      section,
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const section = params.section;
    logError(error as Error, { endpoint: `/api/sections/${section}/submissions` })
    return NextResponse.json({ success: false, error: "Failed to fetch section submissions" }, { status: 500 })
  }
}
