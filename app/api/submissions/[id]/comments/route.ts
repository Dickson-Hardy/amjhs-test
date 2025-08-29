import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { eq, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

// Comments table schema (add to main schema file)
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").notNull(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'review', 'editorial', 'author_response'
  isPrivate: text("is_private").default("false"), // for confidential comments
  lineNumber: integer("line_number"), // for inline annotations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const articleId = resolvedParams.id

    // Check if user has access to this article's comments
    // Implementation would check if user is author, reviewer, or editor

    const articleComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        type: comments.type,
        lineNumber: comments.lineNumber,
        createdAt: comments.createdAt,
        authorName: text("author_name"), // Would join with users table
      })
      .from(comments)
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json({
      success: true,
      comments: articleComments,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/submissions/[id]/comments/route`/comments` })
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, type, isPrivate, lineNumber } = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const articleId = resolvedParams.id

    const [newComment] = await db
      .insert(comments)
      .values({
        articleId,
        userId: session.user.id,
        content,
        type,
        isPrivate: isPrivate ? "true" : "false",
        lineNumber,
      })
      .returning()

    return NextResponse.json({
      success: true,
      comment: newComment,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/submissions/[id]/comments/route`/comments POST` })
    return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 })
  }
}
