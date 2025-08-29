import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendPasswordReset } from "@/lib/email-hybrid"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()

    if (token && newPassword) {
      // Reset password with token
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.passwordResetToken, token), gt(users.passwordResetExpires, new Date())))
        .limit(1)

      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      logInfo("Password reset completed", { userId: user.id })

      return NextResponse.json({ success: true, message: "Password reset successfully" })
    } else if (email) {
      // Send reset email
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json({ success: true, message: "If email exists, reset link sent" })
      }

      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetExpires = new Date(Date.now() + 3600000) // 1 hour

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

      await sendEmail({
        to: user.email,
        subject: "AMHSJ - Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Password Reset - AMHSJ</h2>
            <p>Dear ${user.name},</p>
            <p>You requested a password reset for your AMHSJ account. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
            <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>AMHSJ Team</p>
          </div>
        `,
      })

      return NextResponse.json({ success: true, message: "If email exists, reset link sent" })
    }

    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/auth/reset-password" })
    return NextResponse.json({ success: false, error: "Reset failed" }, { status: 500 })
  }
}
