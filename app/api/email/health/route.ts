import { type NextRequest, NextResponse } from "next/server"
import { checkEmailServiceHealth, getEmailQueueStatus } from "@/lib/email-hybrid"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    // Check health of both email services
    const health = await checkEmailServiceHealth()
    
    // Get current queue status
    const queueStatus = getEmailQueueStatus()
    
    // Log the health check
    logInfo("Email service health check", { health, queueStatus })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        resend: {
          status: health.resend ? 'healthy' : 'unhealthy',
          description: 'Handles user authentication, notifications, and payment emails'
        },
        zoho: {
          status: health.zoho ? 'healthy' : 'unhealthy', 
          description: 'Handles editorial communications and system alerts'
        }
      },
      overall: {
        status: health.overall ? 'healthy' : 'degraded',
        message: health.overall 
          ? 'All email services operational' 
          : 'One or more email services experiencing issues'
      },
      queue: {
        length: queueStatus.queueLength,
        isProcessing: queueStatus.isProcessing,
        pendingEmails: queueStatus.pendingEmails.map(email => ({
          id: email.id,
          to: email.to.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email for privacy
          category: email.category,
          provider: email.provider,
          retries: email.retries,
          scheduledAt: email.scheduledAt
        }))
      },
      routing: {
        description: 'Emails are automatically routed based on category and recipient domain',
        rules: {
          'Authentication emails': 'Resend (verification, password reset, welcome)',
          'User notifications': 'Resend (payments, submissions, publications)', 
          'Editorial communications': 'Zoho (reviews, decisions, assignments)',
          'System alerts': 'Zoho (admin notifications, system status)',
          'Verified domains': 'Zoho (internal editorial communications)'
        }
      }
    })
    
  } catch (error) {
    logError(error as Error, { endpoint: "/api/email/health" })
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check email service health",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
