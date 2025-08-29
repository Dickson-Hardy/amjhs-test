import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userApplications, users, reviewerProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as unknown).role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    const applicationId = params.id
    
    // 1. Update the application status in database
    const updateResult = await updateApplicationStatus(applicationId, 'approved')
    if (!updateResult.success) {
      return NextResponse.json({ message: updateResult.error }, { status: 500 })
    }
    
    // 2. Update the user's role to 'reviewer'
    const userUpdateResult = await updateUserRole(updateResult.application.userId, 'reviewer')
    if (!userUpdateResult.success) {
      logger.warn('Failed to update user role:', userUpdateResult.error)
    }
    
    // 3. Create reviewer profile
    await createReviewerProfile(updateResult.application)
    
    // 4. Send approval email to the applicant
    await sendApprovalEmail(updateResult.application)
    
    // 5. Log the approval action
    await logApplicationAction(applicationId, 'approved', (session.user as unknown).email)
    
    logger.info(`Reviewer application ${applicationId} approved by ${(session.user as unknown).email}`)
    
    return NextResponse.json({ 
      success: true, 
      message: "Reviewer application approved successfully" 
    })
    
  } catch (error) {
    logger.error("Error approving reviewer application:", error)
    return NextResponse.json({ 
      message: "Failed to approve application" 
    }, { status: 500 })
  }
}

async function updateApplicationStatus(applicationId: string, status: string) {
  try {
    const [application] = await db.update(userApplications)
      .set({ 
        status: status,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userApplications.id, applicationId))
      .returning()

    if (!application) {
      return { success: false, error: 'Application not found' }
    }

    // Get user details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, application.userId))

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { 
      success: true, 
      application: {
        ...application,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join(' '),
        email: user.email,
        userId: user.id
      }
    }
  } catch (error) {
    logger.error('Error updating application status:', error)
    return { success: false, error: 'Failed to update application status' }
  }
}

async function updateUserRole(userId: string, newRole: string) {
  try {
    await db.update(users)
      .set({ 
        role: newRole,
        applicationStatus: 'approved',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    logger.error(`Updated user ${userId} role to ${newRole}`)
    return { success: true }
  } catch (error) {
    logger.error('Error updating user role:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}

async function createReviewerProfile(application: unknown) {
  try {
    const applicationData = application.applicationData || {}
    
    await db.insert(reviewerProfiles).values({
      userId: application.userId,
      availabilityStatus: 'available',
      maxReviewsPerMonth: parseInt(applicationData.reviewFrequency?.split('-')[1] || '3'),
      currentReviewLoad: 0,
      completedReviews: 0,
      lateReviews: 0,
      qualityScore: 0,
      isActive: true,
      updatedAt: new Date()
    })

    logger.error(`Created reviewer profile for user ${application.userId}`)
  } catch (error) {
    logger.error('Error creating reviewer profile:', error)
    throw error
  }
}

async function logApplicationAction(applicationId: string, action: string, adminEmail?: string, notes?: string) {
  try {
    // Create an application log entry
    // For now, we'll log to console. In production, you might want a separate audit log table
    const logEntry = {
      applicationId,
      action,
      performedBy: adminEmail,
      notes,
      timestamp: new Date().toISOString()
    }
    
    logger.error(`Application Action Logged:`, logEntry)
  } catch (error) {
    logger.error('Error logging application action:', error)
  }
}

async function sendApprovalEmail(application: unknown) {
  try {
    const emailContent = {
      to: application.email,
      subject: "Reviewer Application Approved - Welcome to AMHSJ",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to AMHSJ Reviewer Network!</h2>
          
          <p>Dear ${application.firstName} ${application.lastName},</p>
          
          <p>Congratulations! Your application to become a reviewer for the African Medical and Health Sciences Journal has been <strong>approved</strong>.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">What happens next:</h3>
            <ul style="color: #1e40af;">
              <li>You will receive access to our reviewer portal within 24 hours</li>
              <li>Our editorial team will send you reviewer guidelines and best practices</li>
              <li>You'll receive information about our review process and timeline expectations</li>
              <li>Your first review assignment may come within the next few weeks</li>
            </ul>
          </div>
          
          <p>Your commitment to advancing medical science in Africa is greatly appreciated. Together, we can maintain the highest standards of research publication and contribute to improving healthcare outcomes across the continent.</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">Next Steps:</h4>
            <ul style="color: #92400e; margin-bottom: 0;">
              <li>Check your email for reviewer portal access</li>
              <li>Review our submission guidelines at: <a href="${process.env.NEXTAUTH_URL}/reviewer/guidelines">Reviewer Guidelines</a></li>
              <li>Update your profile preferences in the reviewer portal</li>
            </ul>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our editorial office.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>AMHSJ Editorial Team</strong><br>
            African Medical and Health Sciences Journal
          </p>
        </div>
      `
    }
    
    await sendEmail(emailContent)
    logger.error('Approval email sent successfully')
  } catch (error) {
    logger.error('Error sending approval email:', error)
    // Don't throw error - email failure shouldn't stop the approval process
  }
}
