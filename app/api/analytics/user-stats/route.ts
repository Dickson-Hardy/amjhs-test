import { NextRequest } from "next/server"
import { z } from "zod"
import * as crypto from "crypto"
import {
  requireAuth,
  createApiResponse,
  createErrorResponse,
  validateRequest,
  withErrorHandler,
  ROLES
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { Analytics } from "@/lib/analytics"

// Validation schema
const querySchema = z.object({
  userId: z.string().uuid().optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication
    const { user } = await requireAuth(request, [ROLES.AUTHOR, ROLES.ASSOCIATE_EDITOR, ROLES.ADMIN])
    
    logger.api("Fetching user analytics", { 
      requestId, 
      userId: user.id, 
      userRole: user.role 
    })

    const { searchParams } = new URL(request.url)
    const queryData = validateRequest(querySchema, Object.fromEntries(searchParams))
    const userId = queryData.userId

    // Users can only access their own analytics, unless they're admin/editor
    if (userId && userId !== user.id && ![ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR].includes(user.role)) {
      logger.security("Unauthorized analytics access attempt", {
        requestId,
        userId: user.id,
        userRole: user.role,
        requestedUserId: userId
      })
      throw new Error("Forbidden: Can only access your own analytics")
    }

    const targetUserId = userId || user.id
    const result = await Analytics.getUserAnalytics(targetUserId)
    
    if (!result.success) {
      logger.error("Failed to fetch user analytics", { 
        requestId, 
        targetUserId, 
        error: "Analytics service error" 
      })
      throw new Error("Failed to fetch user analytics")
    }
    
    logger.api("User analytics fetched successfully", { 
      requestId, 
      targetUserId, 
      analyticsCount: Object.keys(result.analytics || {}).length 
    })

    return createApiResponse(
      { analytics: result.analytics },
      "User analytics fetched successfully",
      requestId
    )
  } catch (error) {
    logger.error("User analytics API error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})
