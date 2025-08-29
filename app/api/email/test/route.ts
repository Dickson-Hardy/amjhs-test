import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  sendEmailVerification, 
  sendWelcomeEmail, 
  sendSubmissionReceived,
  sendReviewerAssignment,
  sendEditorialDecision,
  checkEmailServiceHealth 
} from "@/lib/email-hybrid"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, email, provider, ...params } = await request.json()

    let result
    let serviceUsed = 'auto-detected'

    switch (type) {
      case "verification":
        result = await sendEmailVerification(email, params.name || 'Test User', params.verificationUrl || 'https://yourjournal.com/verify')
        serviceUsed = 'Resend (authentication)'
        break
        
      case "welcome":
        result = await sendWelcomeEmail(email, params.name || 'Test User', params.loginUrl || 'https://yourjournal.com/login')
        serviceUsed = 'Resend (user notification)'
        break
        
      case "submission":
        result = await sendSubmissionReceived(email, params.authorName || 'Dr. Test', params.articleTitle || 'Test Article', params.submissionId || 'TEST-001')
        serviceUsed = 'Resend (user notification)'
        break
        
      case "reviewer-assignment":
        result = await sendReviewerAssignment(
          email, 
          params.reviewerName || 'Dr. Reviewer', 
          params.articleTitle || 'Test Article',
          params.authorName || 'Dr. Author',
          params.deadline || '2025-09-01',
          params.reviewUrl || 'https://yourjournal.com/review/123'
        )
        serviceUsed = 'Zoho (editorial)'
        break
        
      case "editorial-decision":
        result = await sendEditorialDecision(
          email,
          params.authorName || 'Dr. Author',
          params.articleTitle || 'Test Article', 
          params.decision || 'Accept',
          params.comments || 'Congratulations on your excellent work.',
          params.submissionId || 'TEST-001'
        )
        serviceUsed = 'Zoho (editorial)'
        break
        
      case "health-check":
        const health = await checkEmailServiceHealth()
        return NextResponse.json({ 
          success: true, 
          message: "Email service health check completed",
          health,
          timestamp: new Date().toISOString()
        })
        
      default:
        return NextResponse.json({ error: "Invalid email type. Supported: verification, welcome, submission, reviewer-assignment, editorial-decision, health-check" }, { status: 400 })
    }

    logInfo("Test email sent", { 
      type, 
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
      serviceUsed,
      result 
    })

    return NextResponse.json({ 
      success: result?.success || true, 
      message: `Test email sent successfully via ${serviceUsed}`,
      messageId: result?.messageId,
      provider: result?.provider,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logError(error as Error, { endpoint: "/api/email/test" })
    return NextResponse.json({ 
      success: false,
      error: "Failed to send test email",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
