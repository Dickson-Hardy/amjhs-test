import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { submissions, articles, users } from "@/lib/db/schema"
import { eq, and, or, sql, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  let session: any = null
  try {
    session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor role
    if (!["editor", "chief-editor", "associate-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search")

    // Build where conditions based on editor's access level
    let whereConditions = []

    // Filter by status if provided
    if (status) {
      whereConditions.push(eq(submissions.status, status))
    }

    // Filter by category if provided
    if (category) {
      whereConditions.push(eq(articles.category, category))
    }

    // Apply role-based filtering
    switch (filter) {
      case "assigned_to_me":
        // Only submissions assigned to this editor
        whereConditions.push(eq(articles.editorId, session.user.id))
        break
      case "pending_assignment":
        // Submissions needing editor assignment
        whereConditions.push(
          or(
            eq(submissions.status, "editorial_assistant_review"),
            eq(submissions.status, "associate_editor_assignment")
          )
        )
        break
      case "under_review":
        // Submissions currently under peer review
        whereConditions.push(eq(submissions.status, "under_review"))
        break
      case "revision_requested":
        // Submissions with requested revisions
        whereConditions.push(eq(submissions.status, "revision_requested"))
        break
      case "ready_for_decision":
        // Submissions with completed reviews ready for editorial decision
        whereConditions.push(
          and(
            eq(submissions.status, "under_review"),
            sql`array_length(${articles.reviewerIds}, 1) >= 2` // At least 2 reviewers assigned
          )
        )
        break
      case "recently_submitted":
        // Recently submitted manuscripts (last 7 days)
        whereConditions.push(
          sql`${submissions.submittedAt} >= NOW() - INTERVAL '7 days'`
        )
        break
      default:
        // All submissions accessible to editor (exclude drafts)
        whereConditions.push(
          sql`${submissions.status} != 'draft'`
        )
    }

    // Build the main query
    let query = db
      .select({
        // Submission fields
        submissionId: submissions.id,
        submissionStatus: submissions.status,
        submissionCreatedAt: submissions.createdAt,
        submissionUpdatedAt: submissions.updatedAt,
        submittedAt: submissions.submittedAt,
        statusHistory: submissions.statusHistory,
        
        // Article fields
        articleId: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        keywords: articles.keywords,
        category: articles.category,
        coAuthors: articles.coAuthors,
        editorId: articles.editorId,
        reviewerIds: articles.reviewerIds,
        files: articles.files,
        doi: articles.doi,
        views: articles.views,
        downloads: articles.downloads,
        citations: articles.citations,
        submittedDate: articles.submittedDate,
        
        // Author fields
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAffiliation: users.affiliation,
        authorOrcid: users.orcid
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .leftJoin(users, eq(submissions.authorId, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(submissions.submittedAt))

    // Build final where conditions combining filters and search
    let finalWhereConditions = whereConditions

    if (search) {
      const searchConditions = or(
        sql`${articles.title} ILIKE ${'%' + search + '%'}`,
        sql`${articles.abstract} ILIKE ${'%' + search + '%'}`,
        sql`${users.name} ILIKE ${'%' + search + '%'}`,
        sql`${users.email} ILIKE ${'%' + search + '%'}`
      )
      finalWhereConditions = [...whereConditions, searchConditions]
    }

    // Build the main query with all conditions in one go
    const selectFields = {
      // Submission fields
      submissionId: submissions.id,
      submissionStatus: submissions.status,
      submissionCreatedAt: submissions.createdAt,
      submissionUpdatedAt: submissions.updatedAt,
      submittedAt: submissions.submittedAt,
      statusHistory: submissions.statusHistory,
      
      // Article fields
      articleId: articles.id,
      title: articles.title,
      abstract: articles.abstract,
      keywords: articles.keywords,
      category: articles.category,
      coAuthors: articles.coAuthors,
      editorId: articles.editorId,
      reviewerIds: articles.reviewerIds,
      files: articles.files,
      doi: articles.doi,
      views: articles.views,
      downloads: articles.downloads,
      citations: articles.citations,
      submittedDate: articles.submittedDate,
      
      // Author fields
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorAffiliation: users.affiliation,
      authorOrcid: users.orcid
    }

    // Execute the main query
    const results = finalWhereConditions.length > 0 
      ? await db
          .select(selectFields)
          .from(submissions)
          .leftJoin(articles, eq(submissions.articleId, articles.id))
          .leftJoin(users, eq(submissions.authorId, users.id))
          .where(and(...finalWhereConditions))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(submissions.submittedAt))
      : await db
          .select(selectFields)
          .from(submissions)
          .leftJoin(articles, eq(submissions.articleId, articles.id))
          .leftJoin(users, eq(submissions.authorId, users.id))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(submissions.submittedAt))

    // Get total count for pagination
    const totalResults = finalWhereConditions.length > 0
      ? await db
          .select({ count: sql`count(*)` })
          .from(submissions)
          .leftJoin(articles, eq(submissions.articleId, articles.id))
          .leftJoin(users, eq(submissions.authorId, users.id))
          .where(and(...finalWhereConditions))
      : await db
          .select({ count: sql`count(*)` })
          .from(submissions)
          .leftJoin(articles, eq(submissions.articleId, articles.id))
          .leftJoin(users, eq(submissions.authorId, users.id))
    const total = Number(totalResults[0]?.count) || 0

    // Format submissions for response
    const formattedSubmissions = results.map(submission => ({
      id: submission.submissionId,
      articleId: submission.articleId,
      status: submission.submissionStatus,
      title: submission.title || 'Untitled Submission',
      abstract: submission.abstract ? submission.abstract.substring(0, 200) + '...' : '',
      category: submission.category || 'Not specified',
      keywords: submission.keywords || [],
      
      // Author information
      author: {
        id: submission.authorId,
        name: submission.authorName,
        email: submission.authorEmail,
        affiliation: submission.authorAffiliation,
        orcid: submission.authorOrcid
      },
      
      // Co-authors summary
      coAuthorsCount: submission.coAuthors ? (submission.coAuthors as any[]).length : 0,
      
      // Editorial information
      editorId: submission.editorId,
      isAssignedToCurrentUser: submission.editorId === session.user.id,
      
      // Review information
      reviewerCount: submission.reviewerIds ? (submission.reviewerIds as string[]).length : 0,
      
      // File information
      hasFiles: submission.files ? (submission.files as any[]).length > 0 : false,
      fileCount: submission.files ? (submission.files as any[]).length : 0,
      
      // Metrics
      views: submission.views || 0,
      downloads: submission.downloads || 0,
      citations: submission.citations || 0,
      
      // Dates
      submittedAt: submission.submittedAt,
      submittedDate: submission.submittedDate,
      createdAt: submission.submissionCreatedAt,
      updatedAt: submission.submissionUpdatedAt,
      
      // Workflow tracking
      statusHistory: submission.statusHistory || [],
      currentStage: submission.submissionStatus,
      
      // Quick actions available
      availableActions: getAvailableActions(submission.submissionStatus, submission.editorId, session.user.id),
      
      // Priority and urgency indicators
      priority: calculatePriority(submission.submittedAt, submission.submissionStatus),
      daysSinceSubmission: submission.submittedAt || submission.submissionCreatedAt 
        ? Math.floor((Date.now() - new Date(submission.submittedAt || submission.submissionCreatedAt!).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      
      // DOI information
      doi: submission.doi,
      hasDoi: !!submission.doi
    }))

    // Get summary statistics for the current filter
    const stats = await getEditorStats(session.user.id, filter)

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      },
      filter,
      stats,
      metadata: {
        categories: await getAvailableCategories(),
        statuses: await getAvailableStatuses(),
        totalSubmissions: total
      }
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/editor/submissions", 
      action: "fetchEditorSubmissions",
      userId: session?.user?.id 
    })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// Helper function to determine available actions based on status and assignment
function getAvailableActions(status: string, editorId: string | null, currentUserId: string) {
  const actions = []
  
  switch (status) {
    case "editorial_assistant_review":
    case "associate_editor_assignment":
      if (!editorId) {
        actions.push("assign_to_me", "assign_to_editor")
      }
      actions.push("view_details", "view_files")
      break
    case "associate_editor_review":
      if (editorId === currentUserId) {
        actions.push("review", "assign_reviewers", "request_revision", "reject")
      }
      actions.push("view_details", "view_files", "view_history")
      break
    case "reviewer_assignment":
      if (editorId === currentUserId) {
        actions.push("assign_reviewers", "view_suggested_reviewers")
      }
      actions.push("view_details", "view_files")
      break
    case "under_review":
      if (editorId === currentUserId) {
        actions.push("view_reviews", "send_reminder", "make_decision")
      }
      actions.push("view_details", "view_files", "monitor_progress")
      break
    case "revision_requested":
      actions.push("view_details", "view_revision_requirements", "monitor_deadline")
      break
    case "revision_submitted":
      if (editorId === currentUserId) {
        actions.push("review_revision", "accept", "request_further_revision")
      }
      actions.push("view_details", "view_files", "compare_versions")
      break
    case "accepted":
      actions.push("view_details", "schedule_publication", "assign_doi")
      break
    case "published":
      actions.push("view_details", "view_metrics", "manage_postpub")
      break
    default:
      actions.push("view_details")
  }
  
  return actions
}

// Helper function to calculate submission priority
function calculatePriority(submittedAt: Date | null, status: string): "low" | "medium" | "high" | "urgent" {
  if (!submittedAt) return "medium"
  
  const daysSinceSubmission = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24))
  
  // Priority based on status and time
  if (status === "revision_requested" && daysSinceSubmission > 30) return "urgent"
  if (status === "under_review" && daysSinceSubmission > 45) return "high"
  if (status === "associate_editor_review" && daysSinceSubmission > 14) return "high"
  if (daysSinceSubmission > 21) return "medium"
  
  return "low"
}

// Helper function to get editor statistics
async function getEditorStats(editorId: string, filter: string) {
  try {
    const stats = await db
      .select({
        status: submissions.status,
        count: sql`count(*)`
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .where(
        filter === "assigned_to_me" 
          ? eq(articles.editorId, editorId)
          : sql`${submissions.status} != 'draft'`
      )
      .groupBy(submissions.status)

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = Number(stat.count)
      return acc
    }, {} as Record<string, number>)

    return {
      totalAssigned: statsMap.associate_editor_review || 0,
      underReview: statsMap.under_review || 0,
      awaitingDecision: statsMap.revision_submitted || 0,
      pendingAssignment: (statsMap.editorial_assistant_review || 0) + (statsMap.associate_editor_assignment || 0),
      recentlyCompleted: (statsMap.accepted || 0) + (statsMap.published || 0)
    }
  } catch (error) {
    return {
      totalAssigned: 0,
      underReview: 0,
      awaitingDecision: 0,
      pendingAssignment: 0,
      recentlyCompleted: 0
    }
  }
}

// Helper function to get available categories
async function getAvailableCategories() {
  try {
    const categories = await db
      .select({ category: articles.category })
      .from(articles)
      .where(sql`${articles.category} IS NOT NULL`)
      .groupBy(articles.category)
      .orderBy(articles.category)

    return categories.map(c => c.category).filter(Boolean)
  } catch (error) {
    return [
      "bioengineering",
      "biomedical-engineering", 
      "biotechnology",
      "computational-biology",
      "medical-devices",
      "tissue-engineering",
      "biomaterials",
      "bioinformatics"
    ]
  }
}

// Helper function to get available statuses
async function getAvailableStatuses() {
  return [
    "submitted",
    "editorial_assistant_review",
    "associate_editor_assignment", 
    "associate_editor_review",
    "reviewer_assignment",
    "under_review",
    "revision_requested",
    "revision_submitted",
    "accepted",
    "rejected",
    "published",
    "withdrawn"
  ]
}