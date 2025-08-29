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
    
    logger.api("System info requested", { 
      requestId, 
      userId: session.user.id 
    })
    
    return createApiResponse(
      { 
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
      },
      "System information retrieved successfully",
      requestId
    )
  } catch (error) {
    logger.error("System info request failed", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})