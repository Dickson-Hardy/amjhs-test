import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { 
  createApiResponse, 
  createErrorResponse,
  validateRequest,
  withErrorHandler,
  handleDatabaseError
} from "@/lib/api-utils"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { logger } from "@/lib/logger"
import { z } from "zod"

// Validation schema for settings
const SettingsSchema = z.object({
  journalName: z.string().min(1, "Journal name is required"),
  issn: z.string().min(1, "ISSN is required"),
  description: z.string().min(1, "Description is required"),
  reviewPeriod: z.number().min(1).max(365).default(21),
  minimumReviewers: z.number().min(1).max(10).default(2),
  enableOpenAccess: z.boolean().default(true),
  enableSubmissions: z.boolean().default(true),
  requireOrcid: z.boolean().default(false),
  emailNotifications: z.boolean().default(true)
})

async function getSettings(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  const session = await requireAuth(request, [ROLES.ADMIN])
  
  logger.api("Admin settings fetch requested", {
    userId: session.user.id,
    requestId,
    endpoint: "/api/admin/settings"
  })

  try {
    const settings = await loadJournalSettings()
    
    logger.api("Admin settings fetch completed", {
      userId: session.user.id,
      requestId
    })
    
    return createApiResponse(
      settings,
      "Settings retrieved successfully",
      requestId
    )
    
  } catch (error) {
    return handleDatabaseError(error)
  }
}

async function updateSettings(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  const session = await requireAuth(request, [ROLES.ADMIN])
  
  logger.api("Admin settings update requested", {
    userId: session.user.id,
    requestId,
    endpoint: "/api/admin/settings"
  })

  try {
    const body = await request.json()
    const validatedSettings = validateRequest(SettingsSchema, body)
    
    // Save settings to database
    await saveJournalSettings(validatedSettings)
    
    // Log the settings change
    await logSettingsChange(session.user.email, validatedSettings, requestId)
    
    logger.api("Admin settings updated successfully", {
      userId: session.user.id,
      settingsChanged: Object.keys(validatedSettings),
      requestId
    })
    
    return createApiResponse(
      { settings: validatedSettings },
      "Settings saved successfully",
      requestId
    )
    
  } catch (error) {
    return handleDatabaseError(error)
  }
}

async function loadJournalSettings() {
  try {
    const result = await db.execute(sql`
      SELECT settings_data FROM journal_settings WHERE id = 'default'
    `)
    
    if (result.length > 0) {
      return JSON.parse((result[0] as any).settings_data)
    }
    
    // Return default settings if none found
    return {
      journalName: "Academic Medical Journal of Health Sciences",
      issn: "2789-4567",
      description: "A peer-reviewed medical journal focused on health sciences research and clinical practice.",
      reviewPeriod: 21,
      minimumReviewers: 2,
      enableOpenAccess: true,
      enableSubmissions: true,
      requireOrcid: false,
      emailNotifications: true
    }
  } catch (error) {
    logger.error("Error loading journal settings", {
      error: error instanceof Error ? error.message : String(error)
    })
    
    // Return default settings on error
    return {
      journalName: "Academic Medical Journal of Health Sciences", 
      issn: "2789-4567",
      description: "A peer-reviewed medical journal focused on health sciences research and clinical practice.",
      reviewPeriod: 21,
      minimumReviewers: 2,
      enableOpenAccess: true,
      enableSubmissions: true,
      requireOrcid: false,
      emailNotifications: true
    }
  }
}

async function saveJournalSettings(settings: any) {
  try {
    // Save to database using raw SQL for flexibility
    await db.execute(sql`
      INSERT INTO journal_settings (id, settings_data, review_period_days, minimum_reviewers, updated_at)
      VALUES ('default', ${JSON.stringify(settings)}, ${settings.reviewPeriod || 21}, ${settings.minimumReviewers || 2}, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        settings_data = ${JSON.stringify(settings)},
        review_period_days = ${settings.reviewPeriod || 21},
        minimum_reviewers = ${settings.minimumReviewers || 2},
        updated_at = NOW()
    `)
    
    logger.info("Settings saved to database successfully", { 
      settingsKeys: Object.keys(settings) 
    })
  } catch (error) {
    logger.error("Error saving journal settings", {
      error: error instanceof Error ? error.message : String(error)
    })
    throw new Error('Failed to save settings to database')
  }
}

async function logSettingsChange(adminEmail: string, settings: any, requestId: string) {
  try {
    // Log to database - create admin_logs table if needed
    await db.execute(sql`
      INSERT INTO admin_logs (action, performed_by, details, created_at)
      VALUES ('SETTINGS_UPDATED', ${adminEmail}, ${JSON.stringify(settings)}, NOW())
    `)
    
    logger.api("Settings change logged successfully", {
      adminEmail,
      requestId,
      settingsKeys: Object.keys(settings)
    })
  } catch (error) {
    logger.error("Error logging settings change", {
      adminEmail,
      requestId,
      error: error instanceof Error ? error.message : String(error)
    })
    // Don't fail the request if logging fails
  }
}

export const GET = withErrorHandler(getSettings)
export const POST = withErrorHandler(updateSettings)
