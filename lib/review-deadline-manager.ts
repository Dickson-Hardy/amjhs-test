// lib/review-deadline-manager.ts

import { db } from "./db"
import { reviewInvitations, articles, users } from "./db/schema"
import { eq, and, lt, isNull, not } from "drizzle-orm"
import { emailTemplates } from "./email-templates"
import { sendEmail } from "./email-hybrid"

export class ReviewDeadlineManager {
  /**
   * Check for invitations that need reminders or withdrawal
   */
  async processDeadlines() {
    try {
      logger.info('📅 Processing review invitation deadlines...')
      
      const results = {
        remindersProcessed: 0,
        withdrawalsProcessed: 0,
        errors: [] as string[]
      }

      // Process reminders (7 days after invitation, no response)
      const reminderResults = await this.processReminders()
      results.remindersProcessed = reminderResults.processed
      results.errors.push(...reminderResults.errors)

      // Process withdrawals (14 days after invitation, no response)
      const withdrawalResults = await this.processWithdrawals()
      results.withdrawalsProcessed = withdrawalResults.processed
      results.errors.push(...withdrawalResults.errors)

      logger.error(`✅ Deadline processing completed:`)
      logger.error(`   - Reminders sent: ${results.remindersProcessed}`)
      logger.error(`   - Withdrawals processed: ${results.withdrawalsProcessed}`)
      logger.error(`   - Errors: ${results.errors.length}`)

      return results
    } catch (error) {
      logger.error('❌ Error processing deadlines:', error)
      throw error
    }
  }

  /**
   * Send reminder emails for invitations approaching deadline
   */
  private async processReminders() {
    const results = { processed: 0, errors: [] as string[] }
    
    try {
      // Find invitations that are 7 days old, status pending, no reminder sent
      const now = new Date()
      const reminderCutoff = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) // 7 days ago
      
      const invitationsNeedingReminder = await db
        .select({
          id: reviewInvitations.id,
          reviewerName: reviewInvitations.reviewerName,
          reviewerEmail: reviewInvitations.reviewerEmail,
          invitationToken: reviewInvitations.invitationToken,
          responseDeadline: reviewInvitations.responseDeadline,
          articleTitle: articles.title,
          articleAbstract: articles.abstract,
          manuscriptNumber: articles.manuscriptNumber
        })
        .from(reviewInvitations)
        .innerJoin(articles, eq(reviewInvitations.articleId, articles.id))
        .where(
          and(
            eq(reviewInvitations.status, 'pending'),
            lt(reviewInvitations.invitedAt, reminderCutoff),
            isNull(reviewInvitations.firstReminderSent)
          )
        )

      for (const invitation of invitationsNeedingReminder) {
        try {
          await this.sendReminderEmail(invitation)
          
          // Update reminder sent timestamp
          await db
            .update(reviewInvitations)
            .set({ 
              firstReminderSent: new Date(),
              updatedAt: new Date()
            })
            .where(eq(reviewInvitations.id, invitation.id))

          results.processed++
          logger.error(`📧 Reminder sent to ${invitation.reviewerName} for ${invitation.articleTitle}`)
        } catch (error) {
          const errorMsg = `Failed to send reminder to ${invitation.reviewerEmail}: ${error}`
          logger.error(errorMsg)
          results.errors.push(errorMsg)
        }
      }
    } catch (error) {
      results.errors.push(`Error processing reminders: ${error}`)
    }

    return results
  }

  /**
   * Process automatic withdrawals for overdue invitations
   */
  private async processWithdrawals() {
    const results = { processed: 0, errors: [] as string[] }
    
    try {
      // Find invitations that are 14 days old, status pending, reminder already sent
      const now = new Date()
      const withdrawalCutoff = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)) // 14 days ago
      
      const invitationsForWithdrawal = await db
        .select({
          id: reviewInvitations.id,
          reviewerName: reviewInvitations.reviewerName,
          reviewerEmail: reviewInvitations.reviewerEmail,
          articleTitle: articles.title,
          manuscriptNumber: articles.manuscriptNumber
        })
        .from(reviewInvitations)
        .innerJoin(articles, eq(reviewInvitations.articleId, articles.id))
        .where(
          and(
            eq(reviewInvitations.status, 'pending'),
            lt(reviewInvitations.invitedAt, withdrawalCutoff),
            not(isNull(reviewInvitations.firstReminderSent))
          )
        )

      for (const invitation of invitationsForWithdrawal) {
        try {
          await this.processWithdrawal(invitation)
          results.processed++
          logger.error(`🚫 Withdrawal processed for ${invitation.reviewerName} - ${invitation.articleTitle}`)
        } catch (error) {
          const errorMsg = `Failed to process withdrawal for ${invitation.reviewerEmail}: ${error}`
          logger.error(errorMsg)
          results.errors.push(errorMsg)
        }
      }
    } catch (error) {
      results.errors.push(`Error processing withdrawals: ${error}`)
    }

    return results
  }

  /**
   * Send reminder email
   */
  private async sendReminderEmail(invitation: unknown) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'
    const acceptUrl = `${baseUrl}/reviewer/invitation/${invitation.id}/accept`
    const declineUrl = `${baseUrl}/reviewer/invitation/${invitation.id}/decline`
    
    // Calculate final deadline (7 more days from now)
    const finalDeadline = new Date()
    finalDeadline.setDate(finalDeadline.getDate() + 7)
    const finalDeadlineStr = finalDeadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const emailContent = emailTemplates.reviewInvitationReminder(
      invitation.reviewerName,
      invitation.articleTitle,
      invitation.manuscriptNumber || 'N/A',
      invitation.articleAbstract || 'Abstract not available',
      acceptUrl,
      declineUrl,
      finalDeadlineStr
    )

    await sendEmail(
      invitation.reviewerEmail,
      emailContent.subject,
      emailContent.html,
      emailContent.text
    )
  }

  /**
   * Process withdrawal
   */
  private async processWithdrawal(invitation: unknown) {
    // Update invitation status to withdrawn
    await db
      .update(reviewInvitations)
      .set({ 
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviewInvitations.id, invitation.id))

    // Send withdrawal notification
    const emailContent = emailTemplates.reviewInvitationWithdrawal(
      invitation.reviewerName,
      invitation.articleTitle,
      invitation.manuscriptNumber || 'N/A'
    )

    await sendEmail(
      invitation.reviewerEmail,
      emailContent.subject,
      emailContent.html,
      emailContent.text
    )
  }

  /**
   * Calculate deadlines for new invitation
   */
  static calculateDeadlines() {
    const now = new Date()
    
    // Response deadline: 7 days from invitation
    const responseDeadline = new Date(now)
    responseDeadline.setDate(responseDeadline.getDate() + 7)
    
    // Review deadline: 21 days from acceptance (will be set when accepted)
    const reviewDeadline = new Date(now)
    reviewDeadline.setDate(reviewDeadline.getDate() + 28) // 7 + 21 days estimate
    
    return {
      responseDeadline,
      reviewDeadline
    }
  }

  /**
   * Format deadline for email display
   */
  static formatDeadline(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  /**
   * Check if invitation is overdue for response
   */
  static isResponseOverdue(invitedAt: Date, responseDeadline: Date): boolean {
    const now = new Date()
    return now > responseDeadline
  }

  /**
   * Check if review is overdue
   */
  static isReviewOverdue(acceptedAt: Date, reviewDeadline: Date): boolean {
    const now = new Date()
    return now > reviewDeadline
  }

  /**
   * Get days remaining for response
   */
  static getDaysUntilResponseDeadline(responseDeadline: Date): number {
    const now = new Date()
    const timeDiff = responseDeadline.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days remaining for review
   */
  static getDaysUntilReviewDeadline(reviewDeadline: Date): number {
    const now = new Date()
    const timeDiff = reviewDeadline.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  }
}

export const reviewDeadlineManager = new ReviewDeadlineManager()
