import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core"
import { eq, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

// Article versions table (add to main schema)
export const articleVersions = pgTable("article_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  content: text("content"),
  files: jsonb("files").$type<{ url: string; type: string; name: string; fileId: string }[]>(),
  changeLog: text("change_log"),
  submittedBy: uuid("submitted_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const articleId = resolvedParams.id

    const versions = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, articleId))
      .orderBy(desc(articleVersions.versionNumber))

    return NextResponse.json({
      success: true,
      versions,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/submissions/[id]/versions/route`/versions` })
    return NextResponse.json({ success: false, error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, abstract, content, files, changeLog } = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const articleId = resolvedParams.id

    // Get the latest version number
    const [latestVersion] = await db
      .select({ versionNumber: articleVersions.versionNumber })
      .from(articleVersions)
      .where(eq(articleVersions.articleId, articleId))
      .orderBy(desc(articleVersions.versionNumber))
      .limit(1)

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

    const [newVersion] = await db
      .insert(articleVersions)
      .values({
        articleId,
        versionNumber: newVersionNumber,
        title,
        abstract,
        content,
        files,
        changeLog,
        submittedBy: session.user.id,
      })
      .returning()

    return NextResponse.json({
      success: true,
      version: newVersion,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/submissions/[id]/versions/route`/versions POST` })
    return NextResponse.json({ success: false, error: "Failed to create version" }, { status: 500 })
  }
}
