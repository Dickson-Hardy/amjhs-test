import { db } from "@/lib/db"
import { communication_templates, users, submissions, articles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export interface EditorialAssistantEmailData {
  manuscript_title: string
  manuscript_id: string
  category: string
  article_type: string
  author_name: string
  submission_date: string
  priority_level: string
  login_url: string
  manuscript_url: string
  screening_url: string
}

export interface ScreeningCompletionEmailData {
  associate_editor_name: string
  manuscript_title: string
  manuscript_id: string
  category: string
  article_type: string
  priority: string
  screening_score: number
  screening_notes: string
  login_url: string
  manuscript_url: string
  decision_url: string
}

export interface DailySummaryEmailData {
  date: string
  manuscripts_screened: number
  pending_count: number
  avg_screening_time: number
  accuracy_rate: number
  manuscript_list: string
  login_url: string
  queue_url: string
  analytics_url: string
}

export class EditorialAssistantEmailService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }

  /**
   * Send new submission notification to editorial assistant
   */
  async sendNewSubmissionNotification(
    submissionId: string,
    editorialAssistantEmail: string
  ): Promise<boolean> {
    try {
      // Get submission and article details
      const submission = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
        with: {
          article: {
            with: {
              author: true
            }
          }
        }
      })

      if (!submission || !submission.article) {
        throw new Error(`Submission or article not found: ${submissionId}`)
      }

      // Get email template
      const template = await db.query.communication_templates.findFirst({
        where: eq(communication_templates.template_name, 'New Submission Notification - Editorial Assistant')
      })

      if (!template) {
        throw new Error('Email template not found')
      }

      // Prepare email data
      const emailData: EditorialAssistantEmailData = {
        manuscript_title: submission.article.title || 'Untitled',
        manuscript_id: submission.id,
        category: submission.article.category || 'Uncategorized',
        article_type: submission.article.articleType || 'research',
        author_name: submission.article.author?.name || 'Unknown Author',
        submission_date: submission.createdAt?.toLocaleDateString() || new Date().toLocaleDateString(),
        priority_level: this.calculatePriorityLevel(submission.createdAt),
        login_url: `${this.baseUrl}/editorial-assistant/login?redirect=/editorial-assistant&submission=${submissionId}`,
        manuscript_url: `${this.baseUrl}/editorial-assistant/screening/${submissionId}`,
        screening_url: `${this.baseUrl}/editorial-assistant/screening/${submissionId}`
      }

      // Send email
      const success = await this.sendEmail(
        editorialAssistantEmail,
        template.subject,
        template.body,
        emailData
      )

      if (success) {
        // Log the notification
        console.log(`New submission notification sent to ${editorialAssistantEmail} for submission ${submissionId}`)
      }

      return success
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'sendNewSubmissionNotification',
        submissionId 
      })
      return false
    }
  }

  /**
   * Send screening completion notification to associate editor
   */
  async sendScreeningCompletionNotification(
    submissionId: string,
    associateEditorEmail: string,
    screeningData: {
      screeningScore: number
      screeningNotes: string
    }
  ): Promise<boolean> {
    try {
      // Get submission and article details
      const submission = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
        with: {
          article: {
            with: {
              author: true
            }
          }
        }
      })

      if (!submission || !submission.article) {
        throw new Error(`Submission or article not found: ${submissionId}`)
      }

      // Get email template
      const template = await db.query.communication_templates.findFirst({
        where: eq(communication_templates.template_name, 'Screening Completion Notification')
      })

      if (!template) {
        throw new Error('Email template not found')
      }

      // Get associate editor name
      const associateEditor = await db.query.users.findFirst({
        where: eq(users.email, associateEditorEmail)
      })

      // Prepare email data
      const emailData: ScreeningCompletionEmailData = {
        associate_editor_name: associateEditor?.name || 'Associate Editor',
        manuscript_title: submission.article.title || 'Untitled',
        manuscript_id: submission.id,
        category: submission.article.category || 'Uncategorized',
        article_type: submission.article.articleType || 'research',
        priority: this.calculatePriorityLevel(submission.createdAt),
        screening_score: screeningData.screeningScore,
        screening_notes: screeningData.screeningNotes,
        login_url: `${this.baseUrl}/editor/login?redirect=/editor/dashboard&submission=${submissionId}`,
        manuscript_url: `${this.baseUrl}/editor/review/${submissionId}`,
        decision_url: `${this.baseUrl}/editor/decision/${submissionId}`
      }

      // Send email
      const success = await this.sendEmail(
        associateEditorEmail,
        template.subject,
        template.body,
        emailData
      )

      if (success) {
        console.log(`Screening completion notification sent to ${associateEditorEmail} for submission ${submissionId}`)
      }

      return success
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'sendScreeningCompletionNotification',
        submissionId 
      })
      return false
    }
  }

  /**
   * Send daily summary to editorial assistant
   */
  async sendDailySummary(
    editorialAssistantEmail: string,
    summaryData: {
      manuscriptsScreened: number
      pendingCount: number
      avgScreeningTime: number
      accuracyRate: number
      pendingManuscripts: Array<{
        id: string
        title: string
        category: string
        submittedAt: Date
      }>
    }
  ): Promise<boolean> {
    try {
      // Get email template
      const template = await db.query.communication_templates.findFirst({
        where: eq(communication_templates.template_name, 'Daily Screening Summary - Editorial Assistant')
      })

      if (!template) {
        throw new Error('Email template not found')
      }

      // Format manuscript list
      const manuscriptList = summaryData.pendingManuscripts
        .map(m => `• ${m.title} (${m.category}) - Submitted: ${m.submittedAt.toLocaleDateString()}`)
        .join('\n')

      // Prepare email data
      const emailData: DailySummaryEmailData = {
        date: new Date().toLocaleDateString(),
        manuscripts_screened: summaryData.manuscriptsScreened,
        pending_count: summaryData.pendingCount,
        avg_screening_time: summaryData.avgScreeningTime,
        accuracy_rate: summaryData.accuracyRate,
        manuscript_list: manuscriptList,
        login_url: `${this.baseUrl}/editorial-assistant/login?redirect=/editorial-assistant`,
        queue_url: `${this.baseUrl}/editorial-assistant/login?redirect=/editorial-assistant&tab=queue`,
        analytics_url: `${this.baseUrl}/editorial-assistant/login?redirect=/editorial-assistant&tab=analytics`
      }

      // Send email
      const success = await this.sendEmail(
        editorialAssistantEmail,
        template.subject,
        template.body,
        emailData
      )

      if (success) {
        console.log(`Daily summary sent to ${editorialAssistantEmail}`)
      }

      return success
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'sendDailySummary',
        email: editorialAssistantEmail 
      })
      return false
    }
  }

  /**
   * Send email with template variable substitution
   */
  private async sendEmail(
    to: string,
    subject: string,
    body: string,
    data: EditorialAssistantEmailData | ScreeningCompletionEmailData | DailySummaryEmailData
  ): Promise<boolean> {
    try {
      // Replace template variables
      let processedSubject = subject
      let processedBody = body

      Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value))
        processedBody = processedBody.replace(new RegExp(placeholder, 'g'), String(value))
      })

      // Convert markdown-style links to HTML
      processedBody = this.convertMarkdownLinksToHTML(processedBody)

      // Send email using your email service
      // This is a placeholder - replace with your actual email service
      const emailResult = await this.sendEmailViaService(to, processedSubject, processedBody)
      
      return emailResult
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'sendEmail',
        to 
      })
      return false
    }
  }

  /**
   * Convert markdown-style links to HTML for email compatibility
   */
  private convertMarkdownLinksToHTML(body: string): string {
    // Convert [text](url) to <a href="url">text</a>
    return body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
  }

  /**
   * Calculate priority level based on submission date
   */
  private calculatePriorityLevel(submissionDate: Date | null): string {
    if (!submissionDate) return 'Normal'
    
    const daysSinceSubmission = Math.floor((Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceSubmission <= 1) return 'High'
    if (daysSinceSubmission <= 3) return 'Medium-High'
    if (daysSinceSubmission <= 7) return 'Medium'
    if (daysSinceSubmission <= 14) return 'Medium-Low'
    return 'Low'
  }

  /**
   * Send email via email service (placeholder - replace with your service)
   */
  private async sendEmailViaService(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // TODO: Replace with your actual email service (SendGrid, AWS SES, etc.)
      console.log(`📧 Email would be sent to: ${to}`)
      console.log(`📧 Subject: ${subject}`)
      console.log(`📧 Body: ${body}`)
      
      // For now, return true to simulate successful email sending
      // In production, implement your email service here
      return true
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'sendEmailViaService',
        to 
      })
      return false
    }
  }

  /**
   * Get all pending submissions for daily summary
   */
  async getPendingSubmissions(): Promise<Array<{
    id: string
    title: string
    category: string
    submittedAt: Date
  }>> {
    try {
      const submissions = await db.query.submissions.findMany({
        where: eq(submissions.status, 'submitted'),
        with: {
          article: true
        },
        orderBy: (submissions, { asc }) => [asc(submissions.createdAt)]
      })

      return submissions.map(submission => ({
        id: submission.id,
        title: submission.article?.title || 'Untitled',
        category: submission.article?.category || 'Uncategorized',
        submittedAt: submission.createdAt || new Date()
      }))
    } catch (error) {
      logError(error as Error, { 
        service: 'EditorialAssistantEmailService', 
        action: 'getPendingSubmissions' 
      })
      return []
    }
  }
}

export default EditorialAssistantEmailService
