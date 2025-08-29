import { NextRequest } from "next/server"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { createApiResponse, createErrorResponse } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { withErrorHandler } from "@/lib/api-utils"
import * as crypto from "crypto"

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.api("Status check requested", { 
      requestId, 
      userId: session.user.id 
    })
    
    return createApiResponse(
      { status: "operational", timestamp: new Date().toISOString() },
      "System status retrieved successfully",
      requestId
    )
  } catch (error) {
    logger.error("Status check failed", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})