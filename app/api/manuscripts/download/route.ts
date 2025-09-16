import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { articles, submissions, users } from '@/lib/db/schema'

interface ManuscriptDownloadRequest {
  submissionId: string
  fileId?: string
  userRole: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body: ManuscriptDownloadRequest = await request.json()
    const { submissionId, fileId, userRole } = body

    if (!submissionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission ID is required' 
      }, { status: 400 })
    }

    // Get submission with article data
    const submission = await db
      .select({
        id: submissions.id,
        articleId: submissions.articleId,
        authorId: submissions.authorId,
        status: submissions.status,
        article: {
          id: articles.id,
          title: articles.title,
          files: articles.files,
          editorId: articles.editorId,
          authorId: articles.authorId
        }
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .where(eq(submissions.id, submissionId))
      .limit(1)
      .then(results => results[0] || null)

    if (!submission || !submission.article) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission not found' 
      }, { status: 404 })
    }

    // Check user permissions based on role
    const hasPermission = await checkDownloadPermission(
      session.user.id,
      submission,
      userRole
    )

    if (!hasPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions to download this manuscript' 
      }, { status: 403 })
    }

    // Get the requested file or the first manuscript file
    const files = submission.article.files as { id: string; name: string; url: string; type: string; fileId: string }[]
    
    let targetFile = null
    if (fileId) {
      targetFile = files?.find(f => f.id === fileId || f.fileId === fileId)
    } else {
      // Get the main manuscript file
      targetFile = files?.find(f => f.type === 'manuscript') || files?.[0]
    }

    if (!targetFile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Manuscript file not found' 
      }, { status: 404 })
    }

    // Log the download activity
    await logDownloadActivity(
      session.user.id,
      submissionId,
      targetFile.id,
      userRole
    )

    // Return the download URL
    return NextResponse.json({
      success: true,
      downloadUrl: targetFile.url,
      filename: targetFile.name,
      fileType: targetFile.type,
      message: 'Download URL generated successfully'
    })

  } catch (error) {
    console.error('Manuscript download error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Check if user has permission to download the manuscript
 */
async function checkDownloadPermission(
  userId: string,
  submission: any,
  userRole: string
): Promise<boolean> {
  try {
    const user = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(results => results[0] || null)

    if (!user) return false

    // Admin and editor-in-chief can access all manuscripts
    if (user.role === 'admin' || user.role === 'editor-in-chief') {
      return true
    }

    // Authors can access their own manuscripts
    if (submission.authorId === userId || submission.article.authorId === userId) {
      return true
    }

    // Editorial assistants can access submitted manuscripts for screening
    if (user.role === 'editorial-assistant') {
      return ['submitted', 'editorial_assistant_review', 'associate_editor_assignment'].includes(submission.status)
    }

    // Associate editors can access manuscripts assigned to them
    if (user.role === 'associate-editor') {
      return submission.article.editorId === userId
    }

    // Managing editors can access all manuscripts
    if (user.role === 'managing-editor') {
      return true
    }

    // Reviewers can access manuscripts they are assigned to review
    // (This would require checking reviewer assignments table)
    if (user.role === 'reviewer') {
      // TODO: Check reviewer assignments
      return false
    }

    return false
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * Log download activity for audit purposes
 */
async function logDownloadActivity(
  userId: string,
  submissionId: string,
  fileId: string,
  userRole: string
): Promise<void> {
  try {
    // You could implement this with a dedicated downloads table
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Download activity: User ${userId} (${userRole}) downloaded file ${fileId} from submission ${submissionId}`)
    }
    
    // TODO: Implement proper audit logging
    // await db.insert(downloadLogs).values({
    //   userId,
    //   submissionId,
    //   fileId,
    //   userRole,
    //   downloadedAt: new Date()
    // })
    
  } catch (error) {
    console.error('Failed to log download activity:', error)
    // Don't throw error as this is not critical for the download functionality
  }
}