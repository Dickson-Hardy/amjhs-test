import { Resend } from 'resend'
import { emailTemplates, type EmailTemplate } from "./email-templates"

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Email queue for reliability
interface EmailJob {
  id: string
  to: string
  subject: string
  html: string
  text?: string
  retries: number
  scheduledAt: Date
  from?: string
  replyTo?: string
}

const emailQueue: EmailJob[] = []
let isProcessingQueue = false

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate unique email ID
function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get queue status
export function getEmailQueueStatus() {
  return {
    queueLength: emailQueue.length,
    isProcessing: isProcessingQueue,
    pendingEmails: emailQueue.map(job => ({
      id: job.id,
      to: job.to,
      retries: job.retries,
      scheduledAt: job.scheduledAt
    }))
  }
}

// Clear email queue (for testing or emergency)
export function clearEmailQueue() {
  emailQueue.length = 0
  logger.info('Email queue cleared')
}

// Process email queue with Resend
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return
  
  isProcessingQueue = true
  
  while (emailQueue.length > 0) {
    const job = emailQueue.shift()!
    
    try {
      const response = await resend.emails.send({
        from: job.from || process.env.FROM_EMAIL || 'AMHSJ <process.env.EMAIL_FROMyourjournal.com>',
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text,
        replyTo: job.replyTo || process.env.REPLY_TO_EMAIL
      })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      logger.error(`Email sent successfully to ${job.to} with ID: ${response.data?.id}`)
    } catch (error: unknown) {
      logger.error(`Failed to send email to ${job.to}:`, error)
      
      // Retry logic
      if (job.retries < 3) {
        job.retries++
        job.scheduledAt = new Date(Date.now() + 5000 * job.retries) // Exponential backoff
        emailQueue.push(job)
        logger.error(`Email to ${job.to} queued for retry ${job.retries}/3`)
      } else {
        logger.error(`Failed to send email to ${job.to} after 3 retries`)
      }
    }
  }
  
  isProcessingQueue = false
}

// Start queue processing
setInterval(processEmailQueue, 5000) // Process queue every 5 seconds

// Core email sending function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  priority = false,
  from,
  replyTo,
  attachments = []
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  priority?: boolean
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  // Validate email addresses
  const recipients = Array.isArray(to) ? to : [to]
  for (const email of recipients) {
    if (!isValidEmail(email)) {
      logger.error(`Invalid email address: ${email}`)
      return { success: false, error: `Invalid email address: ${email}` }
    }
  }

  const emailJob: EmailJob = {
    id: generateEmailId(),
    to: recipients[0], // For queue simplicity, use first recipient
    subject,
    html,
    text,
    retries: 0,
    scheduledAt: new Date(),
    from,
    replyTo
  }
  
  if (priority) {
    // For high priority emails (like verification), send immediately
    try {
      const response = await resend.emails.send({
        from: from || process.env.FROM_EMAIL || 'AMHSJ <process.env.EMAIL_FROMyourjournal.com>',
        to: recipients,
        subject,
        html,
        text,
        replyTo: replyTo || process.env.REPLY_TO_EMAIL,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      logger.info(`Priority email sent immediately to ${recipients.join(', ')} with ID: ${response.data?.id}`)
      return { 
        success: true, 
        messageId: response.data?.id 
      }
    } catch (error: unknown) {
      logger.error(`Priority email failed, adding to queue:`, error)
      emailQueue.push(emailJob)
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      }
    }
  } else {
    // Add to queue for regular emails
    emailQueue.push(emailJob)
    logger.info(`Email queued for ${recipients.join(', ')}`)
    return { 
      success: true, 
      messageId: emailJob.id 
    }
  }
}

// Enhanced template-based email sending
export async function sendTemplateEmail({
  to,
  templateId,
  variables = {},
  priority = false,
  from,
  replyTo,
  attachments = []
}: {
  to: string | string[]
  templateId: keyof typeof emailTemplates
  variables?: Record<string, any>
  priority?: boolean
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  // Get template
  const template = emailTemplates[templateId]
  if (!template) {
    logger.error(`Template not found: ${templateId}`)
    return { success: false, error: `Template not found: ${templateId}` }
  }

  // Generate email content
  const emailContent = template(variables)

  return sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    priority,
    from,
    replyTo,
    attachments
  })
}

// Convenience functions for common email types
export async function sendEmailVerification(email: string, name: string, verificationUrl: string) {
  return sendTemplateEmail({
    to: email,
    templateId: 'emailVerification',
    variables: { name, verificationUrl },
    priority: true
  })
}

export async function sendPasswordReset(email: string, name: string, resetUrl: string) {
  return sendTemplateEmail({
    to: email,
    templateId: 'passwordReset',
    variables: { name, resetUrl },
    priority: true
  })
}

export async function sendWelcomeEmail(email: string, name: string, loginUrl: string) {
  return sendTemplateEmail({
    to: email,
    templateId: 'welcomeEmail',
    variables: { name, loginUrl },
    priority: false
  })
}

export async function sendSubmissionReceived(
  email: string,
  authorName: string,
  articleTitle: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'submissionReceived',
    variables: { authorName, articleTitle, submissionId }
  })
}

export async function sendReviewerAssignment(
  email: string,
  reviewerName: string,
  articleTitle: string,
  authorName: string,
  deadline: string,
  reviewUrl: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'reviewerAssignment',
    variables: { reviewerName, articleTitle, authorName, deadline, reviewUrl }
  })
}

export async function sendReviewSubmitted(
  email: string,
  authorName: string,
  articleTitle: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'reviewSubmitted',
    variables: { authorName, articleTitle, submissionId }
  })
}

export async function sendEditorialDecision(
  email: string,
  authorName: string,
  articleTitle: string,
  decision: string,
  comments: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'editorialDecision',
    variables: { authorName, articleTitle, decision, comments, submissionId }
  })
}

export async function sendRevisionRequest(
  email: string,
  authorName: string,
  articleTitle: string,
  comments: string,
  deadline: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'revisionRequest',
    variables: { authorName, articleTitle, comments, deadline, submissionId }
  })
}

export async function sendAcceptanceNotification(
  email: string,
  authorName: string,
  articleTitle: string,
  publicationDate: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'acceptanceNotification',
    variables: { authorName, articleTitle, publicationDate, submissionId }
  })
}

export async function sendRejectionNotification(
  email: string,
  authorName: string,
  articleTitle: string,
  reason: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'rejectionNotification',
    variables: { authorName, articleTitle, reason, submissionId }
  })
}

export async function sendPaymentReminder(
  email: string,
  authorName: string,
  articleTitle: string,
  amount: string,
  dueDate: string,
  paymentUrl: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'paymentReminder',
    variables: { authorName, articleTitle, amount, dueDate, paymentUrl }
  })
}

export async function sendPublicationNotification(
  email: string,
  authorName: string,
  articleTitle: string,
  publicationUrl: string,
  doi: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'publicationNotification',
    variables: { authorName, articleTitle, publicationUrl, doi }
  })
}

export async function sendNewsletterUpdate(
  email: string,
  subscriberName: string,
  updates: unknown[],
  unsubscribeUrl: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'newsletterUpdate',
    variables: { subscriberName, updates, unsubscribeUrl }
  })
}

// Bulk email functions
export async function sendBulkEmails(
  emails: Array<{
    to: string
    templateId: keyof typeof emailTemplates
    variables?: Record<string, any>
  }>,
  from?: string,
  replyTo?: string
): Promise<Array<{ email: string; success: boolean; messageId?: string; error?: string }>> {
  const results = []
  
  for (const email of emails) {
    const result = await sendTemplateEmail({
      to: email.to,
      templateId: email.templateId,
      variables: email.variables,
      from,
      replyTo
    })
    
    results.push({
      email: email.to,
      ...result
    })
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

// System monitoring emails
export async function sendSystemAlert(
  adminEmails: string[],
  alertType: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
) {
  return sendTemplateEmail({
    to: adminEmails,
    templateId: 'systemAlert',
    variables: { alertType, message, severity },
    priority: severity === 'high' || severity === 'critical'
  })
}

// Email verification for new features
export async function verifyEmailDelivery(): Promise<boolean> {
  try {
    // Test email sending capability
    const testResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'test@yourjournal.com',
      to: 'test@resend.dev', // Resend's test email
      subject: 'Email Service Test',
      html: '<p>This is a test email to verify Resend integration.</p>',
      text: 'This is a test email to verify Resend integration.'
    })
    
    return !testResult.error
  } catch (error) {
    logger.error('Email verification failed:', error)
    return false
  }
}

// Export Resend instance for advanced usage
export { resend }
