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
    
    logger.api("Version info requested", { 
      requestId, 
      userId: session.user.id 
    })
    
    return createApiResponse(
      { 
        version: "1.0.0", 
        build: process.env.BUILD_ID || "development",
        timestamp: new Date().toISOString() 
      },
      "Version information retrieved successfully",
      requestId
    )
  } catch (error) {
    logger.error("Version check failed", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})