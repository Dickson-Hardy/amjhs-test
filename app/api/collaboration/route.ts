/**
 * Enhanced Collaboration API Route
 * Handles real-time collaboration sessions with operational transformation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { realTimeCollaborationService } from '@/lib/real-time-collaboration'
import { apiRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Request validation schemas
const CreateSessionSchema = z.object({
  manuscriptId: z.string(),
  sessionType: z.enum(["review", "edit", "comment"]),
  permissions: z.object({
    canEdit: z.boolean(),
    canComment: z.boolean(),
    canViewHistory: z.boolean(),
    canManageUsers: z.boolean()
  }).optional()
})

const ApplyEditSchema = z.object({
  sessionId: z.string(),
  operation: z.object({
    type: z.enum(["insert", "delete", "retain"]),
    position: z.number(),
    content: z.string().optional(),
    length: z.number().optional(),
    attributes: z.record(z.any()).optional()
  }),
  version: z.number(),
  userId: z.string()
})

const AddCommentSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
  position: z.object({
    start: z.number(),
    end: z.number()
  }),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit.isAllowed(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: "Rate limit exceeded"
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
        }
      })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const sessionId = searchParams.get('sessionId')

    switch (action) {
      case 'session':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required'
          }, { status: 400 })
        }
        return handleGetSession(sessionId, session.user.id)
      
      case 'user-sessions':
        const manuscriptId = searchParams.get('manuscriptId')
        return handleGetUserSessions(session.user.id, manuscriptId)
      
      case 'comments':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required'
          }, { status: 400 })
        }
        return handleGetComments(sessionId, session.user.id)
      
      case 'edit-history':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required'
          }, { status: 400 })
        }
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        return handleGetEditHistory(sessionId, session.user.id, limit, offset)
      
      case 'presence':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required'
          }, { status: 400 })
        }
        return handleGetPresence(sessionId, session.user.id)
      
      case 'versions':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required'
          }, { status: 400 })
        }
        return handleGetVersions(sessionId, session.user.id)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error in collaboration GET API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit.isAllowed(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: "Rate limit exceeded"
      }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-session':
        return handleCreateSession(session.user.id, body)
      
      case 'join-session':
        return handleJoinSession(session.user.id, body)
      
      case 'apply-edit':
        return handleApplyEdit(session.user.id, body)
      
      case 'add-comment':
        return handleAddComment(session.user.id, body)
      
      case 'update-presence':
        return handleUpdatePresence(session.user.id, body)
      
      case 'leave-session':
        return handleLeaveSession(session.user.id, body)
      
      case 'create-version':
        return handleCreateVersion(session.user.id, body)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error in collaboration POST API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET handlers
async function handleGetSession(sessionId: string, userId: string) {
  try {
    const hasPermission = await checkSessionPermission(sessionId, userId)
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to access this session"
      }, { status: 403 })
    }

    const sessionData = await realTimeCollaborationService.getSession(sessionId)
    
    return NextResponse.json({
      success: true,
      data: sessionData
    })
  } catch (error) {
    logger.error('Get session error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get session'
    }, { status: 500 })
  }
}

async function handleGetUserSessions(userId: string, manuscriptId: string | null) {
  try {
    const sessions = await realTimeCollaborationService.getUserSessions(userId, manuscriptId)
    
    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total: sessions.length
      }
    })
  } catch (error) {
    logger.error('Get user sessions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get user sessions'
    }, { status: 500 })
  }
}

async function handleGetComments(sessionId: string, userId: string) {
  try {
    const hasPermission = await checkSessionPermission(sessionId, userId)
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to access comments for this session"
      }, { status: 403 })
    }

    const comments = await realTimeCollaborationService.getComments(sessionId)
    
    return NextResponse.json({
      success: true,
      data: {
        comments,
        total: comments.length
      }
    })
  } catch (error) {
    logger.error('Get comments error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get comments'
    }, { status: 500 })
  }
}

async function handleGetEditHistory(sessionId: string, userId: string, limit: number, offset: number) {
  try {
    const hasPermission = await checkSessionPermission(sessionId, userId, "canViewHistory")
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to view history for this session"
      }, { status: 403 })
    }

    const history = await realTimeCollaborationService.getEditHistory(sessionId, limit, offset)
    
    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    logger.error('Get edit history error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get edit history'
    }, { status: 500 })
  }
}

async function handleGetPresence(sessionId: string, userId: string) {
  try {
    const hasPermission = await checkSessionPermission(sessionId, userId)
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to view presence for this session"
      }, { status: 403 })
    }

    const presence = await realTimeCollaborationService.getActiveUsers(sessionId)
    
    return NextResponse.json({
      success: true,
      data: {
        activeUsers: presence,
        total: presence.length
      }
    })
  } catch (error) {
    logger.error('Get presence error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get presence information'
    }, { status: 500 })
  }
}

async function handleGetVersions(sessionId: string, userId: string) {
  try {
    const hasPermission = await checkSessionPermission(sessionId, userId, "canViewHistory")
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to view versions for this session"
      }, { status: 403 })
    }

    const versions = await realTimeCollaborationService.getVersions(sessionId)
    
    return NextResponse.json({
      success: true,
      data: {
        versions,
        total: versions.length
      }
    })
  } catch (error) {
    logger.error('Get versions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get versions'
    }, { status: 500 })
  }
}

// POST handlers
async function handleCreateSession(userId: string, body: unknown) {
  try {
    const validatedData = CreateSessionSchema.parse(body)

    // Check if user has permission to create session for this manuscript
    const hasPermission = await checkManuscriptPermission(
      validatedData.manuscriptId,
      userId,
      ["admin", "editor", "author", "reviewer"]
    )

    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to create session for this manuscript"
      }, { status: 403 })
    }

    const session = await realTimeCollaborationService.createSession(
      validatedData.manuscriptId,
      userId,
      validatedData.sessionType,
      validatedData.permissions
    )
    
    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Create session error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create session'
    }, { status: 500 })
  }
}

async function handleJoinSession(userId: string, body: unknown) {
  try {
    const { sessionId, permissions } = body

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    const sessionData = await realTimeCollaborationService.joinSession(
      sessionId,
      userId,
      permissions
    )
    
    return NextResponse.json({
      success: true,
      data: sessionData
    })
  } catch (error) {
    logger.error('Join session error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to join session'
    }, { status: 500 })
  }
}

async function handleApplyEdit(userId: string, body: unknown) {
  try {
    const validatedData = ApplyEditSchema.parse(body)

    const result = await realTimeCollaborationService.applyEdit(
      validatedData.sessionId,
      validatedData.operation,
      validatedData.version,
      validatedData.userId
    )
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Apply edit error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to apply edit'
    }, { status: 500 })
  }
}

async function handleAddComment(userId: string, body: unknown) {
  try {
    const validatedData = AddCommentSchema.parse(body)

    const comment = await realTimeCollaborationService.addComment(
      validatedData.sessionId,
      userId,
      validatedData.content,
      validatedData.position,
      validatedData.parentId,
      validatedData.mentions
    )
    
    return NextResponse.json({
      success: true,
      data: comment
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Add comment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add comment'
    }, { status: 500 })
  }
}

async function handleUpdatePresence(userId: string, body: unknown) {
  try {
    const { sessionId, cursor, status = "active" } = body

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    await realTimeCollaborationService.updatePresence(
      sessionId,
      userId,
      cursor,
      status
    )
    
    return NextResponse.json({
      success: true,
      data: { message: "Presence updated successfully" }
    })
  } catch (error) {
    logger.error('Update presence error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update presence'
    }, { status: 500 })
  }
}

async function handleLeaveSession(userId: string, body: unknown) {
  try {
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    await realTimeCollaborationService.leaveSession(sessionId, userId)
    
    return NextResponse.json({
      success: true,
      data: { message: 'Left session successfully' }
    })
  } catch (error) {
    logger.error('Leave session error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to leave session'
    }, { status: 500 })
  }
}

async function handleCreateVersion(userId: string, body: unknown) {
  try {
    const { sessionId, description } = body

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    const version = await realTimeCollaborationService.createVersion(
      sessionId,
      userId,
      description
    )
    
    return NextResponse.json({
      success: true,
      data: version
    })
  } catch (error) {
    logger.error('Create version error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create version'
    }, { status: 500 })
  }
}

// Permission helpers
async function checkManuscriptPermission(
  manuscriptId: string,
  userId: string,
  requiredRoles?: string[]
): Promise<boolean> {
  try {
    // Implementation would check if user has permission to access the manuscript
    // For now, return true for demo purposes
    return true
  } catch (error) {
    logger.error("Manuscript permission check failed", { error, manuscriptId, userId })
    return false
  }
}

async function checkSessionPermission(
  sessionId: string,
  userId: string,
  requiredPermission?: string
): Promise<boolean> {
  try {
    // Implementation would check if user has permission to access the session
    // For now, return true for demo purposes
    return true
  } catch (error) {
    logger.error("Session permission check failed", { error, sessionId, userId })
    return false
  }
}
