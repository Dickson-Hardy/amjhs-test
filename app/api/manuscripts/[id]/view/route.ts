import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { pageViews, submissions } from '@/lib/db/schema'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const submissionId = params.id

    if (!submissionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission ID is required' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { userRole } = body

    // Get submission data
    const submission = await db
      .select({
        id: submissions.id,
        articleId: submissions.articleId,
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)
      .then(results => results[0] || null)

    if (!submission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission not found' 
      }, { status: 404 })
    }

    // Track the view
    if (submission.articleId) {
      await db.insert(pageViews).values({
        articleId: submission.articleId,
        userId: session?.user?.id || null,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        sessionId: session?.user?.id || 'anonymous',
        pageType: 'manuscript_preview',
        viewDuration: 0,
        isBot: false,
        referrer: request.headers.get('referer') || null,
        createdAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully'
    })

  } catch (error) {
    console.error('View tracking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}