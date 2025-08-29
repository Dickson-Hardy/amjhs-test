import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid verification token" }, { status: 400 })
    }

    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1)

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 })
    }

    await db
      .update(users)
      .set({
        isVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    logInfo("Email verified", { userId: user.id, email: user.email })

    return NextResponse.redirect(new URL("/auth/verified", request.url))
  } catch (error) {
    logError(error as Error, { endpoint: "/api/auth/verify-email" })
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
