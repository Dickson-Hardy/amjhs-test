import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { issues, articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAdminAction } from "@/lib/admin-logger"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const issueId = params.id

    // Check if issue exists
    const issue = await db
      .select()
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
        { error: "Issue is already published" },
        { status: 400 }
      )
    }

    // Check if issue has unknown articles
    const articlesCount = await db
      .select()
      .from(articles)
      .where(eq(articles.issue, issue[0].number))

    if (articlesCount.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish issue without articles" },
        { status: 400 }
      )
    }

    // Publish the issue
    const publishedIssue = await db
      .update(issues)
      .set({
        status: 'published',
        publishedDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(issues.id, issueId))
      .returning()

    // Update all articles in this issue to published status
    await db
      .update(articles)
      .set({
        status: 'published',
        publishedDate: new Date()
      })
      .where(eq(articles.issue, issue[0].number))

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'PUBLISH_ISSUE',
      resourceType: 'issue',
      resourceId: issueId,
      details: `Published issue ${issue[0].number} - ${issue[0].title} with ${articlesCount.length} articles`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      issue: publishedIssue[0],
      articlesPublished: articlesCount.length,
      message: `Issue ${issue[0].number} published successfully with ${articlesCount.length} articles`
    })

  } catch (error) {
    logger.error("Error publishing issue:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
