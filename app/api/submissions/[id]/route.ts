import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions, articles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissionId = params.id

    if (!submissionId) {
      return NextResponse.json({
        error: "Submission ID is required"
      }, { status: 400 })
    }

    // Fetch submission with article and author details
    const submission = await db.select({
      // Submission fields
      id: submissions.id,
      articleId: submissions.articleId,
      authorId: submissions.authorId,
      status: submissions.status,
      statusHistory: submissions.statusHistory,
      submittedAt: submissions.submittedAt,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      // Article fields
      title: articles.title,
      abstract: articles.abstract,
      keywords: articles.keywords,
      category: articles.category,
      files: articles.files,
      // Author fields
      authorName: users.name,
      authorEmail: users.email,
      authorAffiliation: users.affiliation,
    })
    .from(submissions)
    .leftJoin(articles, eq(submissions.articleId, articles.id))
    .leftJoin(users, eq(submissions.authorId, users.id))
    .where(eq(submissions.id, submissionId))
    .limit(1)

    if (submission.length === 0) {
      return NextResponse.json({
        error: "Submission not found"
      }, { status: 404 })
    }

    const submissionData = submission[0]

    // Check authorization - allow access for:
    // 1. The author of the submission
    // 2. Editorial staff (editors, editorial assistants, etc.)
    // 3. Assigned reviewers (would need additional check)
    const allowedRoles = [
      'admin', 'editor', 'editor-in-chief', 'managing-editor', 
      'section-editor', 'associate-editor', 'editorial-assistant', 
      'production-editor'
    ]

    const isAuthor = session.user.id === submissionData.authorId
    const isEditorialStaff = allowedRoles.includes(session.user.role)

    if (!isAuthor && !isEditorialStaff) {
      return NextResponse.json({
        error: "Access denied. You don't have permission to view this submission."
      }, { status: 403 })
    }

    // Transform the data to match the expected format
    const transformedSubmission = {
      id: submissionData.id,
      title: submissionData.title || "",
      abstract: submissionData.abstract || "",
      keywords: submissionData.keywords || [],
      category: submissionData.category || "",
      status: submissionData.status,
      submittedAt: submissionData.submittedAt,
      authorName: submissionData.authorName || "",
      authorEmail: submissionData.authorEmail || "",
      authorAffiliation: submissionData.authorAffiliation || "",
      files: submissionData.files || [],
      statusHistory: submissionData.statusHistory || [],
      createdAt: submissionData.createdAt,
      updatedAt: submissionData.updatedAt
    }

    logInfo("Submission fetched successfully", {
      operation: "fetchSubmission",
      submissionId,
      requestedBy: session.user.id,
      userRole: session.user.role
    })

    return NextResponse.json({
      success: true,
      submission: transformedSubmission
    })

  } catch (error) {
    logError("Error fetching submission", {
      operation: "fetchSubmission",
      submissionId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}