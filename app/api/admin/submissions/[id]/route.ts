import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, reviews, messages, conversations, articleVersions } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get submission details with author information
    const submissionData = await db
      .select({
        // Article data
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        updatedAt: articles.updatedAt,
        files: articles.files,
        keywords: articles.keywords,
        
        // Author data
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAffiliation: users.affiliation,
        authorOrcid: users.orcid,
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, submissionId))
      .limit(1)

    if (submissionData.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const submission = submissionData[0]

    // Get assigned reviewers
    const reviewersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        affiliation: users.affiliation,
        reviewId: reviews.id,
        reviewStatus: reviews.status,
        assignedDate: reviews.assignedDate,
        reviewDate: reviews.reviewDate,
        recommendation: reviews.recommendation,
        rating: reviews.rating,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.articleId, submissionId))
      .orderBy(desc(reviews.assignedDate))

    // Get reviews
    const reviewsData = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        reviewerName: users.name,
        status: reviews.status,
        recommendation: reviews.recommendation,
        comments: reviews.comments,
        confidentialComments: reviews.confidentialComments,
        submittedAt: reviews.reviewDate,
        rating: reviews.rating,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(and(
        eq(reviews.articleId, submissionId),
        eq(reviews.status, 'completed')
      ))
      .orderBy(desc(reviews.reviewDate))

    // Get article versions
    const versionsData = await db
      .select({
        id: articleVersions.id,
        versionNumber: articleVersions.versionNumber,
        title: articleVersions.title,
        abstract: articleVersions.abstract,
        files: articleVersions.files,
        changeLog: articleVersions.changeLog,
        createdAt: articleVersions.createdAt,
      })
      .from(articleVersions)
      .where(eq(articleVersions.articleId, submissionId))
      .orderBy(desc(articleVersions.versionNumber))

    // Get communications/messages
    const communicationsData = await db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        type: conversations.type,
        lastActivity: conversations.lastActivity,
        participants: conversations.participants,
        lastMessageContent: sql<string>`(
          SELECT content 
          FROM messages 
          WHERE conversation_id = ${conversations.id}
          ORDER BY created_at DESC 
          LIMIT 1
        )`
      })
      .from(conversations)
      .where(eq(conversations.relatedId, submissionId))
      .orderBy(desc(conversations.lastActivity))

    // Generate timeline events
    const timelineEvents = [
      {
        id: "submitted",
        action: "Submission Received",
        description: `Article "${submission.title}" was submitted for review`,
        performedBy: submission.authorName,
        performedByRole: "Author",
        timestamp: submission.submittedDate,
        metadata: { type: "submission" }
      },
      ...reviewersData.map(reviewer => ({
        id: `reviewer-assigned-${reviewer.id}`,
        action: "Reviewer Assigned",
        description: `${reviewer.name} was assigned as a reviewer`,
        performedBy: "System",
        performedByRole: "System",
        timestamp: reviewer.assignedDate,
        metadata: { type: "reviewer_assignment", reviewerId: reviewer.id }
      })),
      ...reviewsData.map(review => ({
        id: `review-${review.id}`,
        action: "Review Completed",
        description: `Review completed with recommendation: ${review.recommendation}`,
        performedBy: review.reviewerName,
        performedByRole: "Reviewer",
        timestamp: review.submittedAt,
        metadata: { type: "review", reviewId: review.id }
      })),
      ...versionsData.slice(1).map(version => ({
        id: `version-${version.id}`,
        action: "Revision Submitted",
        description: `Version ${version.versionNumber} submitted: ${version.changeLog || 'No change log provided'}`,
        performedBy: submission.authorName,
        performedByRole: "Author",
        timestamp: version.createdAt,
        metadata: { type: "revision", versionId: version.id }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Format files data
    const formattedFiles = (submission.files as any[])?.map(file => ({
      id: file.fileId || file.id,
      name: file.name,
      type: file.type,
      size: file.size || 0,
      category: file.category || 'manuscript',
      uploadedAt: file.uploadedAt || submission.submittedDate,
      url: file.url
    })) || []

    // Format reviewers data
    const formattedReviewers = reviewersData.map(reviewer => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      status: reviewer.reviewStatus || 'assigned',
      assignedDate: reviewer.assignedDate,
      completedDate: reviewer.reviewDate,
      recommendation: reviewer.recommendation
    }))

    // Format communications data
    const formattedCommunications = communicationsData.map(comm => ({
      id: comm.id,
      type: comm.type,
      subject: comm.subject,
      content: comm.lastMessageContent || '',
      sentBy: 'System', // This would need to be determined from participants
      sentTo: [submission.authorEmail],
      sentAt: comm.lastActivity,
      status: 'delivered'
    }))

    const detailedSubmission = {
      id: submission.id,
      title: submission.title,
      abstract: submission.abstract,
      category: submission.category,
      status: submission.status,
      authorId: submission.authorId,
      authorName: submission.authorName,
      authorEmail: submission.authorEmail,
      authorAffiliation: submission.authorAffiliation,
      submittedDate: submission.submittedDate,
      updatedAt: submission.updatedAt,
      reviewers: formattedReviewers,
      files: formattedFiles,
      timeline: timelineEvents,
      reviews: reviewsData,
      versions: versionsData,
      communications: formattedCommunications
    }

    return NextResponse.json({
      success: true,
      submission: detailedSubmission
    })
  } catch (error) {
    const { params } = context;
    const submissionId = params.id;
    logError(error as Error, { endpoint: `/api/admin/submissions/${submissionId}` })
    return NextResponse.json({ success: false, error: "Failed to fetch submission details" }, { status: 500 })
  }
}
