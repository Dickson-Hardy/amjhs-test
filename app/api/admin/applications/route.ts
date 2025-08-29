import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  userApplications, 
  users, 
  userQualifications, 
  userPublications, 
  userReferences,
  reviewerProfiles,
  editorProfiles
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"

// GET - Fetch applications for admin/editor review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const role = searchParams.get("role")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Build query conditions
    let whereConditions = eq(userApplications.status, status)
    if (role) {
      whereConditions = and(
        eq(userApplications.status, status),
        eq(userApplications.requestedRole, role)
      )!
    }

    // Select only existing columns to avoid current_role issue
    const applications = await db
      .select({
        application: {
          id: userApplications.id,
          userId: userApplications.userId,
          requestedRole: userApplications.requestedRole,
          status: userApplications.status,
          applicationData: userApplications.applicationData,
          reviewNotes: userApplications.reviewNotes,
          reviewedBy: userApplications.reviewedBy,
          reviewedAt: userApplications.reviewedAt,
          submittedAt: userApplications.submittedAt,
          updatedAt: userApplications.updatedAt,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          affiliation: users.affiliation,
          orcid: users.orcid,
          bio: users.bio,
          profileCompleteness: users.profileCompleteness,
        }
      })
      .from(userApplications)
      .innerJoin(users, eq(userApplications.userId, users.id))
      .where(whereConditions)
      .orderBy(desc(userApplications.submittedAt))
      .limit(limit)
      .offset(offset)

    // Get additional data for each application
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const [qualifications, publications, references] = await Promise.all([
          db.select().from(userQualifications).where(eq(userQualifications.userId, app.user.id)),
          db.select().from(userPublications).where(eq(userPublications.userId, app.user.id)),
          db.select().from(userReferences).where(eq(userReferences.userId, app.user.id))
        ])

        return {
          ...app,
          qualifications,
          publications,
          references
        }
      })
    )

    return NextResponse.json({
      applications: enrichedApplications,
      pagination: {
        page,
        limit,
        hasMore: applications.length === limit
      }
    })

  } catch (error) {
    logger.error("Error fetching applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Approve or reject application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { applicationId, action, reviewNotes } = await request.json()

    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Get the application - select only existing columns
    const [application] = await db
      .select({
        id: userApplications.id,
        userId: userApplications.userId,
        requestedRole: userApplications.requestedRole,
        status: userApplications.status,
        applicationData: userApplications.applicationData,
        reviewNotes: userApplications.reviewNotes,
        reviewedBy: userApplications.reviewedBy,
        reviewedAt: userApplications.reviewedAt,
        submittedAt: userApplications.submittedAt,
        updatedAt: userApplications.updatedAt,
      })
      .from(userApplications)
      .where(eq(userApplications.id, applicationId))
      .limit(1)

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, application.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update application status
    await db
      .update(userApplications)
      .set({
        status: newStatus,
        reviewNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userApplications.id, applicationId))

    if (action === "approve") {
      // Update user role and status
      await db
        .update(users)
        .set({
          role: application.requestedRole,
          applicationStatus: "approved",
          updatedAt: new Date(),
        })
        .where(eq(users.id, application.userId))

      // Create role-specific profile if needed
      if (application.requestedRole === "reviewer") {
        // Check if reviewer profile already exists
        const existingProfile = await db
          .select()
          .from(reviewerProfiles)
          .where(eq(reviewerProfiles.userId, application.userId))
          .limit(1)

        if (existingProfile.length === 0) {
          await db.insert(reviewerProfiles).values({
            userId: application.userId,
            availabilityStatus: "available",
            maxReviewsPerMonth: 3,
            isActive: true,
          })
        }
      }

      if (application.requestedRole === "editor") {
        // Check if editor profile already exists
        const existingProfile = await db
          .select()
          .from(editorProfiles)
          .where(eq(editorProfiles.userId, application.userId))
          .limit(1)

        if (existingProfile.length === 0) {
          const applicationData = application.applicationData as unknown
          await db.insert(editorProfiles).values({
            userId: application.userId,
            editorType: applicationData?.editorType || "associate",
            assignedSections: applicationData?.preferredSections || [],
            editorialExperience: applicationData?.editorialExperience || "",
            maxWorkload: applicationData?.maxWorkload || 10,
            isActive: true,
          })
        }
      }

      // Send approval email
      await sendApplicationApprovalEmail(user.email, user.name, application.requestedRole)
    } else {
      // Send rejection email
      await sendApplicationRejectionEmail(user.email, user.name, application.requestedRole, reviewNotes)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Application ${action}d successfully` 
    })

  } catch (error) {
    logger.error("Error processing application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendApplicationApprovalEmail(email: string, name: string, role: string) {
  const subject = `Your ${role} application has been approved`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Congratulations, ${name}!</h2>
      <p>We're excited to inform you that your application to become a <strong>${role}</strong> has been approved.</p>
      <p>You can now access your ${role} dashboard and start contributing to our journal.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Access Your Dashboard
        </a>
      </p>
      <p>Thank you for joining our editorial team!</p>
    </div>
  `
  
  await sendEmail({
    to: email,
    subject,
    html
  })
}

async function sendApplicationRejectionEmail(email: string, name: string, role: string, reason?: string) {
  const subject = `Update on your ${role} application`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DC2626;">Application Update</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your interest in becoming a <strong>${role}</strong> with our journal.</p>
      <p>After careful review, we have decided not to move forward with your application at this time.</p>
      ${reason ? `<p><strong>Review Notes:</strong> ${reason}</p>` : ''}
      <p>We encourage you to continue contributing as an author and consider reapplying in the future.</p>
      <p>Thank you for your understanding.</p>
    </div>
  `
  
  await sendEmail({
    to: email,
    subject,
    html
  })
}
