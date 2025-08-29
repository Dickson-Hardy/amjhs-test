import nodemailer from 'nodemailer'
import { emailTemplates, type EmailTemplate } from "./email-templates"
import { logEmail, logError } from "./logger"

// Create em      logEmail(`Email queued for ${to}`, to, 'queued')il transporter based on environment configuration
const createTransporter = () => {
  if (process.env.RESEND_API_KEY) {
    // Use Resend SMTP
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  } else if (process.env.SMTP_HOST) {
    // Use custom SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  } else {
    // Use Gmail (fallback)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }
}

const transporter = createTransporter()

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

// Email queue status monitoring
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

// Process email queue
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return
  
  isProcessingQueue = true
  
  while (emailQueue.length > 0) {
    const job = emailQueue.shift()!
    
    try {
      await transporter.sendMail({
        from: `"AMHSJ Editorial Team" <${process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text,
      })
      
      logEmail(`Email sent successfully to ${job.to}`, job.to, 'sent')
    } catch (error) {
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

export async function sendEmail({
  to,
  subject,
  html,
  text,
  priority = false,
}: {
  to: string
  subject: string
  html: string
  text?: string
  priority?: boolean
}) {
  // Validate email address
  if (!isValidEmail(to)) {
    throw new ValidationError(`Invalid email address: ${to}`)
  }

  const emailJob: EmailJob = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    to,
    subject,
    html,
    text,
    retries: 0,
    scheduledAt: new Date(),
  }
  
  if (priority) {
    // For high priority emails (like verification), send immediately
    try {
      await transporter.sendMail({
        from: `"AMHSJ Editorial Team" <${process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      })
      logEmail(`Priority email sent immediately to ${to}`, to, 'priority_sent')
    } catch (error) {
      logger.error(`Priority email failed, adding to queue:`, error)
      emailQueue.push(emailJob)
    }
  } else {
    // Add to queue for regular emails
    emailQueue.push(emailJob)
    logger.info(`Email queued for ${to}`)
  }
}

// Convenience functions for common email types
export async function sendEmailVerification(email: string, name: string, verificationUrl: string) {
  const template = emailTemplates.emailVerification(name, verificationUrl)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: true, // High priority for verification emails
  })
}

export async function sendSubmissionReceived(
  email: string,
  authorName: string,
  articleTitle: string,
  submissionId: string,
) {
  const template = emailTemplates.submissionReceived(authorName, articleTitle, submissionId)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
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
  const template = emailTemplates.reviewerAssignment(reviewerName, articleTitle, authorName, deadline, reviewUrl)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendReviewSubmitted(
  email: string,
  authorName: string,
  articleTitle: string,
  submissionId: string,
) {
  const template = emailTemplates.reviewSubmitted(authorName, articleTitle, submissionId)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
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
  const template = emailTemplates.editorialDecision(authorName, articleTitle, decision, comments, submissionId)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendWelcomeEmail(email: string, userName: string, userRole: string) {
  const template = emailTemplates.welcomeEmail(userName, userRole)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendPaymentConfirmation(
  email: string,
  userName: string,
  amount: string,
  transactionId: string,
  description: string,
) {
  const template = emailTemplates.paymentConfirmation(userName, amount, transactionId, description)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendSystemMaintenance(
  email: string,
  userName: string,
  maintenanceDate: string,
  duration: string,
) {
  const template = emailTemplates.systemMaintenance(userName, maintenanceDate, duration)
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

// Bulk email function for announcements
export async function sendBulkEmail(emails: string[], template: EmailTemplate) {
  const promises = emails.map((email) =>
    sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  )

  await Promise.allSettled(promises)
}

export async function sendReviewInvitation(
  email: string,
  reviewerName: string,
  articleTitle: string,
  articleAbstract: string,
  deadline: Date,
  reviewId: string
) {
  const template = emailTemplates.reviewerAssignment(
    reviewerName,
    articleTitle,
    "Article Author", // We don't expose author name to reviewers for anonymity
    deadline.toLocaleDateString(),
    `${process.env.NEXT_PUBLIC_APP_URL}/reviewer/review/${reviewId}`
  )
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: true,
  })
}

export async function sendWorkflowNotification(
  email: string,
  userName: string,
  title: string,
  message: string,
  context?: unknown
) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #2563eb;">${title}</h2>
      <p>Dear ${userName},</p>
      <p>${message}</p>
      ${context ? `<p style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
        <strong>Details:</strong><br>
        ${context.articleId ? `Article ID: ${context.articleId}<br>` : ''}
        ${context.submissionId ? `Submission ID: ${context.submissionId}<br>` : ''}
      </p>` : ''}
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Dashboard
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        Best regards,<br>
        The AMHSJ Editorial Team
      </p>
    </div>
  `

  const text = `${title}\n\nDear ${userName},\n\n${message}\n\nView your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nBest regards,\nThe AMHSJ Editorial Team`

  await sendEmail({
    to: email,
    subject: title,
    html,
    text,
  })
}

// Editorial Board Application Functions
export async function sendEditorialBoardApplication(
  email: string,
  applicantName: string,
  position: string,
  applicationId: string,
  adminEmails: string[]
) {
  // Send confirmation to applicant
  const applicantTemplate = emailTemplates.editorialBoardApplicationReceived(
    applicantName,
    position,
    applicationId
  )
  
  await sendEmail({
    to: email,
    subject: applicantTemplate.subject,
    html: applicantTemplate.html,
    text: applicantTemplate.text,
  })

  // Send notification to admins
  const adminTemplate = emailTemplates.editorialBoardApplicationNotification(
    applicantName,
    position,
    applicationId,
    email
  )

  for (const adminEmail of adminEmails) {
    await sendEmail({
      to: adminEmail,
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      text: adminTemplate.text,
      priority: true,
    })
  }
}

export async function sendEditorialBoardApplicationDecision(
  email: string,
  applicantName: string,
  position: string,
  decision: 'approved' | 'rejected',
  comments: string,
  applicationId: string
) {
  const template = emailTemplates.editorialBoardApplicationDecision(
    applicantName,
    position,
    decision,
    comments,
    applicationId
  )
  
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: true,
  })
}

export async function sendEditorialBoardWelcome(
  email: string,
  memberName: string,
  position: string,
  boardAccessUrl: string
) {
  const template = emailTemplates.editorialBoardWelcome(
    memberName,
    position,
    boardAccessUrl
  )
  
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: true,
  })
}
