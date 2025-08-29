import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailLogs } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email-hybrid"
import { logError } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

interface SupportTicket {
  type: 'technical' | 'editorial' | 'general' | 'emergency' | 'appeals'
  subject: string
  message: string
  userInfo: {
    name: string
    email: string
    manuscriptId?: string
  }
  priority: 'low' | 'medium' | 'high' | 'emergency'
  attachments?: string[]
}

const supportEmails = {
  technical: 'system@amhsj.org',
  editorial: 'editorial@amhsj.org',
  general: 'info@amhsj.org',
  emergency: 'emergency@amhsj.org',
  appeals: 'editor-in-chief@amhsj.org'
}

const responseTimes = {
  technical: '4 hours',
  editorial: '24 hours',
  general: '12 hours',
  emergency: '1 hour',
  appeals: '48 hours'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ticketData: SupportTicket = await request.json()

    // Validate required fields
    if (!ticketData.type || !ticketData.subject || !ticketData.message) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: type, subject, and message are required"
      }, { status: 400 })
    }

    // Generate ticket ID
    const ticketId = `AMHSJ-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    // Prepare email content
    const supportEmail = supportEmails[ticketData.type]
    const expectedResponse = responseTimes[ticketData.type]

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .ticket-info { background: #f8f9fa; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
        .user-info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .priority-${ticketData.priority} { 
            color: ${ticketData.priority === 'emergency' ? '#dc2626' : 
                    ticketData.priority === 'high' ? '#ea580c' : 
                    ticketData.priority === 'medium' ? '#2563eb' : '#6b7280'};
            font-weight: bold;
        }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Support Ticket - ${ticketData.type.toUpperCase()}</h1>
        <p>Ticket ID: ${ticketId}</p>
    </div>
    
    <div class="content">
        <div class="ticket-info">
            <h3>Ticket Details</h3>
            <p><strong>Type:</strong> ${ticketData.type.charAt(0).toUpperCase() + ticketData.type.slice(1)} Support</p>
            <p><strong>Priority:</strong> <span class="priority-${ticketData.priority}">${ticketData.priority.toUpperCase()}</span></p>
            <p><strong>Subject:</strong> ${ticketData.subject}</p>
            <p><strong>Expected Response Time:</strong> ${expectedResponse}</p>
        </div>

        <div class="user-info">
            <h3>User Information</h3>
            <p><strong>Name:</strong> ${ticketData.userInfo.name}</p>
            <p><strong>Email:</strong> ${ticketData.userInfo.email}</p>
            ${ticketData.userInfo.manuscriptId ? `<p><strong>Manuscript ID:</strong> ${ticketData.userInfo.manuscriptId}</p>` : ''}
            <p><strong>User ID:</strong> ${session.user.id}</p>
        </div>

        <div>
            <h3>Message</h3>
            <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px;">
                ${ticketData.message.replace(/\n/g, '<br>')}
            </div>
        </div>

        ${ticketData.attachments?.length ? `
        <div>
            <h3>Attachments</h3>
            <ul>
                ${ticketData.attachments.map(att => `<li>${att}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>

    <div class="footer">
        <p><strong>Advances in Medicine and Health Sciences Journal</strong></p>
        <p>This ticket was submitted on ${new Date().toLocaleString()}</p>
        <p>Please respond to the user at: ${ticketData.userInfo.email}</p>
    </div>
</body>
</html>
    `

    // Send email to support team
    await sendEmail({
      to: supportEmail,
      subject: `[${ticketId}] ${ticketData.subject}`,
      html: emailContent
    })

    // Send confirmation email to user
    const confirmationEmail = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .ticket-details { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .next-steps { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Support Ticket Received</h1>
        <p>We've got your message and we're on it!</p>
    </div>
    
    <div class="content">
        <p>Dear ${ticketData.userInfo.name},</p>
        
        <p>Thank you for contacting AMHSJ support. We have received your support request and assigned it ticket ID <strong>${ticketId}</strong>.</p>

        <div class="ticket-details">
            <h3>Your Ticket Details</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Type:</strong> ${ticketData.type.charAt(0).toUpperCase() + ticketData.type.slice(1)} Support</p>
            <p><strong>Subject:</strong> ${ticketData.subject}</p>
            <p><strong>Priority:</strong> ${ticketData.priority.toUpperCase()}</p>
            <p><strong>Expected Response:</strong> Within ${expectedResponse}</p>
        </div>

        <div class="next-steps">
            <h3>What Happens Next?</h3>
            <ul>
                <li>Our ${ticketData.type} support team will review your request</li>
                <li>You'll receive an initial response within <strong>${expectedResponse}</strong></li>
                <li>We'll keep you updated on progress via email</li>
                <li>Please reference ticket ID <strong>${ticketId}</strong> in all correspondence</li>
            </ul>
        </div>

        <p>If this is an emergency and you haven't heard from us within the expected timeframe, please contact <a href="process.env.EMAIL_FROMemergency@amhsj.org">emergency@amhsj.org</a>.</p>

        <p>Thank you for using AMHSJ!</p>
        
        <p>Best regards,<br>
        <strong>AMHSJ Support Team</strong></p>
    </div>
</body>
</html>
    `

    await sendEmail({
      to: ticketData.userInfo.email,
      subject: `[${ticketId}] Support Request Received - ${ticketData.subject}`,
      html: confirmationEmail
    })

    // Log the support ticket
    await db.insert(emailLogs).values({
      toEmail: supportEmail,
      fromEmail: 'system@amhsj.org',
      subject: `[${ticketId}] ${ticketData.subject}`,
      body: emailContent,
      emailType: 'support_ticket',
      status: 'sent',
      metadata: {
        ticketId,
        type: ticketData.type,
        priority: ticketData.priority,
        userId: session.user.id,
        userEmail: ticketData.userInfo.email
      }
    })

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Support ticket created successfully. You should receive a response within ${expectedResponse}.`,
      supportEmail,
      expectedResponse
    })

  } catch (error: unknown) {
    logError(error, { endpoint: '/api/support/ticket' })
    return NextResponse.json({
      success: false,
      message: "Failed to create support ticket"
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    // Return support contact information
    const supportInfo = {
      contacts: supportEmails,
      responseTimes,
      businessHours: "Monday - Friday: 9:00 AM - 5:00 PM (GMT)",
      emergencyAvailable: "24/7/365",
      escalationContact: "editor-in-chief@amhsj.org"
    }

    if (type && supportEmails[type as keyof typeof supportEmails]) {
      return NextResponse.json({
        success: true,
        contact: {
          email: supportEmails[type as keyof typeof supportEmails],
          responseTime: responseTimes[type as keyof typeof responseTimes],
          type: type
        }
      })
    }

    return NextResponse.json({
      success: true,
      supportInfo
    })

  } catch (error: unknown) {
    logError(error, { endpoint: '/api/support/ticket GET' })
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve support information"
    }, { status: 500 })
  }
}
