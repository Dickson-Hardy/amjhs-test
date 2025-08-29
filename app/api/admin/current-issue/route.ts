import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { issues, articles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

// GET - Get current issue and its articles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Find current issue
    const [currentIssue] = await db.select()
      .from(issues)
      .where(eq(issues.status, 'current'))
      .limit(1)

    if (!currentIssue) {
      return NextResponse.json({
        success: true,
        issue: null,
        articles: []
      })
    }

    // Get articles for current issue
    const issueArticles = await db.select({
      id: articles.id,
      title: articles.title,
      authors: articles.authors,
      category: articles.category,
      status: articles.status,
      publishedDate: articles.publishedDate,
      doi: articles.doi,
      pages: articles.pages
    }).from(articles)
    .where(and(
      eq(articles.issueId, currentIssue.id),
      eq(articles.status, 'published')
    ))

    return NextResponse.json({
      success: true,
      issue: currentIssue,
      articles: issueArticles
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/current-issue' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch current issue" 
    }, { status: 500 })
  }
}

// PUT - Set a new current issue
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { issueId } = body

    if (!issueId) {
      return NextResponse.json({
        success: false,
        error: "Issue ID is required"
      }, { status: 400 })
    }

    // First, set all issues to non-current
    await db.update(issues)
      .set({ 
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(issues.status, 'current'))

    // Then set the selected issue as current
    const [updatedIssue] = await db.update(issues)
      .set({ 
        status: 'current',
        updatedAt: new Date()
      })
      .where(eq(issues.id, issueId))
      .returning()

    if (!updatedIssue) {
      return NextResponse.json({
        success: false,
        error: "Issue not found"
      }, { status: 404 })
    }

    logInfo('Current issue updated', { 
      newCurrentIssueId: issueId,
      volume: updatedIssue.volume,
      number: updatedIssue.number,
      updatedBy: session.user.id 
    })

    return NextResponse.json({
      success: true,
      issue: updatedIssue
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/current-issue PUT' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to set current issue" 
    }, { status: 500 })
  }
}
