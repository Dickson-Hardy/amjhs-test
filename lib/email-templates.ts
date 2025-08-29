export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Helper function to get logo for emails
function getEmailLogo(size: 'small' | 'medium' | 'large' = 'medium') {
  const sizes = {
    small: { width: 60, height: 60 },
    medium: { width: 120, height: 120 },
    large: { width: 200, height: 200 }
  }
  
  const { width, height } = sizes[size]
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'
  
  return {
    url: `${baseUrl}/logo-amhsj.png`,
    width,
    height,
    alt: "AMHSJ - Advances in Medicine & Health Sciences"
  }
}

// AMHSJ Brand Colors for Email Templates
const AMHSJ_COLORS = {
  primary: '#1e3a8a', // blue-900
  secondary: '#3b82f6', // blue-500
  accent: '#0ea5e9', // sky-500
  medical: '#dc2626', // red-600
  success: '#059669', // emerald-600
  warning: '#d97706', // amber-600
  text: '#1f2937', // gray-800
  textLight: '#6b7280', // gray-500
  background: '#f8fafc', // slate-50
  backgroundAlt: '#f1f5f9' // slate-100
}

// Email template base styles
function getEmailStyles() {
  return `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: ${AMHSJ_COLORS.text}; 
        margin: 0; 
        padding: 0; 
        background-color: ${AMHSJ_COLORS.backgroundAlt}; 
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 10px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
      }
      .header { 
        background: linear-gradient(135deg, ${AMHSJ_COLORS.primary} 0%, ${AMHSJ_COLORS.secondary} 100%); 
        color: white; 
        padding: 30px; 
        text-align: center; 
      }
      .header h1 { 
        margin: 0; 
        font-size: 24px; 
        font-weight: bold; 
      }
      .header p { 
        margin: 5px 0 0 0; 
        font-size: 16px; 
        opacity: 0.9; 
      }
      .logo img { 
        border-radius: 8px; 
        background: white; 
        padding: 10px; 
        margin-bottom: 15px; 
      }
      .content { 
        padding: 40px 30px; 
      }
      .button { 
        display: inline-block; 
        background: ${AMHSJ_COLORS.primary}; 
        color: white; 
        padding: 15px 30px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: bold; 
        margin: 20px 0; 
        transition: background-color 0.3s ease;
      }
      .button:hover { 
        background: ${AMHSJ_COLORS.secondary}; 
      }
      .button-secondary { 
        background: ${AMHSJ_COLORS.secondary}; 
      }
      .button-medical { 
        background: ${AMHSJ_COLORS.medical}; 
      }
      .button-success { 
        background: ${AMHSJ_COLORS.success}; 
      }
      .footer { 
        background: ${AMHSJ_COLORS.background}; 
        padding: 20px; 
        text-align: center; 
        font-size: 14px; 
        color: ${AMHSJ_COLORS.textLight}; 
        border-top: 1px solid #e2e8f0;
      }
      .warning { 
        background: #fef3cd; 
        border: 1px solid ${AMHSJ_COLORS.warning}; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .success { 
        background: #d1fae5; 
        border: 1px solid ${AMHSJ_COLORS.success}; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .medical-notice { 
        background: #fee2e2; 
        border: 1px solid ${AMHSJ_COLORS.medical}; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .info { 
        background: #dbeafe; 
        border: 1px solid ${AMHSJ_COLORS.accent}; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .divider { 
        height: 1px; 
        background: linear-gradient(to right, transparent, ${AMHSJ_COLORS.primary}, transparent); 
        margin: 30px 0; 
      }
      .highlight { 
        background: ${AMHSJ_COLORS.background}; 
        padding: 15px; 
        border-radius: 5px; 
        border-left: 4px solid ${AMHSJ_COLORS.primary}; 
        margin: 15px 0; 
      }
    </style>
  `
}

export const emailTemplates = {
  // Authentication Templates
  emailVerification: (name: string, verificationUrl: string): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: "AMHSJ - Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - AMHSJ</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
            .logo-container { margin-bottom: 10px; }
            .logo { max-width: ${logo.width}px; height: auto; }
            .header-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .header-subtitle { font-size: 14px; opacity: 0.9; margin: 0; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="${logo.url}" alt="${logo.alt}" class="logo" width="${logo.width}" height="${logo.height}" />
              </div>
              <div class="header-text">ADVANCES IN MEDICINE & HEALTH SCIENCES</div>
              <p class="header-subtitle">Journal of Bayelsa Medical University</p>
            </div>
            <div class="content">
              <h2>Welcome to AMHSJ, ${name}!</h2>
              <p>Thank you for registering with the Advances in Medicine & Health Sciences Journal. To complete your registration and access all platform features, please verify your email address.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="warning">
                <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account with AMHSJ, please ignore this email.
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #1e3a8a;">${verificationUrl}</p>
              
              <p>Best regards,<br>The AMHSJ Editorial Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal</p>
              <p>Bayelsa Medical University</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to AMHSJ, ${name}!\n\nThank you for registering with the Advances in Medicine & Health Sciences Journal. To complete your registration, please verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe AMHSJ Editorial Team`
    }
  },

  passwordReset: (name: string, resetUrl: string): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: "AMHSJ - Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - AMHSJ</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
            .logo-container { margin-bottom: 10px; }
            .logo { max-width: ${logo.width}px; height: auto; }
            .header-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .header-subtitle { font-size: 14px; opacity: 0.9; margin: 0; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .warning { background: #fee2e2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="max-width: 100%; height: auto;" />
            </div>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your AMHSJ account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
            
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Enabling two-factor authentication</li>
              <li>Not sharing your login credentials</li>
            </ul>
            
            <p>Best regards,<br>The AMHSJ Security Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>This is an automated security message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Password Reset Request\n\nHello ${name},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe AMHSJ Security Team`,
    }
  },

  // Submission Templates
  submissionReceived: (authorName: string, articleTitle: string, submissionId: string): EmailTemplate => ({
    subject: `AMHSJ - Submission Received: ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Received - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .timeline { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✅ AMHSJ</div>
            <p>Submission Successfully Received</p>
          </div>
          <div class="content">
            <h2>Thank you for your submission!</h2>
            <p>Dear ${authorName},</p>
            <p>We have successfully received your manuscript submission to the Advancing Modern Hardware & Software Journal (AMHSJ).</p>
            
            <div class="info-box">
              <h3>Submission Details</h3>
              <p><strong>Article Title:</strong> ${articleTitle}</p>
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Under Initial Review</p>
            </div>
            
            <div class="timeline">
              <h3>What Happens Next?</h3>
              <ol>
                <li><strong>Initial Review (3-5 days):</strong> Editorial team reviews for scope and technical requirements</li>
                <li><strong>Peer Review Assignment (1-2 weeks):</strong> Manuscript assigned to expert reviewers</li>
                <li><strong>Peer Review Process (4-6 weeks):</strong> Comprehensive review by domain experts</li>
                <li><strong>Editorial Decision (1-2 weeks):</strong> Final decision based on reviews</li>
              </ol>
            </div>
            
            <p>You can track your submission status anytime by logging into your AMHSJ dashboard. We will notify you at each stage of the review process.</p>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Please do not submit your manuscript to other journals while under review</li>
              <li>Any correspondence should reference your Submission ID: ${submissionId}</li>
              <li>You will receive updates via email at each stage</li>
            </ul>
            
            <p>Thank you for choosing AMHSJ for your research publication.</p>
            
            <p>Best regards,<br>AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions? Contact us at editorial@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Submission Received - AMHSJ\n\nDear ${authorName},\n\nYour manuscript "${articleTitle}" has been successfully submitted.\n\nSubmission ID: ${submissionId}\nStatus: Under Initial Review\n\nYou will be notified of the review progress.\n\nBest regards,\nAMHSJ Editorial Team`,
  }),

  reviewerAssignment: (
    reviewerName: string,
    articleTitle: string,
    authorName: string,
    deadline: string,
    reviewUrl: string,
  ): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: `AMHSJ - Review Assignment: ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Review Assignment - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .info-box { background: #faf5ff; border: 1px solid #a855f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .deadline-box { background: #fef3cd; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="max-width: 100%; height: auto;" />
            </div>
            <p>Peer Review Assignment</p>
          </div>
          <div class="content">
            <h2>Review Assignment Request</h2>
            <p>Dear Dr. ${reviewerName},</p>
            <p>Thank you for your continued support of AMHSJ. We would like to invite you to review a manuscript that falls within your area of expertise.</p>
            
            <div class="info-box">
              <h3>Manuscript Details</h3>
              <p><strong>Title:</strong> ${articleTitle}</p>
              <p><strong>Author:</strong> ${authorName}</p>
              <p><strong>Field:</strong> Hardware & Software Engineering</p>
              <p><strong>Review Type:</strong> Double-blind peer review</p>
            </div>
            
            <div class="deadline-box">
              <h3>⏰ Review Deadline</h3>
              <p><strong>${deadline}</strong></p>
              <p>Please complete your review by this date to maintain our publication timeline.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" class="button">Access Manuscript for Review</a>
            </div>
            
            <p><strong>Review Guidelines:</strong></p>
            <ul>
              <li>Evaluate technical soundness and methodology</li>
              <li>Assess novelty and significance of contributions</li>
              <li>Check clarity of presentation and writing quality</li>
              <li>Verify reproducibility of results</li>
              <li>Provide constructive feedback for improvement</li>
            </ul>
            
            <p><strong>Confidentiality:</strong> This manuscript is confidential and should not be shared or discussed with others. Please maintain the integrity of the peer review process.</p>
            
            <p>If you are unable to complete this review, please let us know as soon as possible so we can arrange an alternative reviewer.</p>
            
            <p>Thank you for your valuable contribution to the scientific community.</p>
            
            <p>Best regards,<br>AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions about the review process? Contact us at editorial@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Review Assignment - AMHSJ\n\nDear Dr. ${reviewerName},\n\nYou have been assigned to review: "${articleTitle}" by ${authorName}\n\nDeadline: ${deadline}\n\nAccess the manuscript: ${reviewUrl}\n\nThank you for your contribution.\n\nBest regards,\nAMHSJ Editorial Team`,
    }
  },

  reviewSubmitted: (authorName: string, articleTitle: string, submissionId: string): EmailTemplate => ({
    subject: `AMHSJ - Review Completed: ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Review Completed - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .status-box { background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 AMHSJ</div>
            <p>Review Process Update</p>
          </div>
          <div class="content">
            <h2>Review Completed</h2>
            <p>Dear ${authorName},</p>
            <p>We are writing to inform you that the peer review process for your manuscript has been completed.</p>
            
            <div class="status-box">
              <h3>Submission Status Update</h3>
              <p><strong>Article Title:</strong> ${articleTitle}</p>
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Current Status:</strong> Under Editorial Review</p>
              <p><strong>Next Step:</strong> Editorial decision based on reviewer feedback</p>
            </div>
            
            <p>Our editorial team is now reviewing the feedback from our expert reviewers. You can expect to receive the editorial decision along with reviewer comments within the next 1-2 weeks.</p>
            
            <p><strong>Possible Outcomes:</strong></p>
            <ul>
              <li><strong>Accept:</strong> Manuscript accepted for publication</li>
              <li><strong>Minor Revisions:</strong> Small changes required before acceptance</li>
              <li><strong>Major Revisions:</strong> Significant revisions needed with re-review</li>
              <li><strong>Reject:</strong> Manuscript not suitable for publication in current form</li>
            </ul>
            
            <p>We appreciate your patience during this process and your contribution to advancing research in hardware and software engineering.</p>
            
            <p>Best regards,<br>AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Track your submission status in your dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Review Completed - AMHSJ\n\nDear ${authorName},\n\nThe peer review for "${articleTitle}" (ID: ${submissionId}) has been completed.\n\nStatus: Under Editorial Review\nExpected Decision: 1-2 weeks\n\nBest regards,\nAMHSJ Editorial Team`,
  }),

  editorialDecision: (
    authorName: string,
    articleTitle: string,
    decision: string,
    comments: string,
    submissionId: string,
  ): EmailTemplate => ({
    subject: `AMHSJ - Editorial Decision: ${decision.toUpperCase()} - ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Editorial Decision - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: ${decision === "accept" ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : decision === "reject" ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" : "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"}; color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .decision-box { background: ${decision === "accept" ? "#f0fdf4" : decision === "reject" ? "#fef2f2" : "#fffbeb"}; border: 1px solid ${decision === "accept" ? "#10b981" : decision === "reject" ? "#ef4444" : "#f59e0b"}; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .comments-box { background: #f8f9fa; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${decision === "accept" ? "🎉" : decision === "reject" ? "📋" : "✏️"} AMHSJ</div>
            <p>Editorial Decision</p>
          </div>
          <div class="content">
            <h2>Editorial Decision</h2>
            <p>Dear ${authorName},</p>
            <p>Thank you for submitting your manuscript to the Advancing Modern Hardware & Software Journal. After careful consideration and peer review, we have reached an editorial decision.</p>
            
            <div class="decision-box">
              <h3>Decision: ${decision.toUpperCase().replace("_", " ")}</h3>
              <p><strong>Article Title:</strong> ${articleTitle}</p>
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${
              comments
                ? `
            <div class="comments-box">
              <h3>Editorial Comments</h3>
              <p>${comments}</p>
            </div>
            `
                : ""
            }
            
            ${
              decision === "accept"
                ? `
              <p><strong>Congratulations!</strong> Your manuscript has been accepted for publication in AMHSJ. Our production team will contact you shortly regarding the final publication process.</p>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Copyright agreement and final manuscript preparation</li>
                <li>DOI assignment and indexing</li>
                <li>Publication in the next available issue</li>
              </ul>
            `
                : decision === "reject"
                  ? `
              <p>While your manuscript was not accepted for publication in AMHSJ, we encourage you to consider the reviewer feedback for future submissions to other venues.</p>
              <p>Thank you for considering AMHSJ for your research publication.</p>
            `
                  : `
              <p>Your manuscript requires revisions before it can be considered for publication. Please address the reviewer comments and resubmit your revised manuscript.</p>
              <p><strong>Revision Guidelines:</strong></p>
              <ul>
                <li>Address all reviewer comments point-by-point</li>
                <li>Provide a detailed response letter</li>
                <li>Highlight changes in the revised manuscript</li>
                <li>Resubmit within 60 days to maintain priority</li>
              </ul>
            `
            }
            
            <p>The detailed reviewer reports are available in your AMHSJ dashboard.</p>
            
            <p>Best regards,<br>AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions? Contact us at editorial@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Editorial Decision - AMHSJ\n\nDear ${authorName},\n\nDecision: ${decision.toUpperCase()}\nArticle: ${articleTitle}\nID: ${submissionId}\n\n${comments}\n\nDetailed reviews available in your dashboard.\n\nBest regards,\nAMHSJ Editorial Team`,
  }),

  // Payment Templates (for future subscription/APC features)
  paymentConfirmation: (
    userName: string,
    amount: string,
    transactionId: string,
    description: string,
  ): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: "AMHSJ - Payment Confirmation",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .payment-box { background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="max-width: 100%; height: auto;" />
            </div>
            <p>Payment Confirmation</p>
          </div>
          <div class="content">
            <h2>Payment Successful</h2>
            <p>Dear ${userName},</p>
            <p>Thank you for your payment. We have successfully processed your transaction.</p>
            
            <div class="payment-box">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
            
            <p>This email serves as your receipt. Please keep it for your records.</p>
            
            <p>If you have any questions about this payment, please contact our support team with your transaction ID.</p>
            
            <p>Best regards,<br>AMHSJ Finance Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions? Contact us at finance@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Payment Confirmation - AMHSJ\n\nDear ${userName},\n\nPayment successful!\nAmount: $${amount}\nTransaction ID: ${transactionId}\nDescription: ${description}\n\nKeep this receipt for your records.\n\nBest regards,\nAMHSJ Finance Team`,
    }
  },

  // System Notification Templates
  systemMaintenance: (userName: string, maintenanceDate: string, duration: string): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: "AMHSJ - Scheduled System Maintenance",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Maintenance - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .maintenance-box { background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="max-width: 100%; height: auto;" />
            </div>
            <p>System Maintenance Notice</p>
          </div>
          <div class="content">
            <h2>Scheduled Maintenance</h2>
            <p>Dear ${userName},</p>
            <p>We are writing to inform you about scheduled maintenance on the AMHSJ platform.</p>
            
            <div class="maintenance-box">
              <h3>Maintenance Details</h3>
              <p><strong>Date & Time:</strong> ${maintenanceDate}</p>
              <p><strong>Expected Duration:</strong> ${duration}</p>
              <p><strong>Impact:</strong> Platform will be temporarily unavailable</p>
            </div>
            
            <p><strong>What to expect:</strong></p>
            <ul>
              <li>Temporary inability to access the platform</li>
              <li>Submission and review processes will be paused</li>
              <li>Email notifications may be delayed</li>
            </ul>
            
            <p><strong>Improvements:</strong></p>
            <ul>
              <li>Enhanced system performance</li>
              <li>Security updates</li>
              <li>New features and bug fixes</li>
            </ul>
            
            <p>We apologize for any inconvenience and appreciate your patience as we work to improve your experience.</p>
            
            <p>Best regards,<br>AMHSJ Technical Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions? Contact us at support@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `System Maintenance - AMHSJ\n\nDear ${userName},\n\nScheduled maintenance:\nDate: ${maintenanceDate}\nDuration: ${duration}\n\nPlatform will be temporarily unavailable.\n\nBest regards,\nAMHSJ Technical Team`,
    }
  },

  // Welcome email for new users
  welcomeEmail: (userName: string, userRole: string): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: "Welcome to AMHSJ - Your Account is Ready!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .feature-box { background: #f8f9fa; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="max-width: 100%; height: auto;" />
            </div>
            <p>Welcome to the Community!</p>
          </div>
          <div class="content">
            <h2>Welcome to AMHSJ, ${userName}!</h2>
            <p>Congratulations! Your account has been successfully created and verified. You are now part of the Advancing Modern Hardware & Software Journal community.</p>
            
            <div class="feature-box">
              <h3>Your Role: ${userRole}</h3>
              <p>You have been granted <strong>${userRole}</strong> access to the platform with the following capabilities:</p>
              ${
                userRole === "Author"
                  ? `
                <ul>
                  <li>Submit research manuscripts</li>
                  <li>Track submission status</li>
                  <li>Respond to reviewer comments</li>
                  <li>Access published articles</li>
                </ul>
              `
                  : userRole === "Reviewer"
                    ? `
                <ul>
                  <li>Review assigned manuscripts</li>
                  <li>Provide expert feedback</li>
                  <li>Access reviewer dashboard</li>
                  <li>Track review history</li>
                </ul>
              `
                    : userRole === "Editor"
                      ? `
                <ul>
                  <li>Manage editorial workflow</li>
                  <li>Assign reviewers</li>
                  <li>Make editorial decisions</li>
                  <li>Oversee publication process</li>
                </ul>
              `
                      : `
                <ul>
                  <li>Browse and search articles</li>
                  <li>Download published content</li>
                  <li>Access journal archives</li>
                  <li>Submit manuscripts</li>
                </ul>
              `
              }
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Access Your Dashboard</a>
            </div>
            
            <p><strong>Getting Started:</strong></p>
            <ul>
              <li>Complete your profile information</li>
              <li>Explore the journal archives</li>
              <li>Familiarize yourself with submission guidelines</li>
              <li>Join our community of researchers</li>
            </ul>
            
            <p><strong>Need Help?</strong></p>
            <ul>
              <li>Visit our FAQ section for common questions</li>
              <li>Contact our support team at support@amhsj.org</li>
              <li>Check out our submission guidelines</li>
            </ul>
            
            <p>We're excited to have you as part of the AMHSJ community and look forward to your contributions to advancing research in hardware and software engineering.</p>
            
            <p>Best regards,<br>The AMHSJ Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>This email was sent to you because you created an account with AMHSJ.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to AMHSJ!\n\nDear ${userName},\n\nYour account is ready! Role: ${userRole}\n\nAccess your dashboard: ${process.env.NEXTAUTH_URL}/dashboard\n\nNeed help? Contact support@amhsj.org\n\nBest regards,\nThe AMHSJ Team`,
    }
  },

  // Editorial Board Application Templates
  editorialBoardApplicationReceived: (
    applicantName: string,
    position: string,
    applicationId: string
  ): EmailTemplate => ({
    subject: "AMHSJ - Editorial Board Application Received",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Editorial Board Application - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .highlight-box { background: #f8f9ff; border: 2px solid #4f46e5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .timeline { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AMHSJ</div>
            <p>Editorial Board Application</p>
          </div>
          <div class="content">
            <h2>Thank you for your application, ${applicantName}!</h2>
            <p>We have successfully received your application for the <strong>${position}</strong> position on the AMHSJ Editorial Board.</p>
            
            <div class="highlight-box">
              <h3>Application Details:</h3>
              <p><strong>Application ID:</strong> ${applicationId}</p>
              <p><strong>Position:</strong> ${position}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="timeline">
              <h3>What happens next?</h3>
              <ul>
                <li><strong>Review Process:</strong> Our editorial committee will review your application within 2-3 weeks</li>
                <li><strong>Initial Screening:</strong> We'll assess your qualifications and experience</li>
                <li><strong>Interview:</strong> Qualified candidates may be invited for a virtual interview</li>
                <li><strong>Decision:</strong> We'll notify you of the final decision via email</li>
              </ul>
            </div>
            
            <p>We appreciate your interest in contributing to AMHSJ's mission of advancing modern hardware and software research. Your expertise and dedication to academic excellence are valuable to our community.</p>
            
            <p>If you have any questions about your application or the process, please don't hesitate to contact our editorial office.</p>
            
            <p>Best regards,<br>The AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Application ID: ${applicationId} | Keep this for your records</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Thank you for your Editorial Board application!\n\nDear ${applicantName},\n\nWe have received your application for the ${position} position.\n\nApplication ID: ${applicationId}\nSubmitted: ${new Date().toLocaleDateString()}\n\nNext Steps:\n- Review Process: 2-3 weeks\n- Initial Screening\n- Possible Interview\n- Final Decision\n\nWe'll contact you with updates.\n\nBest regards,\nThe AMHSJ Editorial Team`,
  }),

  editorialBoardApplicationNotification: (
    applicantName: string,
    position: string,
    applicationId: string,
    applicantEmail: string
  ): EmailTemplate => ({
    subject: `New Editorial Board Application - ${position}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Editorial Board Application - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .applicant-info { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .action-button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AMHSJ Admin</div>
            <p>Editorial Board Application Alert</p>
          </div>
          <div class="content">
            <h2>New Editorial Board Application Received</h2>
            <p>A new application has been submitted for the Editorial Board position.</p>
            
            <div class="applicant-info">
              <h3>Application Details:</h3>
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Email:</strong> ${applicantEmail}</p>
              <p><strong>Position:</strong> ${position}</p>
              <p><strong>Application ID:</strong> ${applicationId}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/admin/editorial-board/applications/${applicationId}" class="action-button">Review Application</a>
              <a href="${process.env.NEXTAUTH_URL}/admin/editorial-board/applications" class="action-button" style="background: #4f46e5;">View All Applications</a>
            </div>
            
            <p><strong>Action Required:</strong> Please review this application and provide feedback within 2 weeks to maintain our response time standards.</p>
            
            <p>Best regards,<br>AMHSJ System</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>This is an automated notification for administrators.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New Editorial Board Application\n\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\nPosition: ${position}\nApplication ID: ${applicationId}\nSubmitted: ${new Date().toLocaleString()}\n\nReview at: ${process.env.NEXTAUTH_URL}/admin/editorial-board/applications/${applicationId}\n\nPlease review within 2 weeks.\n\nAMHSJ System`,
  }),

  editorialBoardApplicationDecision: (
    applicantName: string,
    position: string,
    decision: 'approved' | 'rejected',
    comments: string,
    applicationId: string
  ): EmailTemplate => ({
    subject: `AMHSJ Editorial Board Application - ${decision === 'approved' ? 'Congratulations!' : 'Application Update'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Editorial Board Application Decision - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, ${decision === 'approved' ? '#059669 0%, #10b981 100%' : '#dc2626 0%, #ef4444 100%'}); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .decision-box { background: ${decision === 'approved' ? '#d1fae5' : '#fee2e2'}; border: 2px solid ${decision === 'approved' ? '#10b981' : '#ef4444'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .comments-box { background: #f8f9ff; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; }
          .action-button { display: inline-block; background: ${decision === 'approved' ? '#059669' : '#4f46e5'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AMHSJ</div>
            <p>Editorial Board Application Decision</p>
          </div>
          <div class="content">
            <h2>Dear ${applicantName},</h2>
            
            <div class="decision-box">
              <h3>${decision === 'approved' ? '🎉 Congratulations!' : 'Application Update'}</h3>
              <p><strong>Your application for ${position} has been ${decision}.</strong></p>
            </div>
            
            ${decision === 'approved' ? `
              <p>We are delighted to welcome you to the AMHSJ Editorial Board! Your expertise and commitment to advancing research in hardware and software will be invaluable to our journal.</p>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You will receive separate credentials to access the editorial board portal</li>
                <li>Orientation materials will be sent within 48 hours</li>
                <li>Your first editorial assignment will be provided next week</li>
                <li>Welcome meeting scheduled within 2 weeks</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="action-button">Access Your Dashboard</a>
              </div>
            ` : `
              <p>Thank you for your interest in joining the AMHSJ Editorial Board. After careful consideration, we have decided not to move forward with your application at this time.</p>
              
              <p>This decision does not reflect on your qualifications or contributions to the field. We encourage you to continue your excellent work and consider applying for future opportunities.</p>
            `}
            
            ${comments ? `
              <div class="comments-box">
                <h3>Additional Comments:</h3>
                <p>${comments}</p>
              </div>
            ` : ''}
            
            <p>Thank you for your interest in AMHSJ and your commitment to advancing research in our field.</p>
            
            <p>Best regards,<br>The AMHSJ Editorial Committee</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Application ID: ${applicationId}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Editorial Board Application Decision\n\nDear ${applicantName},\n\nYour application for ${position} has been ${decision}.\n\n${decision === 'approved' ? 'Congratulations! Welcome to the AMHSJ Editorial Board.\n\nNext Steps:\n- Editorial portal access within 48 hours\n- Orientation materials coming soon\n- First assignment next week\n- Welcome meeting in 2 weeks' : 'Thank you for your interest. We encourage you to apply for future opportunities.'}\n\n${comments ? `Comments: ${comments}\n\n` : ''}Best regards,\nThe AMHSJ Editorial Committee\n\nApplication ID: ${applicationId}`,
  }),

  editorialBoardWelcome: (
    memberName: string,
    position: string,
    boardAccessUrl: string
  ): EmailTemplate => ({
    subject: "Welcome to the AMHSJ Editorial Board!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Editorial Board - AMHSJ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .welcome-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .resources-box { background: #f8f9ff; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; }
          .action-button { display: inline-block; background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AMHSJ</div>
            <p>Editorial Board Welcome</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2>🎉 Welcome to the Team, ${memberName}!</h2>
              <p><strong>Position: ${position}</strong></p>
            </div>
            
            <p>We are thrilled to have you join the AMHSJ Editorial Board. Your expertise will help shape the future of hardware and software research publication.</p>
            
            <div class="resources-box">
              <h3>Getting Started:</h3>
              <ul>
                <li><strong>Editorial Portal:</strong> Access your personalized dashboard</li>
                <li><strong>Review Guidelines:</strong> Familiarize yourself with our standards</li>
                <li><strong>Editorial Calendar:</strong> View upcoming deadlines and meetings</li>
                <li><strong>Contact Directory:</strong> Connect with fellow board members</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${boardAccessUrl}" class="action-button">Access Editorial Portal</a>
              <a href="${process.env.NEXTAUTH_URL}/editorial-board/guidelines" class="action-button" style="background: #4f46e5;">Review Guidelines</a>
            </div>
            
            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>Maintain confidentiality of all review materials</li>
              <li>Declare any conflicts of interest promptly</li>
              <li>Meet review deadlines to ensure timely publication</li>
              <li>Participate in monthly editorial board meetings</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our editorial office.</p>
            
            <p>Welcome aboard!</p>
            
            <p>Best regards,<br>The AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Your journey as an editorial board member begins now!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to the AMHSJ Editorial Board!\n\nDear ${memberName},\n\nWelcome to your new position as ${position}!\n\nGetting Started:\n- Access Editorial Portal: ${boardAccessUrl}\n- Review Guidelines\n- Check Editorial Calendar\n- Connect with Board Members\n\nImportant:\n- Maintain confidentiality\n- Declare conflicts of interest\n- Meet review deadlines\n- Attend monthly meetings\n\nWelcome aboard!\n\nBest regards,\nThe AMHSJ Editorial Team`,
  }),

  // Editor Assignment Template with Conflict of Interest Declaration
  editorAssignment: (
    editorName: string,
    articleTitle: string,
    authorNames: string[],
    articleAbstract: string,
    submissionId: string,
    assignmentUrl: string,
    deadline: string
  ): EmailTemplate => ({
    subject: `AMHSJ - Editorial Assignment: ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Editorial Assignment - AMHSJ</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .content {
            padding: 40px 30px;
          }
          .info-box {
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .conflict-warning {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .deadline-box {
            background: #ecfdf5;
            border: 2px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
          }
          .action-button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px;
          }
          .decline-button {
            background: #ef4444;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AMHSJ</div>
            <p>Editorial Assignment Request</p>
          </div>
          <div class="content">
            <h2>Editorial Assignment Request</h2>
            <p>Dear Dr. ${editorName},</p>
            <p>A new manuscript has been submitted to AMHSJ and has been assigned to you for editorial handling. Please review the manuscript details and declare any potential conflicts of interest before accepting this assignment.</p>
            
            <div class="info-box">
              <h3>Manuscript Details</h3>
              <p><strong>Title:</strong> ${articleTitle}</p>
              <p><strong>Authors:</strong> ${authorNames.join(', ')}</p>
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Abstract:</strong></p>
              <p style="font-style: italic; margin-left: 20px;">${articleAbstract}</p>
            </div>

            <div class="conflict-warning">
              <h3>⚠️ Conflict of Interest Declaration Required</h3>
              <p><strong>Before accepting this assignment, please confirm that you do not have any conflicts of interest with regard to:</strong></p>
              <ul>
                <li><strong>Family relationships</strong> with any of the authors</li>
                <li><strong>Personal friendships</strong> that could influence your judgment</li>
                <li><strong>Co-authorship</strong> with any author within the last 10 years</li>
                <li><strong>Financial interests</strong> related to the research topic</li>
                <li><strong>Institutional affiliations</strong> that create bias</li>
                <li><strong>Professional rivalries</strong> or competitive research interests</li>
                <li><strong>Mentorship relationships</strong> (current or former students/supervisors)</li>
              </ul>
              <p><strong>If you have ANY of the above conflicts, please decline this assignment.</strong></p>
            </div>
            
            <div class="deadline-box">
              <h3>⏰ Response Deadline</h3>
              <p><strong>${deadline}</strong></p>
              <p>Please respond within 3 days to maintain our editorial timeline.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${assignmentUrl}" class="action-button">Review & Accept Assignment</a>
              <a href="${assignmentUrl}" class="action-button decline-button">Decline Assignment</a>
            </div>

            <p><strong>Editorial Process:</strong></p>
            <ol>
              <li><strong>Initial Assessment:</strong> Review manuscript for scope and technical quality</li>
              <li><strong>Reviewer Assignment:</strong> Select and invite peer reviewers</li>
              <li><strong>Review Management:</strong> Monitor review progress and quality</li>
              <li><strong>Decision Making:</strong> Make editorial decision based on reviews</li>
            </ol>
            
            <p>If you have any questions about this assignment or the editorial process, please contact our editorial office.</p>
            
            <p>Thank you for your service to the academic community.</p>
            
            <p>Best regards,<br>AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Questions about the editorial process? Contact us at editorial@amhsj.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Editorial Assignment - AMHSJ\n\nDear Dr. ${editorName},\n\nNew manuscript assigned: "${articleTitle}"\nAuthors: ${authorNames.join(', ')}\nSubmission ID: ${submissionId}\n\nCONFLICT OF INTEREST CHECK REQUIRED:\nBefore accepting, confirm no conflicts with:\n- Family relationships\n- Personal friendships\n- Co-authorship (10 years)\n- Financial interests\n- Institutional bias\n- Professional rivalries\n- Mentorship relationships\n\nDeadline: ${deadline}\n\nRespond at: ${assignmentUrl}\n\nBest regards,\nAMHSJ Editorial Team`,
  }),

  // Assignment Response Template
  assignmentResponse: (
    editorName: string,
    articleTitle: string,
    action: "accept" | "decline",
    conflictDeclared: boolean,
    conflictDetails?: string,
    declineReason?: string,
    editorComments?: string,
    assignmentId?: string
  ): EmailTemplate => ({
    subject: `AMHSJ - Editorial Assignment ${action === "accept" ? "Accepted" : "Declined"}: ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assignment Response - AMHSJ</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .header {
            background: ${action === "accept" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"};
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .status-box {
            background: ${action === "accept" ? "#ecfdf5" : "#fef2f2"};
            border: 2px solid ${action === "accept" ? "#10b981" : "#ef4444"};
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
          }
          .conflict-box {
            background: ${conflictDeclared ? "#fef3c7" : "#f0fdf4"};
            border: 2px solid ${conflictDeclared ? "#f59e0b" : "#22c55e"};
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .detail-box {
            background: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Assignment Response Received</h1>
            <p>Editorial Management System</p>
          </div>
          <div class="content">
            <h2>Assignment Response Details</h2>
            
            <div class="status-box">
              <h3 style="margin: 0; font-size: 24px;">
                ${action === "accept" ? "✅ ACCEPTED" : "❌ DECLINED"}
              </h3>
              <p style="margin: 10px 0 0 0; font-size: 18px;">
                Editor has ${action}ed the assignment
              </p>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Assignment Information</h3>
              <p><strong>Editor:</strong> ${editorName}</p>
              <p><strong>Article:</strong> ${articleTitle}</p>
              ${assignmentId ? `<p><strong>Assignment ID:</strong> ${assignmentId}</p>` : ""}
              <p><strong>Response Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="conflict-box">
              <h3>Conflict of Interest Declaration</h3>
              <p><strong>Conflict Declared:</strong> 
                <span style="color: ${conflictDeclared ? "#d97706" : "#059669"}; font-weight: bold;">
                  ${conflictDeclared ? "YES" : "NO"}
                </span>
              </p>
              
              ${conflictDetails ? `
                <div class="detail-box">
                  <h4>Conflict Details:</h4>
                  <p>${conflictDetails}</p>
                </div>
              ` : ""}
            </div>
            
            ${declineReason ? `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Decline Reason</h3>
                <div class="detail-box">
                  <p>${declineReason}</p>
                </div>
              </div>
            ` : ""}
            
            ${editorComments ? `
              <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Editor Comments</h3>
                <div class="detail-box">
                  <p>${editorComments}</p>
                </div>
              </div>
            ` : ""}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Next Steps</h3>
              ${action === "accept" ? `
                <ul>
                  <li>✅ Editor has been assigned to the manuscript</li>
                  <li>✅ Article status updated to "Under Review"</li>
                  <li>📝 Editor can now begin the review process</li>
                  <li>📧 Author will be notified of assignment</li>
                </ul>
              ` : `
                <ul>
                  <li>❌ Assignment has been declined</li>
                  <li>🔄 A new editor needs to be assigned</li>
                  <li>📋 Review decline reason and conflict details</li>
                  <li>🎯 Consider alternative editor candidates</li>
                </ul>
              `}
            </div>
            
            <p><strong>This is an automated notification from the AMHSJ Editorial Management System.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advancing Modern Hardware & Software Journal. All rights reserved.</p>
            <p>Response received on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Assignment Response - AMHSJ\n\nEditor: ${editorName}\nArticle: ${articleTitle}\nResponse: ${action.toUpperCase()}\nConflict Declared: ${conflictDeclared ? "YES" : "NO"}\n\n${conflictDetails ? `Conflict Details: ${conflictDetails}\n\n` : ""}${declineReason ? `Decline Reason: ${declineReason}\n\n` : ""}${editorComments ? `Comments: ${editorComments}\n\n` : ""}Response Date: ${new Date().toLocaleString()}\n\nAMHSJ Editorial Team`,
  }),

  // Guidelines Non-Compliance Rejection Template
  guidelinesRejection: (
    authorName: string,
    articleTitle: string,
    submissionId: string,
    rejectionReasons: string[]
  ): EmailTemplate => ({
    subject: `AMHSJ - Submission Rejected: Guidelines Non-Compliance - ${articleTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Rejected - AMHSJ</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .rejection-box {
            background: #fef2f2;
            border: 2px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .reasons-list {
            background: #fff5f5;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 15px 0;
          }
          .action-box {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Submission Rejected</h1>
            <p>Guidelines Non-Compliance</p>
          </div>
          <div class="content">
            <h2>Dear ${authorName},</h2>
            
            <p>Thank you for your submission to the American Medical Journal for Health Sciences (AMHSJ). Unfortunately, we must reject your manuscript without review due to non-compliance with our submission guidelines.</p>
            
            <div class="rejection-box">
              <h3 style="margin-top: 0; color: #dc2626;">Submission Details</h3>
              <p><strong>Title:</strong> ${articleTitle}</p>
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">REJECTED</span></p>
              <p><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="reasons-list">
              <h3 style="color: #dc2626; margin-top: 0;">Reasons for Rejection:</h3>
              <ul>
                ${rejectionReasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Why This Happened</h4>
              <p style="color: #92400e; margin-bottom: 0;">
                To maintain the quality and efficiency of our review process, we require all submissions to strictly follow our guidelines. 
                This ensures fair evaluation and reduces processing time for all authors.
              </p>
            </div>
            
            <div class="action-box">
              <h3 style="color: #166534; margin-top: 0;">📝 How to Resubmit Successfully</h3>
              <ol style="color: #166534;">
                <li><strong>Review Guidelines:</strong> Visit our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/submission-guidelines" style="color: #166534;">submission guidelines page</a></li>
                <li><strong>Download Template:</strong> Use our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/manuscript-template" style="color: #166534;">official manuscript template</a></li>
                <li><strong>Use Checklist:</strong> Complete our pre-submission checklist</li>
                <li><strong>Verify Formatting:</strong> Ensure your manuscript matches the template exactly</li>
                <li><strong>Resubmit:</strong> Submit your corrected manuscript as a new submission</li>
              </ol>
              
              <p style="color: #166534; margin-bottom: 0;">
                <strong>Note:</strong> This will be treated as a new submission. Please allow adequate time to properly format your manuscript according to our guidelines.
              </p>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">💡 Prevention Tips</h4>
              <ul style="color: #1e40af; margin-bottom: 0;">
                <li>Always use the official AMHSJ manuscript template</li>
                <li>Complete the author checklist before submission</li>
                <li>Ensure all required sections are included</li>
                <li>Verify all author information is complete</li>
                <li>Check that figures and tables meet quality standards</li>
              </ul>
            </div>
            
            <p>We encourage you to carefully review our guidelines and resubmit your manuscript once it meets all requirements. Our editorial team is committed to providing fair and timely review of compliant submissions.</p>
            
            <p>If you have questions about specific requirements, please contact our editorial office.</p>
            
            <p>Thank you for considering AMHSJ for your research publication.</p>
            
            <p>Sincerely,<br>
            The AMHSJ Editorial Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 American Medical Journal for Health Sciences. All rights reserved.</p>
            <p>For guidelines questions: <a href="process.env.EMAIL_FROMeditorial@amhsj.org">editorial@amhsj.org</a></p>
            <p>Rejection processed on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Submission Rejected - Guidelines Non-Compliance\n\nDear ${authorName},\n\nYour manuscript "${articleTitle}" (ID: ${submissionId}) has been rejected due to non-compliance with submission guidelines.\n\nReasons for rejection:\n${rejectionReasons.map(reason => `- ${reason}`).join('\n')}\n\nTo resubmit successfully:\n1. Review guidelines: ${process.env.NEXT_PUBLIC_BASE_URL}/submission-guidelines\n2. Download template: ${process.env.NEXT_PUBLIC_BASE_URL}/manuscript-template\n3. Use the pre-submission checklist\n4. Verify formatting matches template exactly\n5. Submit as new submission\n\nWe encourage you to carefully address these issues and resubmit.\n\nSincerely,\nThe AMHSJ Editorial Team\n\nContact: editorial@amhsj.org`,
  }),

  // Review Invitation Templates (Editorial Decision Process)
  reviewInvitation: (
    reviewerName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    manuscriptAbstract: string,
    acceptUrl: string,
    declineUrl: string,
    responseDeadline?: string,
    reviewDeadline?: string
  ): EmailTemplate => ({
    subject: `Invitation to Review – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Review Invitation - AMHSJ</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .manuscript-info {
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .deadline-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
          }
          .deadline-notice h4 {
            color: #92400e;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .deadline-notice .primary-deadline {
            font-size: 1.1em;
            font-weight: bold;
            color: #92400e;
          }
          .deadline-notice .secondary-info {
            font-size: 0.9em;
            color: #92400e;
            margin-top: 8px;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
          }
          .btn-accept {
            background: #22c55e;
            color: white;
          }
          .btn-decline {
            background: #ef4444;
            color: white;
          }
          .confidentiality-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .abstract-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .warning-box {
            background: #fee2e2;
            border: 2px solid #dc2626;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
          }
          .warning-box h5 {
            color: #dc2626;
            margin-top: 0;
            margin-bottom: 8px;
          }
          .warning-box p {
            color: #dc2626;
            margin-bottom: 0;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Review Invitation</h1>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          <div class="content">
            <p>Dear Dr. ${reviewerName},</p>
            
            <p>I am writing to invite you to review the manuscript referenced above, which I believe aligns closely with your area of expertise. Your insights would be highly valuable in assessing the quality, rigor, and contribution of this work.</p>
            
            <div class="manuscript-info">
              <h3>📄 Manuscript Details</h3>
              <p><strong>Title:</strong> ${manuscriptTitle}</p>
              <p><strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
            </div>

            <div class="deadline-notice">
              <h4>⏰ Important Deadlines</h4>
              <div class="primary-deadline">
                Please respond to this invitation within 7 days${responseDeadline ? ` (by ${responseDeadline})` : ''}
              </div>
              ${reviewDeadline ? `
              <div class="secondary-info">
                If accepted, review deadline: ${reviewDeadline} (21 days from acceptance)
              </div>
              ` : `
              <div class="secondary-info">
                If accepted, review due: 21 days from acceptance confirmation
              </div>
              `}
            </div>

            <div class="warning-box">
              <h5>⚠️ Automatic Withdrawal Notice</h5>
              <p>If no response is received within 7 days of this invitation, you will receive one additional reminder. After an additional 7 days (14 days total), the invitation will be automatically withdrawn to ensure timely processing of the manuscript.</p>
            </div>
            
            <p>You can view the manuscript abstract at the end of this message.</p>
            
            <h3>If you are able to review this manuscript</h3>
            <p>Please click the link below to confirm your willingness to participate:</p>
            
            <div class="action-buttons">
              <a href="${acceptUrl}" class="btn btn-accept">Agree to Review</a>
              <a href="${declineUrl}" class="btn btn-decline">Decline to Review</a>
            </div>
            
            <div class="confidentiality-notice">
              <h4 style="color: #92400e; margin-top: 0;">🔒 Confidentiality Notice</h4>
              <p style="color: #92400e; margin-bottom: 0;">
                We kindly ask that you treat this invitation, the manuscript, and all associated materials as <strong>strictly confidential</strong>. 
                This includes refraining from sharing your review, any part of the manuscript, or reviewer comments with others without explicit consent from the editors and authors, regardless of the publication outcome.
              </p>
            </div>
            
            <h3>If you are unable to review</h3>
            <p>Should you be unable to accept this request or have a potential conflict of interest, please click the decline link above and, if possible, recommend alternative qualified reviewers.</p>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">Additional Information:</h4>
              <ul style="color: #1e40af; margin-bottom: 0;">
                <li>All review materials and related communications must remain confidential, even after publication</li>
                <li>If the links above do not function, please email your response directly to editor@amhsj.org</li>
                <li>For login assistance, use the "Send Username/Password" option on the login page or contact our support team</li>
              </ul>
            </div>
            
            <p>Peer review lies at the heart of scholarly publishing, and your contribution plays an essential role in maintaining the integrity and quality of research dissemination. I sincerely thank you in advance for your time and expertise.</p>
            
            <div class="abstract-box">
              <h3>📋 Abstract</h3>
              <p>${manuscriptAbstract}</p>
            </div>
            
            <p>Kind regards,<br>
            <strong>Sylvester Izah, Ph.D.</strong><br>
            Editor<br>
            Advances in Medicine and Health Science Journal</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Advances in Medicine and Health Science Journal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Invitation to Review – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})

Dear Dr. ${reviewerName},

I am writing to invite you to review the manuscript referenced above, which I believe aligns closely with your area of expertise.

MANUSCRIPT DETAILS:
Title: ${manuscriptTitle}
Number: ${manuscriptNumber}

IMPORTANT DEADLINES:
- Response required within: 7 days${responseDeadline ? ` (by ${responseDeadline})` : ''}
- Review deadline if accepted: ${reviewDeadline || '21 days from acceptance'}

AUTOMATIC WITHDRAWAL NOTICE:
If no response is received within 7 days, you will receive one reminder. After an additional 7 days (14 days total), the invitation will be automatically withdrawn.

To accept: ${acceptUrl}
To decline: ${declineUrl}

CONFIDENTIALITY: Please treat all materials as strictly confidential.

ABSTRACT:
${manuscriptAbstract}

Kind regards,
Sylvester Izah, Ph.D.
Editor
Advances in Medicine and Health Science Journal`
  }),

  reviewInvitationReminder: (
    reviewerName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    manuscriptAbstract: string,
    acceptUrl: string,
    declineUrl: string,
    finalDeadline?: string
  ): EmailTemplate => ({
    subject: `REMINDER – Review Invitation for ${manuscriptTitle} (Manuscript No. ${manuscriptNumber}) - Response Required`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .urgent-notice { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .urgent-notice h3 { color: #dc2626; margin-top: 0; }
          .urgent-notice .deadline { font-size: 1.2em; font-weight: bold; color: #dc2626; }
          .btn { display: inline-block; padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .btn-accept { background: #28a745; color: white; }
          .btn-decline { background: #dc3545; color: white; }
          .abstract-box { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .withdrawal-warning { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 6px; }
          .withdrawal-warning h4 { color: #92400e; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 URGENT REMINDER: Review Invitation</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>

          <div class="urgent-notice">
            <h3>⚠️ Response Required Immediately</h3>
            <div class="deadline">
              Final deadline: ${finalDeadline || '7 days from original invitation'}
            </div>
            <p>This is your final reminder before automatic withdrawal</p>
          </div>
          
          <p>Dear Dr. ${reviewerName},</p>
          
          <p><strong>This is a final reminder</strong> regarding my earlier invitation to review the manuscript referenced above. We have not yet received your response to our invitation.</p>
          
          <p><strong>Manuscript:</strong> ${manuscriptTitle}<br>
          <strong>Number:</strong> ${manuscriptNumber}</p>

          <div class="withdrawal-warning">
            <h4>🚨 Automatic Withdrawal Notice</h4>
            <p>If we do not receive your response by <strong>${finalDeadline || 'the deadline specified'}</strong>, this invitation will be automatically withdrawn to ensure timely processing of the manuscript. This action is necessary to maintain our publication timeline and provide prompt feedback to the authors.</p>
          </div>
          
          <p><strong>Please respond immediately by clicking one of the links below:</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${acceptUrl}" class="btn btn-accept">ACCEPT REVIEW INVITATION</a>
            <a href="${declineUrl}" class="btn btn-decline">DECLINE REVIEW INVITATION</a>
          </div>
          
          <p>If you accept, the review will be due within <strong>21 days</strong> of your acceptance to ensure timely feedback to the authors. All materials and communications related to this review must be treated as strictly confidential.</p>
          
          <div class="abstract-box">
            <h3>Abstract:</h3>
            <p>${manuscriptAbstract}</p>
          </div>
          
          <p>We understand that you may have other commitments, and if you are unable to review on this occasion, please click the decline link above. Your prompt response, whether accepting or declining, is greatly appreciated.</p>
          
          <p>Thank you for your immediate attention to this matter.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `URGENT REMINDER – Review Invitation for ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})

Dear Dr. ${reviewerName},

This is a FINAL REMINDER regarding our invitation to review the manuscript referenced above.

URGENT: Response required by ${finalDeadline || 'the specified deadline'}

If no response is received by this deadline, the invitation will be automatically withdrawn.

Manuscript: ${manuscriptTitle}
Number: ${manuscriptNumber}

PLEASE RESPOND IMMEDIATELY:
To accept: ${acceptUrl}
To decline: ${declineUrl}

Review deadline if accepted: 21 days from acceptance

Abstract: ${manuscriptAbstract}

Thank you for your immediate attention.

Kind regards,
Sylvester Izah, Ph.D.
Editor
Advances in Medicine and Health Science Journal`
  }),

  reviewInvitationWithdrawal: (
    reviewerName: string,
    manuscriptTitle: string,
    manuscriptNumber: string
  ): EmailTemplate => ({
    subject: `Automatic Withdrawal of Review Invitation – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .withdrawal-notice { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .withdrawal-notice h3 { color: #dc2626; margin-top: 0; }
          .timeline-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
          .future-invitation { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Review Invitation Withdrawal</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear Dr. ${reviewerName},</p>

          <div class="withdrawal-notice">
            <h3>🚨 Automatic Withdrawal Notice</h3>
            <p>This is to inform you that the invitation previously sent to you to review the manuscript referenced above has been <strong>automatically withdrawn</strong> due to the expiration of our response deadline.</p>
          </div>
          
          <p><strong>Manuscript:</strong> ${manuscriptTitle}<br>
          <strong>Number:</strong> ${manuscriptNumber}</p>

          <div class="timeline-box">
            <h4>📅 Invitation Timeline</h4>
            <ul>
              <li>Initial invitation sent: 14 days ago</li>
              <li>Reminder sent: 7 days ago</li>
              <li>Response deadline: Today</li>
              <li><strong>Status: Automatically withdrawn</strong></li>
            </ul>
          </div>
          
          <p>We understand that scheduling conflicts, travel, or other commitments may have prevented you from responding to our invitation within the required timeframe. The automatic withdrawal system is in place to ensure timely processing of manuscripts and provide authors with prompt feedback on their work.</p>

          <p><strong>No action is required from you</strong> at this time. We have assigned alternative reviewers to ensure the manuscript continues through the peer review process without delay.</p>

          <div class="future-invitation">
            <h4>🤝 Future Collaboration</h4>
            <p>We value your expertise and would be pleased to invite you to review future manuscripts within your field. To help us send you more relevant invitations that better match your availability, please consider:</p>
            <ul>
              <li>Updating your reviewer profile with current areas of interest</li>
              <li>Indicating your preferred review frequency</li>
              <li>Notifying us of extended periods of unavailability</li>
            </ul>
          </div>
          
          <p>Should you wish to continue reviewing for Advances in Medicine and Health Science Journal, please feel free to contact us at editor@amhsj.org with your current areas of expertise and availability preferences.</p>
          
          <p>Thank you for your past contributions to the peer review process, and we hope to collaborate with you on future manuscripts.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Automatic Withdrawal of Review Invitation – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})

Dear Dr. ${reviewerName},

AUTOMATIC WITHDRAWAL NOTICE

This is to inform you that the invitation to review the manuscript "${manuscriptTitle}" (No. ${manuscriptNumber}) has been automatically withdrawn due to the expiration of our response deadline.

TIMELINE:
- Initial invitation: 14 days ago
- Reminder sent: 7 days ago  
- Response deadline: Today
- Status: Automatically withdrawn

We understand that other commitments may have prevented your response. Alternative reviewers have been assigned to ensure timely processing.

FUTURE COLLABORATION:
We value your expertise and hope to collaborate on future manuscripts. Please contact editor@amhsj.org to update your reviewer preferences.

Kind regards,
Sylvester Izah, Ph.D.
Editor
Advances in Medicine and Health Science Journal`
  }),

  reviewAcceptanceConfirmation: (
    reviewerName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    accessUrl: string,
    deadline: string
  ): EmailTemplate => ({
    subject: `Confirmation of Review Acceptance – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .deadline-box { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .confidentiality { background: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Review Acceptance Confirmed</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear Dr. ${reviewerName},</p>
          
          <p>Thank you for accepting our invitation to review the manuscript entitled:</p>
          
          <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
          <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
          
          <p>We greatly appreciate your willingness to contribute your time and expertise to the peer review process.</p>
          
          <p>Please log in to the Advances in Medicine and Health Science Journal submission system to access the full manuscript, related files, and review instructions:</p>
          
          <p style="text-align: center;">
            <a href="${accessUrl}" class="btn">Access Manuscript & Submit Review</a>
          </p>
          
          <div class="deadline-box">
            <h3>⏰ Review Deadline: ${deadline}</h3>
            <p>(21 days from acceptance)</p>
          </div>
          
          <div class="confidentiality">
            <h4>🔒 Confidentiality Reminder</h4>
            <p>The manuscript, your review, and any related communications must be treated as <strong>strictly confidential</strong>. This includes refraining from sharing the manuscript, your comments, or reviewer reports with anyone without explicit permission from the editors and authors, irrespective of the final publication decision.</p>
          </div>
          
          <p>If you encounter any technical difficulties, please use the "Send Username/Password" option on the login page or contact our editorial office at editor@amhsj.org.</p>
          
          <p>Thank you again for your valuable support in maintaining the quality and integrity of academic publishing.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Confirmation of Review Acceptance – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear Dr. ${reviewerName},\n\nThank you for accepting our invitation to review "${manuscriptTitle}" (No. ${manuscriptNumber}).\n\nAccess manuscript: ${accessUrl}\nDeadline: ${deadline}\n\nReminder: All materials must remain strictly confidential.\n\nFor technical support: editor@amhsj.org\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  // Editorial Decision Templates
  manuscriptAcceptance: (
    authorName: string,
    manuscriptTitle: string,
    manuscriptNumber: string
  ): EmailTemplate => ({
    subject: `Acceptance of Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .success-box { background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .next-steps { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Manuscript Accepted!</h1>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear ${authorName},</p>
          
          <p>On behalf of the editorial team of Advances in Medicine and Health Science Journal, I am pleased to inform you that your manuscript,</p>
          
          <div class="success-box">
            <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
            <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
            <p style="text-align: center; font-size: 18px; color: #155724;"><strong>has been ACCEPTED for publication following peer review.</strong></p>
          </div>
          
          <p>We commend you and your co-authors for your contribution to the advancement of knowledge in this field. Your work will undergo our final editorial checks, formatting, and proof preparation before being scheduled for publication in an upcoming issue of the journal.</p>
          
          <div class="next-steps">
            <h3>📋 Next Steps</h3>
            <p>In the coming days, you will receive further communication from our production team regarding:</p>
            <ul>
              <li>Final editorial review and formatting</li>
              <li>Galley proof preparation</li>
              <li>Publication timeline</li>
              <li>Copyright and licensing arrangements</li>
            </ul>
            <p><strong>You will be provided with galley proofs for final review and approval.</strong> Please ensure that any final corrections to the proofs are returned promptly to avoid delays in publication.</p>
          </div>
          
          <p>Once again, congratulations on the acceptance of your manuscript, and thank you for choosing Advances in Medicine and Health Science Journal as the platform for your work. We look forward to sharing your research with our readership.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Acceptance of Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear ${authorName},\n\nWe are pleased to inform you that your manuscript "${manuscriptTitle}" (No. ${manuscriptNumber}) has been ACCEPTED for publication.\n\nNext steps:\n- Final editorial checks and formatting\n- Galley proof preparation\n- Publication scheduling\n\nYou will receive galley proofs for final review. Please return corrections promptly to avoid publication delays.\n\nCongratulations!\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  manuscriptProofs: (
    authorName: string,
    manuscriptTitle: string,
    manuscriptNumber: string
  ): EmailTemplate => ({
    subject: `Proofs for Your Accepted Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e2e3e5; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .instructions { background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .urgent { background: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📄 Manuscript Proofs Ready</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear ${authorName},</p>
          
          <p>Please find attached the page proofs for your accepted manuscript:</p>
          
          <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
          <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
          
          <p>We kindly ask you to review the proofs carefully for any typographical errors, formatting issues, or minor corrections. <strong>Please note that substantive changes to the content are not permitted at this stage</strong> unless requested by the editor.</p>
          
          <div class="instructions">
            <h3>📝 Instructions:</h3>
            <ol>
              <li>Indicate any corrections directly on the proof MS file using comment tools, or track changes.</li>
              <li>Return your corrections to editor@amhsj.org (via the portal) within <strong>48–72 hours</strong> of receiving this email to avoid delays in publication.</li>
            </ol>
          </div>
          
          <div class="urgent">
            <h4>⚠️ Important Deadline</h4>
            <p><strong>If we do not receive your corrections within the specified time frame, we will assume the proofs are approved for publication as they stand.</strong></p>
          </div>
          
          <p>Thank you for your prompt attention to this matter, and congratulations again on the upcoming publication of your work in Advances in Medicine and Health Science Journal.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Proofs for Your Accepted Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear ${authorName},\n\nPlease find attached the page proofs for "${manuscriptTitle}" (No. ${manuscriptNumber}).\n\nInstructions:\n1. Review for typographical errors and formatting issues only\n2. Mark corrections using comments or track changes\n3. Return to editor@amhsj.org within 48-72 hours\n\nNote: Substantive changes not permitted unless requested by editor.\n\nIf no corrections received within deadline, proofs will be approved as-is.\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  manuscriptRejection: (
    authorName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    reviewerComments: string
  ): EmailTemplate => ({
    subject: `Decision on Your Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .decision-box { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .comments-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .encouragement { background: #d1ecf1; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Editorial Decision</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear ${authorName},</p>
          
          <p>Thank you for submitting your manuscript entitled:</p>
          
          <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
          <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
          
          <p>to Advances in Medicine and Health Science Journal. We appreciate the opportunity to consider your work for publication.</p>
          
          <div class="decision-box">
            <h3>Editorial Decision: NOT ACCEPTED</h3>
            <p>After careful evaluation by the editorial team and external peer reviewers, we regret to inform you that we are unable to accept your manuscript for publication in our journal. The decision was based on the comments below.</p>
          </div>
          
          <div class="encouragement">
            <p><strong>Please note:</strong> This decision does not necessarily reflect the quality of your work, but rather its suitability for our journal's scope and standards. We encourage you to consider revising your manuscript in light of the reviewers' comments and submitting it to another journal that may be a more appropriate venue.</p>
          </div>
          
          <div class="comments-box">
            <h3>Reviewer Comments:</h3>
            <div style="white-space: pre-line; padding: 10px; background: white; border-radius: 4px;">${reviewerComments}</div>
          </div>
          
          <p>On behalf of the editorial team, I thank you for considering Advances in Medicine and Health Science Journal as an outlet for your research, and I wish you every success in publishing your work elsewhere.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Decision on Your Manuscript – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear ${authorName},\n\nAfter careful evaluation, we are unable to accept your manuscript "${manuscriptTitle}" for publication.\n\nThis decision does not necessarily reflect the quality of your work, but rather its suitability for our journal's scope and standards.\n\nReviewer Comments:\n${reviewerComments}\n\nWe encourage you to consider the reviewers' feedback and submit to another appropriate venue.\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  manuscriptMinorRevision: (
    authorName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    deadline: string,
    reviewerComments: string,
    revisionUrl: string
  ): EmailTemplate => ({
    subject: `Decision on Your Manuscript – Revision Requested (Minor Comments) – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .decision-box { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps-box { background: #e2e3e5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .deadline-box { background: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .comments-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📝 Revision Requested</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear ${authorName},</p>
          
          <p>Thank you for submitting your manuscript entitled:</p>
          
          <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
          <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
          
          <p>to Advances in Medicine and Health Science Journal.</p>
          
          <div class="decision-box">
            <h3>✅ Good News!</h3>
            <p>After careful evaluation by the editorial team and peer reviewers, I am pleased to inform you that your manuscript is being <strong>considered for publication, pending minor revisions</strong>.</p>
          </div>
          
          <p>The reviewers' comments and suggestions are provided below. Please address each point carefully and indicate the changes made in a point-by-point response letter. When revising your manuscript, please highlight all changes in the text (e.g., using track changes or colored text) to facilitate review.</p>
          
          <div class="steps-box">
            <h3>📋 Next Steps:</h3>
            <ol>
              <li>Revise your manuscript in accordance with the reviewers' comments</li>
              <li>Prepare a detailed response letter explaining how each comment was addressed</li>
              <li>Submit the revised manuscript (with track changes showing all modifications)</li>
              <li><strong>Submit a clean copy manuscript (without colour or track changes)</strong> - required for publication</li>
              <li>Upload a change tracking document highlighting all modifications made</li>
              <li>Submit all files via the submission system portal</li>
            </ol>
            <p><strong>Submission Portal:</strong> <a href="${revisionUrl}">${revisionUrl}</a></p>
            
            <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">📋 Change Tracking Requirements:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Revised Manuscript:</strong> Document with all changes clearly marked using track changes</li>
                <li><strong>Clean Copy Manuscript:</strong> Final version without any track changes or comments (required for publication)</li>
                <li><strong>Response Letter:</strong> Point-by-point response addressing each reviewer comment</li>
                <li><strong>Change Summary:</strong> Document highlighting all modifications made to the manuscript</li>
              </ul>
            </div>
          </div>
          
          <div class="deadline-box">
            <h3>⏰ Important Deadline</h3>
            <p><strong>Deadline for Submission of Revised Manuscript: ${deadline}</strong><br>
            (7 days from the date this message was sent)</p>
          </div>
          
          <div class="comments-box">
            <h3>Reviewer Comments:</h3>
            <div style="white-space: pre-line; padding: 10px; background: white; border-radius: 4px;">${reviewerComments}</div>
          </div>
          
          <p>We look forward to receiving your revised manuscript and proceeding with the editorial process.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Decision on Your Manuscript – Revision Requested (Minor Comments) – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear ${authorName},\n\nYour manuscript "${manuscriptTitle}" is being considered for publication, pending minor revisions.\n\nNext Steps:\n1. Revise manuscript according to reviewers' comments\n2. Prepare detailed response letter\n3. Submit revised manuscript (with track changes) and response letter\n4. Submit clean revised manuscript and response letter\n\nDeadline: ${deadline} (7 days from today)\nSubmission: ${revisionUrl}\n\nReviewer Comments:\n${reviewerComments}\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  manuscriptMajorRevision: (
    authorName: string,
    manuscriptTitle: string,
    manuscriptNumber: string,
    deadline: string,
    reviewerComments: string
  ): EmailTemplate => ({
    subject: `Decision on Your Manuscript – Major Revision Required – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .decision-box { background: #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .important-notes { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .deadline-box { background: #ff7675; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .comments-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Major Revision Required</h2>
            <p>Advances in Medicine and Health Science Journal</p>
          </div>
          
          <p>Dear ${authorName},</p>
          
          <p>Thank you for submitting your manuscript entitled:</p>
          
          <p><strong>Manuscript Title:</strong> ${manuscriptTitle}<br>
          <strong>Manuscript Number:</strong> ${manuscriptNumber}</p>
          
          <p>to Advances in Medicine and Health Science Journal. After careful review by the editorial team and independent peer reviewers, we have reached a decision regarding your submission.</p>
          
          <div class="decision-box">
            <h3>🔄 Major Revision Invited</h3>
            <p>While the reviewers and editors found merit in your work, they have also identified <strong>substantial issues that must be addressed</strong> before we can make a final publication decision. Therefore, we invite you to revise your manuscript in accordance with the major comments provided below.</p>
          </div>
          
          <div class="important-notes">
            <h3>⚠️ Important Notes:</h3>
            <ul>
              <li>Please address each reviewer comment carefully and provide a detailed response letter outlining how each concern has been handled</li>
              <li>Ensure that all changes are clearly marked in the revised manuscript (e.g., using track changes or highlighting)</li>
              <li>Submit your revised clean manuscript (without using track changes or highlights)</li>
              <li>Submit your revised manuscript within the specified timeframe to ensure timely processing</li>
              <li>If additional time is required, you can apply accordingly via editor@amhsj.org</li>
              <li><strong>Failure to submit the revised version within this timeframe may result in your manuscript being treated as a new submission</strong></li>
            </ul>
          </div>
          
          <div class="deadline-box">
            <h3>⏰ Revision Deadline: ${deadline}</h3>
            <p>(Two weeks from the date this message was sent)</p>
          </div>
          
          <div class="comments-box">
            <h3>Reviewer Comments:</h3>
            <div style="white-space: pre-line; padding: 10px; background: white; border-radius: 4px;">${reviewerComments}</div>
          </div>
          
          <p>We look forward to receiving your revised manuscript and detailed response. <strong>Please note that the revised version will be subject to further peer review before a final decision is made.</strong></p>
          
          <p>Thank you for considering Advances in Medicine and Health Science Journal as the venue for your work. We appreciate your contribution to advancing scholarship in this field.</p>
          
          <p>Kind regards,<br>
          <strong>Sylvester Izah, Ph.D.</strong><br>
          Editor<br>
          Advances in Medicine and Health Science Journal</p>
        </div>
      </body>
      </html>
    `,
    text: `Decision on Your Manuscript – Major Revision Required – ${manuscriptTitle} (Manuscript No. ${manuscriptNumber})\n\nDear ${authorName},\n\nYour manuscript "${manuscriptTitle}" requires major revision before final decision.\n\nWhile reviewers found merit in your work, substantial issues must be addressed.\n\nDeadline: ${deadline} (2 weeks from today)\n\nRequirements:\n- Address each reviewer comment carefully\n- Provide detailed response letter\n- Mark all changes clearly in revised manuscript\n- Submit clean revised manuscript\n\nNote: Revised version will undergo further peer review.\n\nFor deadline extensions: editor@amhsj.org\n\nReviewer Comments:\n${reviewerComments}\n\nKind regards,\nSylvester Izah, Ph.D.\nEditor\nAdvances in Medicine and Health Science Journal`
  }),

  weeklyDigest: (
    userName: string,
    weekRange: string,
    newSubmissions: number,
    publishedArticles: number,
    newUsers: number,
    latestArticlesList: string,
    roleSpecificContent: string
  ): EmailTemplate => {
    const logo = getEmailLogo('medium')
    return {
      subject: `AMHSJ Weekly Digest - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AMHSJ Weekly Digest</title>
          ${getEmailStyles()}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="margin-bottom: 15px;">
              <h1>📊 Weekly Digest</h1>
              <p style="color: ${AMHSJ_COLORS.backgroundAlt}; margin: 0; font-size: 16px;">${weekRange}</p>
            </div>
            
            <div class="content">
              <h2 style="color: ${AMHSJ_COLORS.primary};">Hello ${userName}!</h2>
              
              <p>Here's your weekly summary of activity at Advances in Medicine & Health Sciences Journal:</p>
              
              <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 25px 0;">
                <div class="stat-card" style="background: ${AMHSJ_COLORS.background}; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                  <h3 style="color: ${AMHSJ_COLORS.primary}; margin: 0; font-size: 24px;">${newSubmissions}</h3>
                  <p style="margin: 5px 0 0 0; color: ${AMHSJ_COLORS.textLight};">New Submissions</p>
                </div>
                
                <div class="stat-card" style="background: ${AMHSJ_COLORS.background}; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                  <h3 style="color: ${AMHSJ_COLORS.success}; margin: 0; font-size: 24px;">${publishedArticles}</h3>
                  <p style="margin: 5px 0 0 0; color: ${AMHSJ_COLORS.textLight};">Published Articles</p>
                </div>
                
                <div class="stat-card" style="background: ${AMHSJ_COLORS.background}; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                  <h3 style="color: ${AMHSJ_COLORS.accent}; margin: 0; font-size: 24px;">${newUsers}</h3>
                  <p style="margin: 5px 0 0 0; color: ${AMHSJ_COLORS.textLight};">New Users</p>
                </div>
              </div>
              
              ${roleSpecificContent}
              
              ${latestArticlesList ? `
                <div class="articles-section" style="margin: 25px 0;">
                  <h3 style="color: ${AMHSJ_COLORS.primary};">📚 Latest Publications</h3>
                  <ul style="list-style: none; padding: 0;">
                    ${latestArticlesList}
                  </ul>
                </div>
              ` : ''}
              
              <div class="cta-section" style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://amhsj.org'}/dashboard" 
                   style="display: inline-block; background: ${AMHSJ_COLORS.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px;">
                  📊 View Dashboard
                </a>
                
                <a href="${process.env.NEXTAUTH_URL || 'https://amhsj.org'}/articles" 
                   style="display: inline-block; background: ${AMHSJ_COLORS.secondary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px;">
                  📖 Browse Articles
                </a>
              </div>
              
              <div class="tips-section" style="background: ${AMHSJ_COLORS.backgroundAlt}; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: ${AMHSJ_COLORS.primary}; margin-top: 0;">💡 Weekly Tip</h3>
                <p>Remember to check your dashboard regularly for new review invitations, submission updates, and important announcements. Stay engaged with the academic community!</p>
              </div>
              
              <p style="color: ${AMHSJ_COLORS.textLight}; font-size: 14px; margin-top: 30px;">
                You're receiving this digest because you're an active member of AMHSJ. 
                To manage your email preferences, <a href="${process.env.NEXTAUTH_URL || 'https://amhsj.org'}/settings" style="color: ${AMHSJ_COLORS.primary};">visit your settings</a>.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Advances in Medicine & Health Sciences Journal</strong></p>
              <p>Advancing medical knowledge through rigorous peer review</p>
              <p style="font-size: 12px; color: ${AMHSJ_COLORS.textLight};">
                © 2025 AMHSJ. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `AMHSJ Weekly Digest - ${weekRange}\n\nHello ${userName}!\n\nWeekly Summary:\n- New Submissions: ${newSubmissions}\n- Published Articles: ${publishedArticles}\n- New Users: ${newUsers}\n\n${latestArticlesList ? `Latest Publications:\n${latestArticlesList.replace(/<[^>]*>/g, '')}\n\n` : ''}Visit your dashboard: ${process.env.NEXTAUTH_URL || 'https://amhsj.org'}/dashboard\n\nStay engaged with the academic community!\n\n© 2025 AMHSJ. All rights reserved.`
    }
  },

}
