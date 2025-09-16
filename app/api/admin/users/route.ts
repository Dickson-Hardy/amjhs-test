import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { z } from "zod"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { 
  createApiResponse, 
  createErrorResponse, 
  parseQueryParams,
  createPaginatedResponse,
  withErrorHandler,
  handleDatabaseError
} from "@/lib/api-utils"
import { db } from "@/lib/db"
import { users, submissions, reviews } from "@/lib/db/schema"
import { desc, ilike, eq, count, sql, and } from "drizzle-orm"
import { logger } from "@/lib/logger"

// Validation schema for query parameters
const adminUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  search: z.string().optional(),
  role: z.enum(['all', 'admin', 'associate_editor', 'reviewer', 'author']).optional().default('all')
})

async function getUsers(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    // Authenticate and authorize
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.info("Admin users request initiated", {
      userId: session.user.id,
      userRole: session.user.role,
      requestId,
      endpoint: "/api/admin/users"
    })

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = adminUsersQuerySchema.parse(Object.fromEntries(searchParams))
    
    const { page, limit, search, role } = queryData
    const offset = (page - 1) * limit

    // Build query conditions
    const conditions = []
    
    if (search) {
      conditions.push(ilike(users.name, `%${search}%`))
    }

    if (role && role !== "all") {
      conditions.push(eq(users.role, role))
    }

    // Get users with pagination
    const userList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastActiveAt
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    
    const totalUsers = totalCountResult[0]?.count || 0

    // Get stats for all users
    const stats = {
      totalUsers,
      activeUsers: userList.filter(u => u.isActive === true).length,
      pendingUsers: userList.filter(u => u.isVerified === false).length,
      adminUsers: userList.filter(u => u.role === ROLES.ADMIN).length,
      editorUsers: userList.filter(u => u.role === ROLES.ASSOCIATE_EDITOR).length,
      reviewerUsers: userList.filter(u => u.role === ROLES.REVIEWER).length,
      authorUsers: userList.filter(u => u.role === ROLES.AUTHOR).length
    }

    // Get submission and review counts for each user
    const usersWithCounts = await Promise.all(
      userList.map(async (user) => {
        try {
          const [submissionCount, reviewCount] = await Promise.all([
            db.select({ count: count() })
              .from(submissions)
              .where(sql`${submissions.authorId} = ${user.id}`),
            db.select({ count: count() })
              .from(reviews)
              .where(sql`${reviews.reviewerId} = ${user.id}`)
          ])

          return {
            ...user,
            submissionsCount: submissionCount[0]?.count || 0,
            reviewsCount: reviewCount[0]?.count || 0,
            joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'Unknown',
            lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'Never'
          }
        } catch (error) {
          logger.error("Failed to get user counts", {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
            requestId
          })
          
          return {
            ...user,
            submissionsCount: 0,
            reviewsCount: 0,
            joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'Unknown',
            lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'Never'
          }
        }
      })
    )

    logger.info("Admin users request completed", {
      userId: session.user.id,
      userCount: usersWithCounts.length,
      totalUsers,
      requestId
    })

    return createPaginatedResponse(
      usersWithCounts,
      { page, limit, total: totalUsers },
      "Users retrieved successfully",
      requestId
    )

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error("Invalid query parameters", {
        error: (error as any).errors,
        requestId
      })
      return createErrorResponse(
        "Invalid query parameters",
        requestId
      )
    }
    
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      throw error
    }
    
    return handleDatabaseError(error as Error)
  }
}

export const GET = withErrorHandler(getUsers)

// Validation schema for user updates
const userUpdateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(['admin', 'associate_editor', 'reviewer', 'author']).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional()
})

async function updateUser(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    // Authenticate and authorize
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.info("Admin user update request initiated", {
      userId: session.user.id,
      userRole: session.user.role,
      requestId,
      endpoint: "/api/admin/users PATCH"
    })

    const body = await request.json()
    const updateData = userUpdateSchema.parse(body)
    
    const { userId, role, isActive, isVerified } = updateData

    // Prevent self-deactivation or role change
    if (userId === session.user.id) {
      if (isActive === false) {
        return createErrorResponse(
          "Cannot deactivate your own account",
          requestId
        )
      }
      if (role && role !== session.user.role) {
        return createErrorResponse(
          "Cannot change your own role",
          requestId
        )
      }
    }

    // Build update object
    const updateFields: any = {}
    if (role !== undefined) updateFields.role = role
    if (isActive !== undefined) updateFields.isActive = isActive
    if (isVerified !== undefined) updateFields.isVerified = isVerified
    updateFields.updatedAt = new Date()

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isVerified: users.isVerified,
        updatedAt: users.updatedAt
      })

    if (!updatedUser) {
      return createErrorResponse(
        "User not found",
        requestId
      )
    }

    logger.info("User updated successfully", {
      adminId: session.user.id,
      updatedUserId: userId,
      changes: updateFields,
      requestId
    })

    return createApiResponse(
      updatedUser,
      "User updated successfully",
      requestId
    )

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error("Invalid user update data", {
        error: (error as any).errors,
        requestId
      })
      return createErrorResponse(
        "Invalid user update data",
        requestId
      )
    }
    
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      throw error
    }
    
    return handleDatabaseError(error as Error)
  }
}

export const PATCH = withErrorHandler(updateUser)

// Validation schema for user creation
const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(['admin', 'associate_editor', 'editor', 'reviewer', 'author']).default('author'),
  password: z.string().min(6, "Password must be at least 6 characters")
})

async function createUser(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    // Authenticate and authorize
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.info("Admin user creation request initiated", {
      userId: session.user.id,
      userRole: session.user.role,
      requestId,
      endpoint: "/api/admin/users POST"
    })

    const body = await request.json()
    const userData = userCreateSchema.parse(body)
    
    const { name, email, role, password } = userData

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return createErrorResponse(
        "User with this email already exists",
        requestId
      )
    }

    // Hash password (you'll need to implement password hashing)
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        role,
        password: hashedPassword,
        isActive: true,
        isVerified: true, // Admin-created users are auto-verified
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt
      })

    logger.info("User created successfully", {
      adminId: session.user.id,
      newUserId: newUser.id,
      newUserEmail: email,
      newUserRole: role,
      requestId
    })

    return createApiResponse(
      newUser,
      "User created successfully",
      requestId
    )

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error("Invalid user creation data", {
        error: (error as any).errors,
        requestId
      })
      return createErrorResponse(
        "Invalid user creation data",
        requestId
      )
    }
    
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      throw error
    }
    
    return handleDatabaseError(error as Error)
  }
}

export const POST = withErrorHandler(createUser)
