import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions, issues, volumes, articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAdminAction } from "@/lib/admin-logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { articleId, issueId } = await request.json()

    // Validate input
    if (!articleId || !issueId) {
      return NextResponse.json(
        { error: "Article ID and Issue ID are required" },
        { status: 400 }
      )
    }

    // Check if article exists and is accepted
    const article = await db
      .select({
        id: submissions.id,
        status: submissions.status,
        articleId: submissions.articleId,
        title: articles.title
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .where(eq(submissions.id, articleId))
      .limit(1)

    if (article.length === 0) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    if (!['accepted', 'ready_for_publication'].includes(article[0].status)) {
      return NextResponse.json(
        { error: "Article must be accepted before assignment to issue" },
        { status: 400 }
      )
    }

    // Check if issue exists
    const issue = await db
      .select({
        id: issues.id,
        number: issues.number,
        title: issues.title,
        status: issues.status,
        volumeId: issues.volumeId
      })
      .from(issues)
      .where(eq(issues.id, issueId))
      .limit(1)

    if (issue.length === 0) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      )
    }

    if (issue[0].status === 'published') {
      return NextResponse.json(
        { error: "Cannot assign articles to published issues" },
        { status: 400 }
      )
    }

    // Get volume info for logging
    const volume = issue[0].volumeId ? await db
      .select()
      .from(volumes)
      .where(eq(volumes.id, issue[0].volumeId))
      .limit(1) : []

    // Assign article to issue (update status to indicate assignment)
    const updatedArticle = await db
      .update(submissions)
      .set({
        status: 'ready_for_publication',
        updatedAt: new Date()
      })
      .where(eq(submissions.id, articleId))
      .returning()

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'ASSIGN_ARTICLE_TO_ISSUE',
      resourceType: 'submission',
      resourceId: articleId,
      details: `Assigned article "${article[0].title || 'Untitled'}" to issue ${issue[0].number} of volume ${volume[0]?.number} (${volume[0]?.year})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      article: updatedArticle[0],
      issue: issue[0],
      message: `Article assigned to issue ${issue[0].number} successfully`
    })

  } catch (error) {
    logger.error("Error assigning article to issue:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
