import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialAssistantService } from "@/lib/workflow"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { db } from "@/lib/db"
import { submissions, articles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Screening data validation schema
const screeningSchema = z.object({
  submissionId: z.string().uuid(),
  screeningData: z.object({
    fileCompleteness: z.boolean(),
    plagiarismCheck: z.boolean(),
    formatCompliance: z.boolean(),
    ethicalCompliance: z.boolean(),
    languageQuality: z.boolean(),
    technicalQuality: z.boolean().optional().default(false),
    scopeAlignment: z.boolean().optional().default(false),
    originalityCheck: z.boolean().optional().default(false),
    dataAvailability: z.boolean().optional().default(false),
    statisticalSoundness: z.boolean().optional().default(false),
    notes: z.string().optional().default(""),
    overallAssessment: z.string().optional().default(""),
    qualityScore: z.number().min(0).max(100).optional().default(0),
    completenessScore: z.number().min(0).max(100).optional().default(0),
    identifiedIssues: z.array(z.string()).optional().default([]),
    requiredRevisions: z.array(z.string()).optional().default([])
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = screeningSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { submissionId, screeningData } = validation.data
    const editorialAssistantId = session.user.id

    // Perform initial screening
    const editorialAssistantService = new EditorialAssistantService()
    const result = await editorialAssistantService.performInitialScreening(
      submissionId,
      editorialAssistantId,
      screeningData
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      nextStatus: result.nextStatus
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/screening", action: "performInitialScreening" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 })
    }

    // Get comprehensive submission details with joins
    const result = await db
      .select({
        // Submission fields
        submissionId: submissions.id,
        submissionStatus: submissions.status,
        submissionCreatedAt: submissions.createdAt,
        submissionUpdatedAt: submissions.updatedAt,
        statusHistory: submissions.statusHistory,
        submittedAt: submissions.submittedAt,
        
        // Article fields
        articleId: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        content: articles.content,
        keywords: articles.keywords,
        category: articles.category,
        coAuthors: articles.coAuthors,
        files: articles.files,
        doi: articles.doi,
        volume: articles.volume,
        issue: articles.issue,
        pages: articles.pages,
        publishedDate: articles.publishedDate,
        submittedDate: articles.submittedDate,
        reviewerIds: articles.reviewerIds,
        views: articles.views,
        downloads: articles.downloads,
        citations: articles.citations,
        metadata: articles.metadata,
        
        // Author fields
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAffiliation: users.affiliation,
        authorOrcid: users.orcid,
        authorBio: users.bio,
        authorExpertise: users.expertise
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(eq(submissions.id, submissionId))
      .limit(1)

    const submission = result[0]

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Format the response with all manuscript details
    const manuscriptData = {
      id: submission.submissionId,
      status: submission.submissionStatus,
      createdAt: submission.submissionCreatedAt,
      updatedAt: submission.submissionUpdatedAt,
      statusHistory: submission.statusHistory || [],
      submittedAt: submission.submittedAt,
      
      // Article information
      title: submission.title || 'Untitled Submission',
      abstract: submission.abstract || '',
      content: submission.content || '',
      keywords: submission.keywords || [],
      category: submission.category || 'Not specified',
      doi: submission.doi,
      volume: submission.volume,
      issue: submission.issue,
      pages: submission.pages,
      publishedDate: submission.publishedDate,
      submittedDate: submission.submittedDate,
      views: submission.views || 0,
      downloads: submission.downloads || 0,
      citations: submission.citations || 0,
      
      // Author information
      authorId: submission.authorId,
      authorName: submission.authorName,
      authorEmail: submission.authorEmail,
      authorAffiliation: submission.authorAffiliation,
      authorOrcid: submission.authorOrcid,
      authorBio: submission.authorBio,
      authorExpertise: submission.authorExpertise || [],
      
      // Co-authors
      coAuthors: submission.coAuthors || [],
      
      // Files and attachments
      files: submission.files || [],
      manuscript: submission.files && submission.files.length > 0 ? {
        filename: submission.files[0].name || 'manuscript.pdf',
        filesize: 2500000, // Default size if not available
        uploadedAt: submission.submittedDate || submission.submissionCreatedAt,
        url: submission.files[0].url
      } : null,
      
      supplementaryFiles: submission.files && submission.files.length > 1 ? 
        submission.files.slice(1).map((file: any) => ({
          filename: file.name || 'supplement.pdf',
          filesize: 1000000, // Default size
          type: file.type || 'application/pdf',
          uploadedAt: submission.submittedDate || submission.submissionCreatedAt,
          url: file.url
        })) : [],
      
      // Extract metadata for ethics, funding, etc. if available
      ethics: submission.metadata?.ethics || {
        hasEthicsApproval: false,
        hasConflictOfInterest: false,
        hasInformedConsent: false
      },
      
      funding: submission.metadata?.funding || {
        hasFunding: false
      },
      
      // Cover letter and reviewer suggestions from metadata
      coverLetter: submission.metadata?.coverLetter || '',
      suggestedReviewers: submission.metadata?.suggestedReviewers || [],
      excludedReviewers: submission.metadata?.excludedReviewers || [],
      
      // Additional metadata
      submissionType: submission.metadata?.submissionType || 'Not specified'
    }

    return NextResponse.json({
      success: true,
      submission: manuscriptData
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/screening", action: "fetchSubmission" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
