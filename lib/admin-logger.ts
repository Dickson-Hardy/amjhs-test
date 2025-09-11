import { db } from "@/lib/db"
import { adminLogs } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import { logger } from "@/lib/logger"

interface LogAdminActionParams {
  adminId: string
  adminEmail: string
  action: string
  resourceType: string
  resourceId: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function logAdminAction({
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  details = '',
  ipAddress = 'unknown',
  userAgent = 'unknown'
}: LogAdminActionParams) {
  try {
    await db.insert(adminLogs).values({
      id: nanoid(),
      adminId,
      adminEmail,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date()
    })
  } catch (error) {
    logger.error('Failed to log admin action:', { 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      context: {
        adminId,
        action,
        resourceType,
        resourceId
      }
    })
    // Don't throw - logging failures shouldn't break the main operation
  }
}
