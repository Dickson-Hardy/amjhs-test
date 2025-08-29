import { Resend } from 'resend'
import nodemailer from "nodemailer"
import { emailTemplates, type EmailTemplate } from "./email-templates"

// Initialize Resend for user emails
const resend = new Resend(process.env.RESEND_API_KEY)

// Zoho Mail configuration for editorial emails
const zohoTransporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.zoho.com",
	port: Number.parseInt(process.env.SMTP_PORT || "587"),
	secure: false, // Use STARTTLS
	auth: {
		user: process.env.SMTP_USER, // your-alias@yourdomain.com
		pass: process.env.SMTP_PASSWORD, // your Zoho Mail password or app password
	},
	tls: {
		rejectUnauthorized: false
	}
})

// Email categories for routing
type EmailCategory = 
	| 'authentication'    // Resend: verification, password reset, welcome
	| 'user_notification' // Resend: payment reminders, success messages
	| 'editorial'         // Zoho: editorial decisions, reviewer assignments
	| 'system'           // Zoho: system alerts, admin notifications

// Verified domains that should use Zoho (editorial communications)
const VERIFIED_DOMAINS = (process.env.EDITORIAL_VERIFIED_DOMAINS || 'yourjournal.com,editorial.yourjournal.com,admin.yourjournal.com')
	.split(',')
	.map(d => d.trim().toLowerCase())
	.filter(Boolean)

// Email template to category mapping (simplified)
const TEMPLATE_CATEGORIES: Partial<Record<keyof typeof emailTemplates, EmailCategory>> = {
	emailVerification: 'authentication',
	passwordReset: 'authentication',
	welcomeEmail: 'authentication',
	submissionReceived: 'user_notification',
	paymentConfirmation: 'user_notification',
	reviewerAssignment: 'editorial',
	reviewSubmitted: 'editorial',
	editorialDecision: 'editorial',
	systemMaintenance: 'system'
}

// Email queue for reliability
interface EmailJob {
	id: string
	to: string[]
	subject: string
	html: string
	text?: string
	retries: number
	scheduledAt: Date
	from?: string
	replyTo?: string
	category: EmailCategory
	provider: 'resend' | 'zoho'
	attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
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

// Determine email provider based on category and recipient
function determineEmailProvider(category: EmailCategory, to: string): 'resend' | 'zoho' {
	// Check if recipient is from a verified domain (use Zoho)
	const domain = to.split('@')[1]?.toLowerCase()
	if (domain && VERIFIED_DOMAINS.includes(domain)) {
		return 'zoho'
	}

	// Route based on category
	switch (category) {
		case 'authentication':
		case 'user_notification':
			return 'resend'
		case 'editorial':
		case 'system':
			return 'zoho'
		default:
			return 'resend'
	}
}

// Send email via Resend
async function sendViaResend(job: EmailJob): Promise<string | null> {
	const response = await resend.emails.send({
		from: job.from || process.env.FROM_EMAIL || 'AMHSJ <process.env.EMAIL_FROMyourjournal.com>',
		to: job.to,
		subject: job.subject,
		html: job.html,
		text: job.text,
		replyTo: job.replyTo || process.env.REPLY_TO_EMAIL,
		attachments: job.attachments?.map(att => ({ filename: att.filename, content: att.content, contentType: att.contentType }))
	})
	
	if ((response as unknown).error) {
		throw new Error((response as unknown).error.message)
	}
	
	return (response as unknown).data?.id || null
}

// Send email via Zoho
async function sendViaZoho(job: EmailJob): Promise<string | null> {
	const info = await zohoTransporter.sendMail({
		from: job.from || `"AMHSJ Editorial Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
		to: job.to,
		subject: job.subject,
		html: job.html,
		text: job.text,
		replyTo: job.replyTo || process.env.REPLY_TO_EMAIL,
		attachments: job.attachments
	})
	
	return info.messageId as string
}

// Process email queue with hybrid routing
async function processEmailQueue() {
	if (isProcessingQueue || emailQueue.length === 0) return
	
	isProcessingQueue = true
	
	while (emailQueue.length > 0) {
		const job = emailQueue.shift()!
		
		try {
			let messageId: string | null = null
			
			if (job.provider === 'resend') {
				messageId = await sendViaResend(job)
			} else {
				messageId = await sendViaZoho(job)
			}
			
			logger.error(`Email sent successfully to ${job.to.join(', ')} via ${job.provider.toUpperCase()} with ID: ${messageId}`)
		} catch (error: unknown) {
			logger.error(`Failed to send email to ${job.to.join(', ')} via ${job.provider}:`, error)
			
			// Retry logic
			if (job.retries < 3) {
				job.retries++
				job.scheduledAt = new Date(Date.now() + 5000 * job.retries) // Exponential backoff
				emailQueue.push(job)
				logger.error(`Email to ${job.to.join(', ')} queued for retry ${job.retries}/3`)
			} else {
				logger.error(`Failed to send email to ${job.to.join(', ')} after 3 retries`)
			}
		}
	}
	
	isProcessingQueue = false
}

// Start queue processing
setInterval(processEmailQueue, 5000) // Process queue every 5 seconds

// Core hybrid email sending function
export async function sendEmail({
	to,
	subject,
	html,
	text,
	priority = false,
	category = 'user_notification',
	from,
	replyTo,
	attachments = []
}: {
	to: string | string[]
	subject: string
	html: string
	text?: string
	priority?: boolean
	category?: EmailCategory
	from?: string
	replyTo?: string
	attachments?: Array<{
		filename: string
		content: Buffer | string
		contentType?: string
	}>
}): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
	
	// Validate email addresses
	const recipients = Array.isArray(to) ? to : [to]
	for (const email of recipients) {
		if (!isValidEmail(email)) {
			logger.error(`Invalid email address: ${email}`)
			return { success: false, error: `Invalid email address: ${email}` }
		}
	}

	// Determine provider for first recipient (for queue simplicity)
	const provider = determineEmailProvider(category, recipients[0])

	const emailJob: EmailJob = {
		id: generateEmailId(),
		to: recipients,
		subject,
		html,
		text,
		retries: 0,
		scheduledAt: new Date(),
		from,
		replyTo,
		category,
		provider,
		attachments
	}
	
	if (priority) {
		// For high priority emails, send immediately
		try {
			let messageId: string | null = null
			
			if (provider === 'resend') {
				messageId = await sendViaResend(emailJob)
			} else {
				messageId = await sendViaZoho(emailJob)
			}
			
			logger.info(`Priority email sent immediately to ${recipients.join(', ')} via ${provider.toUpperCase()} with ID: ${messageId}`)
			return { 
				success: true, 
				messageId: messageId || undefined,
				provider 
			}
		} catch (error: unknown) {
			logger.error(`Priority email failed, adding to queue:`, error)
			emailQueue.push(emailJob)
			return { 
				success: false, 
				error: error.message || 'Failed to send email',
				provider 
			}
		}
	} else {
		// Add to queue for regular emails
		emailQueue.push(emailJob)
		logger.info(`Email queued for ${recipients.join(', ')} via ${provider.toUpperCase()}`)
		return { 
			success: true, 
			messageId: emailJob.id,
			provider 
		}
	}
}

// Enhanced template-based email sending with automatic routing
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
}): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
	
	// Get template
	const template = emailTemplates[templateId]
	if (!template) {
		logger.error(`Template not found: ${templateId}`)
		return { success: false, error: `Template not found: ${templateId}` }
	}

	// Get category for this template
	const category = TEMPLATE_CATEGORIES[templateId]

	// Generate email content with proper parameter spreading
	const templateFn = template as unknown
	const emailContent = templateFn(...Object.values(variables))

	return sendEmail({
		to,
		subject: emailContent.subject,
		html: emailContent.html,
		text: emailContent.text,
		priority,
		category,
		from,
		replyTo,
		attachments
	})
}

// Generic workflow notification (user_notification -> Resend)
export async function sendWorkflowNotification(
	to: string | string[],
	title: string,
	message: string,
	metadata?: Record<string, any>
) {
	const html = `
		<h2>${title}</h2>
		<p>${message}</p>
	`
	return sendEmail({
		to,
		subject: title,
		html,
		text: message,
		priority: false,
		category: 'user_notification'
	})
}

// Authentication emails (via Resend)
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
		variables: { name, loginUrl }
	})
}

// User notification emails (via Resend)
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

export async function sendPaymentConfirmation(
	email: string,
	authorName: string,
	articleTitle: string,
	amount: string,
	transactionId: string,
	receiptUrl: string,
) {
	return sendTemplateEmail({
		to: email,
		templateId: 'paymentConfirmation',
		variables: { authorName, articleTitle, amount, transactionId, receiptUrl }
	})
}

// Editorial emails (via Zoho)
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

// Remove this function as revisionRequest template doesn't exist
// Use editorialDecision template for revision requests
export async function sendRevisionRequestNotification(
  email: string,
  authorName: string,
  articleTitle: string,
  comments: string,
  deadline: string,
  submissionId: string,
) {
  return sendTemplateEmail({
    to: email,
    templateId: 'editorialDecision',
    variables: { authorName, articleTitle, decision: 'Revision Required', comments, submissionId }
  })
}

// Health and queue helpers
export function getEmailQueueStatus() {
	return {
		queueLength: emailQueue.length,
		isProcessing: isProcessingQueue,
		pendingEmails: emailQueue.map(job => ({
			id: job.id,
			to: job.to,
			retries: job.retries,
			scheduledAt: job.scheduledAt,
			category: job.category,
			provider: job.provider
		}))
	}
}

export function clearEmailQueue() {
	emailQueue.length = 0
	logger.info('Email queue cleared')
}

export async function checkEmailServiceHealth(): Promise<{
	resend: boolean
	zoho: boolean
	overall: boolean
}> {
	const results = {
		resend: false,
		zoho: false,
		overall: false
	}

	// Test Resend
	try {
		const testResend = await resend.emails.send({
			from: process.env.FROM_EMAIL || 'test@yourjournal.com',
			to: 'test@resend.dev',
			subject: 'Resend Health Check',
			html: '<p>Health check email</p>'
		})
		results.resend = !(testResend as unknown).error
	} catch (error) {
		logger.error('Resend health check failed:', error)
	}

	// Test Zoho
	try {
		await zohoTransporter.verify()
		results.zoho = true
	} catch (error) {
		logger.error('Zoho health check failed:', error)
	}

	results.overall = results.resend && results.zoho
	return results
}

// Review invitation specific function
export async function sendReviewInvitation(
	to: string,
	data: {
		reviewerName: string
		articleTitle: string
		invitationToken: string
		deadline: Date
		editorName: string
	}
): Promise<{ success: boolean; error?: string }> {
	const reviewUrl = `${process.env.NEXTAUTH_URL}/review/accept/${data.invitationToken}`
	const template = emailTemplates.reviewerAssignment(
		data.reviewerName,
		data.articleTitle,
		data.editorName, // Using editorName as authorName parameter
		data.deadline.toLocaleDateString(),
		reviewUrl
	)

	return await sendEmail({
		to,
		category: 'editorial',
		subject: template.subject,
		html: template.html,
		text: template.text
	})
}

// Export instances for advanced usage
export { resend, zohoTransporter }
