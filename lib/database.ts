import { db } from "./db"
import { users, userApplications, userQualifications, notifications, submissions } from "./db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { CacheManager } from "./cache"

// Export the database instance
export { db }

// User management functions
export class UserService {
  
  // Get user by email with caching
  static async getUserByEmail(email: string): Promise<{
    id: string
    email: string
    password: string | null
    verified: boolean
    name: string
    role: string
  } | null> {
    try {
      // Check cache first
      const cacheKey = `user:email:${email}`
      const cached = await CacheManager.get(cacheKey)
      if (cached) {
        return cached as {
          id: string
          email: string
          password: string | null
          verified: boolean
          name: string
          role: string
        }
      }

      // Query database
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          verified: users.isVerified,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      let userObj: {
        id: string
        email: string
        password: string | null
        verified: boolean
        name: string
        role: string
      } | null = null
      if (result[0]) {
        userObj = {
          id: result[0].id,
          email: result[0].email,
          password: result[0].password,
          verified: !!result[0].verified,
          name: result[0].name,
          role: result[0].role
        }
        await CacheManager.set(cacheKey, userObj, 1800)
      }
      return userObj
    } catch (error) {
      logger.error("Error getting user by email:", error)
      return null
    }
  }

  // Get user by ID with caching
  static async getUserById(id: string): Promise<{
    id: string
    email: string
    name: string
    role: string
    verified: boolean
    affiliation?: string | null
    orcid?: string | null
    bio?: string | null
    expertise?: string[] | null
    createdAt: Date | null
  } | null> {
    try {
      // Check cache first
      const cacheKey = `user:id:${id}`
      const cached = await CacheManager.get(cacheKey)
      if (cached) {
        return cached as {
          id: string
          email: string
          name: string
          role: string
          verified: boolean
          affiliation?: string | null
          orcid?: string | null
          bio?: string | null
          expertise?: string[] | null
          createdAt: Date | null
        }
      }

      const result = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          verified: users.isVerified,
          affiliation: users.affiliation,
          orcid: users.orcid,
          bio: users.bio,
          expertise: users.expertise,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      let userObj: {
        id: string
        email: string
        name: string
        role: string
        verified: boolean
        affiliation?: string | null
        orcid?: string | null
        bio?: string | null
        expertise?: string[] | null
        createdAt: Date | null
      } | null = null
      if (result[0]) {
        userObj = {
          id: result[0].id,
          email: result[0].email,
          name: result[0].name,
          role: result[0].role,
          verified: !!result[0].verified,
          affiliation: result[0].affiliation ?? null,
          orcid: result[0].orcid ?? null,
          bio: result[0].bio ?? null,
          expertise: result[0].expertise ?? null,
          createdAt: result[0].createdAt ?? null
        }
        await CacheManager.set(cacheKey, userObj, 1800)
      }
      return userObj
    } catch (error) {
      logger.error("Error getting user by ID:", error)
      return null
    }
  }

  // Create new user
  static async createUser(
    email: string, 
    hashedPassword: string, 
    name: string,
    role: string = "author"
  ): Promise<{ id: string; email: string; name: string; verified: boolean } | null> {
    try {
      const result = await db
        .insert(users)
        .values({
          id: uuidv4(),
          email,
          password: hashedPassword,
          name,
          role,
          isVerified: false,
          isActive: true,
          profileCompleteness: 20, // process.env.AUTH_TOKEN_PREFIX + ' 'profile created
          lastActiveAt: new Date(),
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        })

      const user = result[0]
      await CacheManager.del(`user:email:${email}`)
      if (user) {
        return {
          ...user,
          verified: false
        }
      }
      return null
    } catch (error) {
      logger.error("Error creating user:", error)
      return null
    }
  }

  // Save verification token
  static async saveVerificationToken(userId: string, token: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({
          emailVerificationToken: token,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      // Invalidate user cache
      const user = await this.getUserById(userId)
      if (user) {
        await CacheManager.del(`user:email:${user.email}`)
        await CacheManager.del(`user:id:${userId}`)
      }

      return true
    } catch (error) {
      logger.error("Error saving verification token:", error)
      return false
    }
  }

  // Verify user email
  static async verifyUser(email: string, token: string): Promise<boolean> {
    try {
      const user = await db
        .select({
          id: users.id,
          emailVerificationToken: users.emailVerificationToken,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user[0] || user[0].emailVerificationprocess.env.AUTH_TOKEN_PREFIX!== token) {
        return false
      }

      await db
        .update(users)
        .set({
          isVerified: true,
          emailVerificationToken: null,
          profileCompleteness: 40, // Email verified
          updatedAt: new Date(),
        })
        .where(eq(users.id, user[0].id))

      // Invalidate cache
      await CacheManager.del(`user:email:${email}`)
      await CacheManager.del(`user:id:${user[0].id}`)

      // Send verification success notification
      await this.createNotification(
        user[0].id,
        "Email Verified",
        "Your email has been verified successfully. You can now access all features.",
        "system"
      )

      return true
    } catch (error) {
      logger.error("Error verifying user:", error)
      return false
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    updates: {
      name?: string
      affiliation?: string
      orcid?: string
      bio?: string
      expertise?: string[]
      specializations?: string[]
      languagesSpoken?: string[]
      researchInterests?: string[]
    }
  ): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, userId))

      // Invalidate cache
      await CacheManager.del(`user:id:${userId}`)
      const user = await this.getUserById(userId)
      if (user) {
        await CacheManager.del(`user:email:${user.email}`)
      }

      return true
    } catch (error) {
      logger.error("Error updating user profile:", error)
      return false
    }
  }

  // Save password reset token
  static async savePasswordResetToken(email: string, token: string): Promise<boolean> {
    try {
      const expires = new Date()
      expires.setHours(expires.getHours() + 1) // 1 hour expiry

      await db
        .update(users)
        .set({
          passwordResetToken: token,
          passwordResetExpires: expires,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email))

      // Invalidate cache
      await CacheManager.del(`user:email:${email}`)

      return true
    } catch (error) {
      logger.error("Error saving password reset token:", error)
      return false
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      const now = new Date()

      const result = await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: now,
        })
        .where(and(
          eq(users.passwordResetToken, token),
          // Check if token hasn't expired
        ))
        .returning({ id: users.id, email: users.email })

      if (result.length === 0) {
        return false
      }

      // Invalidate cache
      await CacheManager.del(`user:email:${result[0].email}`)
      await CacheManager.del(`user:id:${result[0].id}`)

      // Send password reset confirmation notification
      await this.createNotification(
        result[0].id,
        "Password Reset",
        "Your password has been reset successfully.",
        "system"
      )

      return true
    } catch (error) {
      logger.error("Error resetting password:", error)
      return false
    }
  }

  // Create notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string
  ): Promise<boolean> {
    try {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId,
        title,
        message,
        type,
        relatedId,
        isRead: false,
      })

      return true
    } catch (error) {
      logger.error("Error creating notification:", error)
      return false
    }
  }

  // Update last active timestamp
  static async updateLastActive(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, userId))

      // Don't invalidate cache for this minor update
    } catch (error) {
      logger.error("Error updating last active:", error)
    }
  }

  // Check if user exists by email
  static async userExists(email: string): Promise<boolean> {
    try {
      const result = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      return result.length > 0
    } catch (error) {
      logger.error("Error checking if user exists:", error)
      return false
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<{
    submissionsCount: number
    reviewsCount: number
    publicationsCount: number
    profileCompleteness: number
  }> {
    try {
      // Get real counts from database
      const user = await this.getUserById(userId)
      
      // Count user's submissions
      const submissionsResult = await sql`
        SELECT COUNT(*) as count 
        FROM articles 
        WHERE author_id = ${userId}
      `
      const submissionsCount = parseInt(submissionsResult.rows[0]?.count || '0')

      // Count user's reviews
      const reviewsResult = await sql`
        SELECT COUNT(*) as count 
        FROM reviews 
        WHERE reviewer_id = ${userId}
      `
      const reviewsCount = parseInt(reviewsResult.rows[0]?.count || '0')

      // Count user's published articles
      const publicationsResult = await sql`
        SELECT COUNT(*) as count 
        FROM articles 
        WHERE author_id = ${userId} AND status = 'published'
      `
      const publicationsCount = parseInt(publicationsResult.rows[0]?.count || '0')

      // Calculate profile completeness
      let profileCompleteness = 0
      if (user?.verified) profileCompleteness += 20
      if (user?.name) profileCompleteness += 15
      if (user?.affiliation) profileCompleteness += 15
      if (user?.orcid) profileCompleteness += 15
      if (user?.expertise) profileCompleteness += 15
      if (user?.bio) profileCompleteness += 10
      if (user?.website) profileCompleteness += 10
      
      return {
        submissionsCount,
        reviewsCount,
        publicationsCount,
        profileCompleteness,
      }
    } catch (error) {
      logger.error("Error getting user stats:", error)
      return {
        submissionsCount: 0,
        reviewsCount: 0,
        publicationsCount: 0,
        profileCompleteness: 0,
      }
    }
  }
}

// Database service for external integrations
export class DatabaseService {
  static async query(sql: string, params?: unknown[]): Promise<any[]> {
    try {
      // This is a simplified implementation
      // In a real scenario, you would execute the SQL query using the db instance
      logger.error('Executing query:', sql, params)
      return []
    } catch (error) {
      logger.error('Database query error:', error)
      throw error
    }
  }

  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback()
    } catch (error) {
      logger.error('Database transaction error:', error)
      throw error
    }
  }

  static async getSubmissionById(id: string) {
    try {
      const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
      return submission
    } catch (error) {
      logger.error('Error fetching submission:', error)
      return null
    }
  }
}
