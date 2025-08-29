/**
 * Standardized API Utilities for Consistent Response Handling
 * This module provides unified patterns for authentication, validation, and response formatting
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { z } from "zod"

// Standard API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
  requestId?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
  }
}

// Standard Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Authentication Error
export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_REQUIRED")
  }
}

// Authorization Error
export class AuthorizationError extends ApiError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "INSUFFICIENT_PERMISSIONS")
  }
}

// Validation Error
export class ValidationError extends ApiError {
  constructor(message: string = "Validation failed", public details?: unknown) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

// Not Found Error
export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND")
  }
}

/**
 * Standardized authentication wrapper
 * Usage: const session = await requireAuth(request, ['admin', 'editor'])
 */
export async function requireAuth(
  request?: NextRequest,
  allowedRoles?: string[]
): Promise<{
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new AuthenticationError()
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`
    )
  }

  return session
}

/**
 * Standardized response creator
 */
export function createApiResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
    ...(requestId && { requestId })
  }
  
  return NextResponse.json(response)
}

/**
 * Standardized error response creator
 */
export function createErrorResponse(
  error: ApiError | Error | string,
  requestId?: string
): NextResponse<ApiResponse> {
  let statusCode = 500
  let message = "Internal server error"
  let code: string | undefined

  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === "string") {
    message = error
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
    ...(requestId && { requestId })
  }

  // Log error for monitoring
  logger.error("API Error", {
    message,
    statusCode,
    code,
    requestId,
    stack: error instanceof Error ? error.stack : undefined
  })

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Standardized pagination response creator
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  message?: string,
  requestId?: string
): NextResponse<PaginatedResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const hasMore = pagination.page < totalPages

  const response: PaginatedResponse<T[]> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasMore
    },
    timestamp: new Date().toISOString(),
    ...(message && { message }),
    ...(requestId && { requestId })
  }

  return NextResponse.json(response)
}

/**
 * Standardized validation middleware
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new ValidationError(
        "Request validation failed",
        details
      )
    }
    throw new ValidationError("Invalid request format")
  }
}

/**
 * Standardized query parameter parser
 */
export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  return {
    page: Number(searchParams.get("page")) || 1,
    limit: Math.min(Number(searchParams.get("limit")) || 20, 100),
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
    filter: searchParams.get("filter") || undefined
  }
}

/**
 * Standardized error handler wrapper for API routes
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()
    
    try {
      return await handler(request, context)
    } catch (error) {
      return createErrorResponse(error as Error, requestId)
    }
  }
}

/**
 * Role-based access control helper
 */
export const ROLES = {
  ADMIN: "admin",
  EDITOR_IN_CHIEF: "editor-in-chief", 
  MANAGING_EDITOR: "managing-editor",
  SECTION_EDITOR: "section-editor",
  GUEST_EDITOR: "guest-editor",
  PRODUCTION_EDITOR: "production-editor",
  ASSOCIATE_EDITOR: "editor",
  REVIEWER: "reviewer",
  AUTHOR: "author"
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.ADMIN]: [
    ROLES.ADMIN,
    ROLES.EDITOR_IN_CHIEF,
    ROLES.MANAGING_EDITOR,
    ROLES.SECTION_EDITOR,
    ROLES.GUEST_EDITOR,
    ROLES.PRODUCTION_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.EDITOR_IN_CHIEF]: [
    ROLES.EDITOR_IN_CHIEF,
    ROLES.MANAGING_EDITOR,
    ROLES.SECTION_EDITOR,
    ROLES.GUEST_EDITOR,
    ROLES.PRODUCTION_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.MANAGING_EDITOR]: [
    ROLES.MANAGING_EDITOR,
    ROLES.SECTION_EDITOR,
    ROLES.GUEST_EDITOR,
    ROLES.PRODUCTION_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.SECTION_EDITOR]: [
    ROLES.SECTION_EDITOR,
    ROLES.GUEST_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.GUEST_EDITOR]: [
    ROLES.GUEST_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.PRODUCTION_EDITOR]: [
    ROLES.PRODUCTION_EDITOR,
    ROLES.AUTHOR
  ],
  [ROLES.ASSOCIATE_EDITOR]: [
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.REVIEWER]: [
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ],
  [ROLES.AUTHOR]: [
    ROLES.AUTHOR
  ]
}

/**
 * Check if user has required permission based on role hierarchy
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userRolePermissions = ROLE_HIERARCHY[userRole as Role]
  return userRolePermissions?.includes(requiredRole as Role) || false
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: unknown): never {
  logger.error("Database error", { error: error.message, stack: error.stack })
  
  // Handle specific database errors
  if (error.code === "23505") { // Unique violation
    throw new ValidationError("Resource already exists")
  }
  
  if (error.code === "23503") { // Foreign key violation
    throw new ValidationError("Invalid reference to related resource")
  }
  
  if (error.code === "23502") { // Not null violation
    throw new ValidationError("Required field is missing")
  }
  
  throw new ApiError("Database operation failed")
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  }),
  
  search: z.object({
    search: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("desc")
  }),
  
  id: z.object({
    id: z.string().uuid("Invalid ID format")
  }),
  
  email: z.string().email("Invalid email format"),
  
  role: z.enum([
    ROLES.ADMIN,
    ROLES.EDITOR_IN_CHIEF,
    ROLES.MANAGING_EDITOR,
    ROLES.SECTION_EDITOR,
    ROLES.GUEST_EDITOR,
    ROLES.PRODUCTION_EDITOR,
    ROLES.ASSOCIATE_EDITOR,
    ROLES.REVIEWER,
    ROLES.AUTHOR
  ])
}