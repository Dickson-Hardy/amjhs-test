import { workflowManager } from "./workflow"
import { sendEmail, sendWorkflowNotification } from "./email-hybrid"
import { logError, logInfo } from "./logger"
import { db } from "./db"
import { submissions, articles, users, notifications } from "./db/schema"
import { eq, and, desc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export interface WorkflowIntegrationConfig {
  enableEmailNotifications: boolean
  enableRealTimeUpdates: boolean
  enableAuditLogging: boolean
  maxRetries: number
  retryDelay: number
}

export class WorkflowIntegrationService {
  private config: WorkflowIntegrationConfig

  constructor(config: Partial<WorkflowIntegrationConfig> = {}) {
    this.config = {
      enableEmailNotifications: true,
      enableRealTimeUpdates: true,
      enableAuditLogging: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    }
  }

  /**
   * Submit article and trigger workflow
   */
  async submitArticle(articleData: unknown, authorId: string) {
    try {
      logInfo("Starting article submission workflow", { authorId, title: articleData.title })

      // Submit through workflow manager
      const result = await workflowManager.submitArticle(articleData, authorId)

      if (!result.success) {
        throw new AppError(result.message || "Workflow submission failed")
      }

      // Send confirmation email to author
      if (this.config.enableEmailNotifications) {
        await this.sendSubmissionConfirmation(authorId, result.submissionId!, articleData.title)
      }

      // Create system notification
      await this.createSystemNotification(
        authorId,
        "submission_received",
        `Your manuscript "${articleData.title}" has been submitted successfully.`,
        { submissionId: result.submissionId, articleId: result.article?.id }
      )

      // Log workflow start
      if (this.config.enableAuditLogging) {
        await this.logWorkflowEvent("submission_started", {
          submissionId: result.submissionId,
          articleId: result.article?.id,
          authorId,
          title: articleData.title
        })
      }

      return result

    } catch (error) {
      logError(error as Error, { operation: "submitArticle", authorId })
      throw error
    }
  }

  /**
   * Update submission status and trigger next workflow steps
   */
  async updateSubmissionStatus(
    submissionId: string,
    newStatus: string,
    metadata: {
      userId: string
      notes?: string
      assigneeId?: string
      deadline?: Date
      metadata?: Record<string, any>
    }
  ) {
    try {
      logInfo("Updating submission status", { submissionId, newStatus, userId: metadata.userId })

      // Update status through workflow manager
      const result = await workflowManager.updateSubmissionStatus(submissionId, newStatus, metadata)

      if (!result.success) {
        throw new AppError(result.message || "Status update failed")
      }

      // Send notifications based on status change
      if (this.config.enableEmailNotifications) {
        await this.handleStatusChangeNotifications(submissionId, newStatus, metadata)
      }

      // Create system notification
      await this.createSystemNotification(
        metadata.userId,
        "status_updated",
        `Submission status updated to: ${newStatus}`,
        { submissionId, newStatus, previousStatus: result.previousStatus }
      )

      // Log workflow event
      if (this.config.enableAuditLogging) {
        await this.logWorkflowEvent("status_updated", {
          submissionId,
          newStatus,
          previousStatus: result.previousStatus,
          userId: metadata.userId,
          notes: metadata.notes
        })
      }

      return result

    } catch (error) {
      logError(error as Error, { operation: "updateSubmissionStatus", submissionId })
      throw error
    }
  }

  /**
   * Assign editor to submission
   */
  async assignEditor(submissionId: string, editorId: string, metadata: {
    userId: string
    notes?: string
    deadline?: Date
    reason?: string
  }) {
    try {
      logInfo("Assigning editor to submission", { submissionId, editorId, userId: metadata.userId })

      // Create editor assignment through workflow manager
      const result = await workflowManager.createEditorAssignment(submissionId, editorId, {
        notes: metadata.notes,
        deadline: metadata.deadline,
        reason: metadata.reason
      })

      if (!result.success) {
        throw new AppError(result.message || "Editor assignment failed")
      }

      // Send assignment notification to editor
      if (this.config.enableEmailNotifications) {
        await this.sendEditorAssignmentNotification(editorId, submissionId, metadata)
      }

      // Create system notification
      await this.createSystemNotification(
        editorId,
        "editor_assigned",
        "You have been assigned as editor for a new submission.",
        { submissionId, assignmentId: result.assignmentId }
      )

      // Log workflow event
      if (this.config.enableAuditLogging) {
        await this.logWorkflowEvent("editor_assigned", {
          submissionId,
          editorId,
          assignmentId: result.assignmentId,
          userId: metadata.userId
        })
      }

      return result

    } catch (error) {
      logError(error as Error, { operation: "assignEditor", submissionId, editorId })
      throw error
    }
  }

  /**
   * Assign reviewers to submission
   */
  async assignReviewers(submissionId: string, reviewerIds: string[], metadata: {
    userId: string
    notes?: string
    deadline?: Date
    instructions?: string
  }) {
    try {
      logInfo("Assigning reviewers to submission", { submissionId, reviewerIds, userId: metadata.userId })

      // Assign reviewers through workflow manager
      const result = await workflowManager.reviewerAssignment.assignReviewers(
        submissionId,
        reviewerIds,
        {
          notes: metadata.notes,
          deadline: metadata.deadline,
          instructions: metadata.instructions
        }
      )

      if (!result.success) {
        throw new AppError(result.message || "Reviewer assignment failed")
      }

      // Send assignment notifications to reviewers
      if (this.config.enableEmailNotifications) {
        await Promise.all(
          reviewerIds.map(reviewerId =>
            this.sendReviewerAssignmentNotification(reviewerId, submissionId, metadata)
          )
        )
      }

      // Create system notifications
      await Promise.all(
        reviewerIds.map(reviewerId =>
          this.createSystemNotification(
            reviewerId,
            "reviewer_assigned",
            "You have been assigned as reviewer for a new submission.",
            { submissionId, deadline: metadata.deadline }
          )
        )
      )

      // Log workflow event
      if (this.config.enableAuditLogging) {
        await this.logWorkflowEvent("reviewers_assigned", {
          submissionId,
          reviewerIds,
          userId: metadata.userId,
          deadline: metadata.deadline
        })
      }

      return result

    } catch (error) {
      logError(error as Error, { operation: "assignReviewers", submissionId, reviewerIds })
      throw error
    }
  }

  /**
   * Handle status change notifications
   */
  private async handleStatusChangeNotifications(
    submissionId: string,
    newStatus: string,
    metadata: unknown
  ) {
    try {
      // Get submission details
      const submission = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, submissionId))
        .limit(1)

      if (submission.length === 0) return

      const submissionData = submission[0]

      // Get author details
      const author = await db
        .select()
        .from(users)
        .where(eq(users.id, submissionData.authorId))
        .limit(1)

      if (author.length === 0) return

      const authorData = author[0]

      // Send appropriate notification based on status
      switch (newStatus) {
        case "technical_check":
          await sendWorkflowNotification(
            authorData.email,
            "Technical Check Started",
            `Your submission is now under technical review.`,
            { submissionId, status: newStatus }
          )
          break

        case "under_review":
          await sendWorkflowNotification(
            authorData.email,
            "Under Review",
            `Your submission is now under peer review.`,
            { submissionId, status: newStatus }
          )
          break

        case "revision_requested":
          await sendWorkflowNotification(
            authorData.email,
            "Revision Requested",
            `The reviewers have requested revisions to your submission.`,
            { submissionId, status: newStatus, notes: metadata.notes }
          )
          break

        case "accepted":
          await sendWorkflowNotification(
            authorData.email,
            "Manuscript Accepted",
            `Congratulations! Your manuscript has been accepted for publication.`,
            { submissionId, status: newStatus }
          )
          break

        case "rejected":
          await sendWorkflowNotification(
            authorData.email,
            "Manuscript Decision",
            `We regret to inform you that your manuscript was not accepted.`,
            { submissionId, status: newStatus, notes: metadata.notes }
          )
          break
      }

    } catch (error) {
      logError(error as Error, { operation: "handleStatusChangeNotifications", submissionId })
    }
  }

  /**
   * Send submission confirmation email
   */
  private async sendSubmissionConfirmation(authorId: string, submissionId: string, title: string) {
    try {
      const author = await db
        .select()
        .from(users)
        .where(eq(users.id, authorId))
        .limit(1)

      if (author.length === 0) return

      await sendEmail({
        to: author[0].email,
        subject: "Manuscript Submission Confirmed",
        html: `
          <h2>Submission Confirmed</h2>
          <p>Your manuscript "${title}" has been successfully submitted.</p>
          <p>Submission ID: ${submissionId}</p>
          <p>We will notify you of the next steps in the review process.</p>
        `,
        priority: true
      })

    } catch (error) {
      logError(error as Error, { operation: "sendSubmissionConfirmation", authorId, submissionId })
    }
  }

  /**
   * Send editor assignment notification
   */
  private async sendEditorAssignmentNotification(
    editorId: string,
    submissionId: string,
    metadata: unknown
  ) {
    try {
      const editor = await db
        .select()
        .from(users)
        .where(eq(users.id, editorId))
        .limit(1)

      if (editor.length === 0) return

      await sendEmail({
        to: editor[0].email,
        subject: "New Editorial Assignment",
        html: `
          <h2>New Editorial Assignment</h2>
          <p>You have been assigned as editor for submission ${submissionId}.</p>
          ${metadata.notes ? `<p>Notes: ${metadata.notes}</p>` : ''}
          ${metadata.deadline ? `<p>Deadline: ${metadata.deadline.toDateString()}</p>` : ''}
        `,
        priority: true
      })

    } catch (error) {
      logError(error as Error, { operation: "sendEditorAssignmentNotification", editorId, submissionId })
    }
  }

  /**
   * Send reviewer assignment notification
   */
  private async sendReviewerAssignmentNotification(
    reviewerId: string,
    submissionId: string,
    metadata: unknown
  ) {
    try {
      const reviewer = await db
        .select()
        .from(users)
        .where(eq(users.id, reviewerId))
        .limit(1)

      if (reviewer.length === 0) return

      await sendEmail({
        to: reviewer[0].email,
        subject: "New Review Assignment",
        html: `
          <h2>New Review Assignment</h2>
          <p>You have been assigned as reviewer for submission ${submissionId}.</p>
          ${metadata.notes ? `<p>Notes: ${metadata.notes}</p>` : ''}
          ${metadata.deadline ? `<p>Deadline: ${metadata.deadline.toDateString()}</p>` : ''}
          ${metadata.instructions ? `<p>Instructions: ${metadata.instructions}</p>` : ''}
        `,
        priority: true
      })

    } catch (error) {
      logError(error as Error, { operation: "sendReviewerAssignmentNotification", reviewerId, submissionId })
    }
  }

  /**
   * Create system notification
   */
  private async createSystemNotification(
    userId: string,
    type: string,
    message: string,
    metadata: Record<string, any>
  ) {
    try {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId,
        type,
        message,
        metadata,
        isRead: false,
        createdAt: new Date()
      })
    } catch (error) {
      logError(error as Error, { operation: "createSystemNotification", userId, type })
    }
  }

  /**
   * Log workflow event for audit
   */
  private async logWorkflowEvent(eventType: string, metadata: Record<string, any>) {
    try {
      // This would typically log to an audit log table or external logging service
      logInfo(`Workflow Event: ${eventType}`, metadata)
    } catch (error) {
      logError(error as Error, { operation: "logWorkflowEvent", eventType })
    }
  }
}

// Export singleton instance
export const workflowIntegration = new WorkflowIntegrationService() 