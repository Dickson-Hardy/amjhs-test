import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialAssistantEmailService } from "@/lib/email/editorial-assistant-notifications"
import { logError } from "@/lib/logger"
import { z } from "zod"

// Notification request validation schema
const notificationSchema = z.object({
  submissionId: z.string().uuid(),
  notificationType: z.enum(['new_submission', 'screening_completion', 'daily_summary']),
  recipientEmail: z.string().email().optional(),
  additionalData: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to send notifications
    if (!["admin", "managing-editor", "editor-in-chief", "editorial-assistant"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = notificationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { submissionId, notificationType, recipientEmail, additionalData } = validation.data
    const emailService = new EditorialAssistantEmailService()

    let success = false
    let message = ""

    switch (notificationType) {
      case 'new_submission':
        // Send notification to editorial assistant about new submission
        const editorialAssistantEmail = recipientEmail || 'editorial.assistant@amhsj.org'
        success = await emailService.sendNewSubmissionNotification(submissionId, editorialAssistantEmail)
        message = success 
          ? `New submission notification sent to ${editorialAssistantEmail}`
          : `Failed to send notification to ${editorialAssistantEmail}`
        break

      case 'screening_completion':
        // Send notification to associate editor about completed screening
        if (!recipientEmail) {
          return NextResponse.json({ 
            error: "Recipient email required for screening completion notification" 
          }, { status: 400 })
        }
        
        const screeningData = additionalData?.screeningData || {
          screeningScore: 0,
          screeningNotes: "Screening completed"
        }
        
        success = await emailService.sendScreeningCompletionNotification(
          submissionId, 
          recipientEmail, 
          screeningData
        )
        message = success 
          ? `Screening completion notification sent to ${recipientEmail}`
          : `Failed to send notification to ${recipientEmail}`
        break

      case 'daily_summary':
        // Send daily summary to editorial assistant
        const summaryEmail = recipientEmail || 'editorial.assistant@amhsj.org'
        
        // Get summary data (you can customize this based on your needs)
        const summaryData = additionalData?.summaryData || {
          manuscriptsScreened: 0,
          pendingCount: 0,
          avgScreeningTime: 0,
          accuracyRate: 95,
          pendingManuscripts: []
        }
        
        success = await emailService.sendDailySummary(summaryEmail, summaryData)
        message = success 
          ? `Daily summary sent to ${summaryEmail}`
          : `Failed to send daily summary to ${summaryEmail}`
        break

      default:
        return NextResponse.json({ 
          error: "Invalid notification type" 
        }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message,
      notificationType,
      submissionId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/editorial-assistant/notify", 
      action: "sendNotification" 
    })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return available notification types and templates
    return NextResponse.json({
      success: true,
      notificationTypes: [
        {
          type: 'new_submission',
          description: 'Notify editorial assistant about new manuscript submission',
          requiredFields: ['submissionId'],
          optionalFields: ['recipientEmail']
        },
        {
          type: 'screening_completion',
          description: 'Notify associate editor about completed screening',
          requiredFields: ['submissionId', 'recipientEmail'],
          optionalFields: ['additionalData.screeningData']
        },
        {
          type: 'daily_summary',
          description: 'Send daily screening summary to editorial assistant',
          requiredFields: [],
          optionalFields: ['recipientEmail', 'additionalData.summaryData']
        }
      ],
      templates: [
        'New Submission Notification - Editorial Assistant',
        'Screening Completion Notification',
        'Daily Screening Summary - Editorial Assistant'
      ]
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/editorial-assistant/notify", 
      action: "getNotificationInfo" 
    })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
