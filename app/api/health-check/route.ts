import { NextRequest } from "next/server"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { createApiResponse } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { withErrorHandler } from "@/lib/api-utils"
import * as crypto from "crypto"

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.api("Health check requested", { 
      requestId, 
      userId: session.user.id 
    })
    
    return createApiResponse(
      { 
        status: "healthy",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      "Health check completed successfully",
      requestId
    )
  } catch (error) {
    logger.error("Health check failed", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})