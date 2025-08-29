import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const settings = await loadEmailSettings()
    
    return NextResponse.json({
      success: true,
      data: settings
    })
    
  } catch (error) {
    logger.error("Error loading email settings:", error)
    return NextResponse.json(
      { error: "Failed to load email settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const emailSettings = await request.json()
    
    // Save email settings to database
    await saveEmailSettings(emailSettings)
    
    // Log the settings change
    await logEmailSettingsChange(session.user?.email || '', emailSettings)
    
    return NextResponse.json({
      success: true,
      message: "Email settings updated successfully"
    })
    
  } catch (error) {
    logger.error("Error saving email settings:", error)
    return NextResponse.json(
      { error: "Failed to save email settings" },
      { status: 500 }
    )
  }
}

async function loadEmailSettings() {
  try {
    const result = await db.execute(sql`
      SELECT * FROM email_settings WHERE id = 'default'
    `)
    
    if (result.length > 0) {
      const settings = result[0] as unknown
      return {
        submissionConfirmations: settings.submission_confirmations,
        reviewAssignments: settings.review_assignments,
        publicationNotifications: settings.publication_notifications,
        reviewerReminders: settings.reviewer_reminders,
        authorNotifications: settings.author_notifications,
        editorNotifications: settings.editor_notifications,
        deadlineReminders: settings.deadline_reminders,
        smtpSettings: {
          server: settings.smtp_server,
          port: settings.smtp_port,
          username: settings.smtp_username,
          password: settings.smtp_password ? "****" : "",
          fromEmail: settings.from_email,
          fromName: settings.from_name
        }
      }
    }
    
    // Return default settings if none found
    return {
      submissionConfirmations: true,
      reviewAssignments: true,
      publicationNotifications: true,
      reviewerReminders: true,
      authorNotifications: true,
      editorNotifications: true,
      deadlineReminders: true,
      smtpSettings: {
        server: "",
        port: 587,
        username: "",
        password: "",
        fromEmail: "process.env.EMAIL_FROMamjhs.com",
        fromName: "Academic Medical Journal of Health Sciences"
      }
    }
  } catch (error) {
    logger.error('Error loading email settings:', error)
    throw new AppError('Failed to load email settings')
  }
}

async function saveEmailSettings(emailSettings: unknown) {
  try {
    // Save to database using raw SQL for flexibility
    await db.execute(sql`
      INSERT INTO email_settings (
        id, 
        submission_confirmations, 
        review_assignments, 
        publication_notifications,
        reviewer_reminders,
        author_notifications,
        editor_notifications,
        deadline_reminders,
        smtp_server,
        smtp_port,
        smtp_username,
        smtp_password,
        from_email,
        from_name,
        updated_at
      )
      VALUES (
        'default',
        ${emailSettings.submissionConfirmations || true},
        ${emailSettings.reviewAssignments || true},
        ${emailSettings.publicationNotifications || true},
        ${emailSettings.reviewerReminders || true},
        ${emailSettings.authorNotifications || true},
        ${emailSettings.editorNotifications || true},
        ${emailSettings.deadlineReminders || true},
        ${emailSettings.smtpSettings?.server || ''},
        ${emailSettings.smtpSettings?.port || 587},
        ${emailSettings.smtpSettings?.username || ''},
        ${emailSettings.smtpSettings?.password || ''},
        ${emailSettings.smtpSettings?.fromEmail || 'process.env.EMAIL_FROMamjhs.com'},
        ${emailSettings.smtpSettings?.fromName || 'Academic Medical Journal of Health Sciences'},
        NOW()
      )
      ON CONFLICT (id) 
      DO UPDATE SET 
        submission_confirmations = ${emailSettings.submissionConfirmations || true},
        review_assignments = ${emailSettings.reviewAssignments || true},
        publication_notifications = ${emailSettings.publicationNotifications || true},
        reviewer_reminders = ${emailSettings.reviewerReminders || true},
        author_notifications = ${emailSettings.authorNotifications || true},
        editor_notifications = ${emailSettings.editorNotifications || true},
        deadline_reminders = ${emailSettings.deadlineReminders || true},
        smtp_server = ${emailSettings.smtpSettings?.server || ''},
        smtp_port = ${emailSettings.smtpSettings?.port || 587},
        smtp_username = ${emailSettings.smtpSettings?.username || ''},
        smtp_password = ${emailSettings.smtpSettings?.password || ''},
        from_email = ${emailSettings.smtpSettings?.fromEmail || 'process.env.EMAIL_FROMamjhs.com'},
        from_name = ${emailSettings.smtpSettings?.fromName || 'Academic Medical Journal of Health Sciences'},
        updated_at = NOW()
    `)
    
    logger.error("Email settings saved to database:", emailSettings)
  } catch (error) {
    logger.error('Error saving email settings:', error)
    throw new AppError('Failed to save email settings to database')
  }
}

async function logEmailSettingsChange(adminEmail: string, settings: unknown) {
  try {
    // Log to admin_logs table
    await db.execute(sql`
      INSERT INTO admin_logs (action, performed_by, details, created_at)
      VALUES ('EMAIL_SETTINGS_UPDATED', ${adminEmail}, ${JSON.stringify(settings)}, NOW())
    `)
    
    logger.error(`Email settings change logged by ${adminEmail}:`, settings)
  } catch (error) {
    logger.error('Error logging email settings change:', error)
    // Don't fail the request if logging fails
  }
}
