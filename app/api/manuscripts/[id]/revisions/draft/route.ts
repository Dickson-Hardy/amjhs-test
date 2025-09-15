import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, articleVersions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import { logError } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const articleId = params.id

    const { responseToReviewers = "", changesDescription = "" } = await request.json().catch(() => ({ }))

    // Fetch article and verify ownership
    const articleRows = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1)
    if (!articleRows.length) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 })
    }
    const article = articleRows[0]

    if (article.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Find latest version for this article
    const latest = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, articleId))
      .orderBy(desc(articleVersions.versionNumber))
      .limit(1)

    const latestVersion = latest[0]

    // If latest is an explicit DRAFT entry, update it instead of inserting a new row
    const isLatestDraft = latestVersion?.changeLog?.startsWith("[DRAFT]")

    const draftChangeLog = [
      "[DRAFT] Revision draft saved",
      "",
      "Response to Reviewers:",
      responseToReviewers || "(empty)",
      "",
      "Changes Description:",
      changesDescription || "(empty)",
    ].join("\n")

    if (isLatestDraft) {
      // Update existing draft entry
      await db
        .update(articleVersions)
        .set({
          changeLog: draftChangeLog,
          // keep files as-is (may be empty), title/abstract/content unchanged
        })
        .where(eq(articleVersions.id, latestVersion.id))
    } else {
      // Insert a new draft version (does not change workflow status)
      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1
      await db.insert(articleVersions).values({
        id: uuidv4(),
        articleId,
        versionNumber: newVersionNumber,
        title: article.title,
        abstract: article.abstract,
        content: article.content,
        files: [],
        changeLog: draftChangeLog,
        createdBy: session.user.id,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({ success: true, message: "Draft saved" })
  } catch (error) {
    try {
      const params = await Promise.resolve((context as any)?.params)
      logError(error as Error, { endpoint: `/api/manuscripts/${params?.id}/revisions/draft` })
    } catch {}
    return NextResponse.json({ success: false, error: "Failed to save draft" }, { status: 500 })
  }
}
