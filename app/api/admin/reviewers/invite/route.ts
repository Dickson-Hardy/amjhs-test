import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, userApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, name, affiliation, expertise } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ 
        success: false, 
        error: "Email and name are required" 
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))

    if (existingUser.length > 0) {
      if (existingUser[0].role === "reviewer") {
        return NextResponse.json({ 
          success: false, 
          error: "User is already a reviewer" 
        }, { status: 400 })
      }
      
      // If user exists but isn't a reviewer, update their role
      await db
        .update(users)
        .set({ 
          role: "reviewer",
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser[0].id))

      // Create reviewer profile
      await db.insert(userApplications).values({
        userId: existingUser[0].id,
        requestedRole: "reviewer",
        currentRole: existingUser[0].role,
        status: "approved",
        applicationData: {
          name,
          affiliation,
          expertise: Array.isArray(expertise) ? expertise : [expertise],
          invitedBy: session.user.email,
          invitedAt: new Date().toISOString()
        },
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        submittedAt: new Date()
      })

      // Send invitation email to existing user
      await sendEmail({
        to: email,
        subject: "You've been invited to be a reviewer",
        html: `
          <h2>Reviewer Invitation</h2>
          <p>Hello ${name},</p>
          <p>You have been invited to join our journal as a reviewer. Your account has been updated with reviewer privileges.</p>
          <p>You can now access the reviewer dashboard and start reviewing manuscripts.</p>
          <p>Best regards,<br>The Editorial Team</p>
        `
      })

      return NextResponse.json({
        success: true,
        message: "Existing user promoted to reviewer and invitation sent"
      })
    }

    // Create new user account
    const newUser = await db.insert(users).values({
      email,
      name,
      role: "reviewer",
      affiliation,
      expertise: Array.isArray(expertise) ? expertise : [expertise],
      isVerified: false,
      isActive: true,
      profileCompleteness: 50
    }).returning()

    if (newUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create user account" 
      }, { status: 500 })
    }

    // Create application record
    await db.insert(userApplications).values({
      userId: newUser[0].id,
      requestedRole: "reviewer",
      currentRole: "author",
      status: "approved",
      applicationData: {
        name,
        affiliation,
        expertise: Array.isArray(expertise) ? expertise : [expertise],
        invitedBy: session.user.email,
        invitedAt: new Date().toISOString()
      },
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      submittedAt: new Date()
    })

    // Send invitation email
    await sendEmail({
      to: email,
      subject: "You've been invited to be a reviewer",
      html: `
        <h2>Reviewer Invitation</h2>
        <p>Hello ${name},</p>
        <p>You have been invited to join our journal as a reviewer. A new account has been created for you.</p>
        <p>Please complete your profile and start reviewing manuscripts.</p>
        <p>Best regards,<br>The Editorial Team</p>
      `
    })

    return NextResponse.json({
      success: true,
      message: "Reviewer invitation sent successfully",
      user: newUser[0]
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/reviewers/invite" })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to send reviewer invitation" 
    }, { status: 500 })
  }
}
