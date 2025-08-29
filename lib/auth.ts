import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAuth, logError } from "./logger"
import { AppError, ValidationError } from "./error-utils"

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Get user from database - only select the columns we need
          const [user] = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              password: users.password,
              role: users.role,
              isVerified: users.isVerified,
              isActive: users.isActive,
            })
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)
          if (!passwordMatch) {
            return null
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          logError(error as Error, { context: 'authentication' })
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Handle token updates and user role changes
      if (user) {
        token.role = user.role
        token.lastUpdated = Date.now()
      }
      
      // Force refresh user data from database if triggered
      if (trigger === "update" && token.sub) {
        try {
          const dbUser = await UserService.getUserById(token.sub)
          if (dbUser) {
            token.role = dbUser.role
            token.lastUpdated = Date.now()
            logAuth(`process.env.AUTH_TOKEN_PREFIXrefreshed for user ${token.sub}`, token.sub, 'token_refresh')
          }
        } catch (error) {
          logError(error as Error, { context: 'token_refresh' })
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        
        // Debug logging
        logAuth(`Session created for ${session.user.email}`, session.user.id, 'session_create')
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If it's a relative URL or from the same origin, allow it
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      
      // Default redirect to homepage
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/login"
  }
}

import { sendEmailVerification } from "./email-hybrid"
import { UserService } from "./database"

// Real implementation of email verification using our email service
async function sendVerificationEmail(email: string, verificationToken: string) {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`
    const user = await UserService.getUserByEmail(email)
    const userName = user?.name || email.split('@')[0] // Use actual name or fallback
    
    await sendEmailVerification(email, userName, verificationUrl)
    logAuth(`Verification email sent to ${email}`, undefined, 'email_verification_sent')
  } catch (error) {
    logError(error as Error, { context: 'send_verification_email' })
    throw new AppError("Failed to send verification email")
  }
}

export async function signup(email: string, password: string, name: string) {
  try {
    // Validate input
    if (!email || !password || !name) {
      throw new AppError("Please provide an email, password, and name.")
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address.")
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long.")
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      throw new AppError("Email already in use.")
    }

    // Production password hashing with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in database
    const user = await createUser(email, hashedPassword, name.trim())
    if (!user) {
      throw new AppError("Failed to create user.")
    }

    // Generate verification token
    const verificationToken = uuidv4()

    // Store verification token in database
    await saveVerificationToken(user.id, verificationToken)

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken)

    return { success: true, message: "User created. Please verify your email." }
  } catch (error: unknown) {
    logError(error as Error, { context: 'signup' })
    return { success: false, message: (error as Error).message || "Signup failed." }
  }
}

export async function login(email: string, password: string) {
  try {
    // Validate input
    if (!email || !password) {
      throw new AppError("Please provide an email and password.")
    }

    // Check if user exists (replace with your database query)
    const user = await getUserByEmail(email) // Replace with your actual database query
    if (!user) {
      throw new ValidationError("Invalid credentials.")
    }

    // Compare passwords (replace with your password comparison logic)
    const passwordMatch = await bcrypt.compare(password, user.password) // Replace with your actual password comparison logic
    if (!passwordMatch) {
      throw new ValidationError("Invalid credentials.")
    }

    // Production JWT token generation
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" })

    return { success: true, token }
  } catch (error: unknown) {
    logError(error as Error, { context: 'login' })
    return { success: false, message: (error as Error).message || "Login failed." }
  }
}

// Email verification endpoint function
export async function verifyEmail(email: string, token: string) {
  try {
    const success = await UserService.verifyUser(email, token)
    
    if (!success) {
      return { success: false, message: "Invalid or expired verification token." }
    }

    return { success: true, message: "Email verified successfully!" }
  } catch (error: unknown) {
    logError(error as Error, { context: 'email_verification' })
    return { success: false, message: "Email verification failed." }
  }
}

// Password reset request function
export async function requestPasswordReset(email: string) {
  try {
    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: "If an account with that email exists, a password reset link has been sent." }
    }
    // Generate reset token
    const resetToken = uuidv4()
    // Save reset token to database
    const success = await UserService.savePasswordResetToken(email, resetToken)
    if (!success) {
      throw new AppError("Failed to save reset token")
    }
    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
    const { sendPasswordReset } = await import("./email-hybrid")
    await sendPasswordReset(email, user.name ? user.name : email.split('@')[0], resetUrl)
    return { success: true, message: "If an account with that email exists, a password reset link has been sent." }
  } catch (error: unknown) {
    logError(error as Error, { context: 'password_reset_request' })
    return { success: false, message: "Password reset request failed." }
  }
}

// Password reset function
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Validate password strength
    if (newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters long.")
    }

    const success = await UserService.resetPassword(token, newPassword)
    
    if (!success) {
      return { success: false, message: "Invalid or expired reset token." }
    }

    return { success: true, message: "Password reset successfully!" }
  } catch (error: unknown) {
    logError(error as Error, { context: 'password_reset' })
    return { success: false, message: (error as Error).message || "Password reset failed." }
  }
}

// User profile update function
export async function updateProfile(
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
) {
  try {
    const success = await UserService.updateUserProfile(userId, updates)
    
    if (!success) {
      return { success: false, message: "Failed to update profile." }
    }

    // Update last active
    await UserService.updateLastActive(userId)

    return { success: true, message: "Profile updated successfully!" }
  } catch (error: unknown) {
    logError(error as Error, { context: 'profile_update' })
    return { success: false, message: "Profile update failed." }
  }
}

// Get user profile function
export async function getUserProfile(userId: string) {
  try {
    const user = await UserService.getUserById(userId)
    
    if (!user) {
      return { success: false, message: "User not found." }
    }

    const stats = await UserService.getUserStats(userId)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        affiliation: user.affiliation,
        orcid: user.orcid,
        bio: user.bio,
        expertise: user.expertise,
        createdAt: user.createdAt,
        stats,
      }
    }
  } catch (error: unknown) {
    logError(error as Error, { context: 'get_user_profile' })
    return { success: false, message: "Failed to get user profile." }
  }
}

// Real database functions using our UserService
async function getUserByEmail(
  email: string,
): Promise<{ id: string; email: string; password: string; verified: boolean; name: string } | null> {
  try {
    const user = await UserService.getUserByEmail(email)
    if (!user || !user.password) {
      return null
    }
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      verified: user.verified,
      name: user.name,
    }
  } catch (error) {
    logError(error as Error, { context: 'get_user_by_email' })
    return null
  }
}

async function createUser(email: string, hashedPassword: string, name: string): Promise<{ id: string; email: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await UserService.userExists(email)
    if (existingUser) {
      throw new AppError("User already exists")
    }

    const user = await UserService.createUser(email, hashedPassword, name)
    if (!user) {
      throw new AppError("Failed to create user")
    }

    return { id: user.id, email: user.email }
  } catch (error) {
    logError(error as Error, { context: 'create_user' })
    throw error
  }
}

async function saveVerificationToken(userId: string, token: string): Promise<void> {
  try {
    const success = await UserService.saveVerificationToken(userId, token)
    if (!success) {
      throw new AppError("Failed to save verification token")
    }
  } catch (error) {
    logError(error as Error, { context: 'save_verification_token' })
    throw error
  }
}

import { getServerSession } from "next-auth/next"
// Added default export for authOptions to support default import
export async function auth() {
  return getServerSession(authOptions);
}
export default authOptions;
