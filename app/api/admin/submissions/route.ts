import { NextRequest } from "next/server"
import * as crypto from "crypto"
import { z } from "zod"
import { requireAuth, ROLES, createPaginatedResponse, createErrorResponse, withErrorHandler } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { submissions, articles, users, reviews } from "@/lib/db/schema"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

const querySchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform(v => (v ? Math.min(parseInt(v), 100) : 20)),
  status: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
})

async function getAdminSubmissions(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Only admins can access this list
    await requireAuth(request, [ROLES.ADMIN])

    const { searchParams } = new URL(request.url)
    const { page, limit, status, search, category } = querySchema.parse(Object.fromEntries(searchParams))
    const offset = (page - 1) * limit

    const conditions = [] as any[]

    if (status && status !== "all") {
      conditions.push(eq(submissions.status, status))
    }
    if (category && category !== "all") {
      conditions.push(eq(articles.category, category))
    }
    if (search && search.trim()) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(users.name, `%${search}%`),
          ilike(articles.category, `%${search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Base query joining submissions with article and author
    const rows = await db
      .select({
        submissionId: submissions.id,
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        articleStatus: articles.status,
        submissionStatus: submissions.status,
        submittedDate: articles.submittedDate,
        updatedAt: articles.updatedAt,
        editorId: articles.editorId,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        reviewerCount: sql<number>`(
          SELECT count(*)::int FROM reviews r WHERE r.article_id = ${articles.id}
        )`,
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset)

    // Total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    // Map to UI-friendly shape; keep rich fields for potential detail views
    const data = rows.map((row) => ({
      id: row.id,
      submissionId: row.submissionId,
      title: row.title,
      category: row.category,
      status: row.submissionStatus || row.articleStatus,
      submittedDate: row.submittedDate?.toISOString?.() ?? null,
      updatedAt: row.updatedAt?.toISOString?.() ?? null,
      author: {
        id: row.authorId,
        name: row.authorName,
        email: row.authorEmail,
      },
      reviewerCount: row.reviewerCount || 0,
      assignedEditor: row.editorId ? "Assigned" : "Unassigned",
    }))

    return createPaginatedResponse(data, { page, limit, total }, "Submissions retrieved successfully", requestId)
  } catch (error) {
    return createErrorResponse(error as Error, requestId)
  }
}

export const GET = withErrorHandler(getAdminSubmissions)
