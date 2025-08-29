import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userApplications, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || (session.user as unknown).role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    const applicationId = params.id
    const { reason } = await req.json()
    
    // 1. Update the application status in database
    const updateResult = await updateApplicationStatus(applicationId, 'rejected', reason)
    if (!updateResult.success) {
      return NextResponse.json({ message: updateResult.error }, { status: 500 })
    }
    
    // 2. Send rejection email to the applicant with reason
    await sendRejectionEmail(updateResult.application, reason)
    
    // 3. Log the rejection for record keeping
    await logApplicationAction(applicationId, 'rejected', session.user?.email, reason)
    
    logger.info(`Reviewer application ${applicationId} rejected by ${session.user?.email}`)
    
    return NextResponse.json({ 
      success: true, 
      message: "Reviewer application rejected" 
    })
    
  } catch (error) {
    logger.error("Error rejecting reviewer application:", error)
    return NextResponse.json({ 
      message: "Failed to reject application" 
    }, { status: 500 })
  }
}

async function updateApplicationStatus(applicationId: string, status: string, reason?: string) {
  try {
    // Update application status in database
    const [application] = await db.update(userApplications)
      .set({ 
        status: status,
        reviewNotes: reason,
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
        rejectionReason: reason
      }
    }
  } catch (error) {
    logger.error('Error updating application status:', error)
    return { success: false, error: 'Failed to update application status' }
  }
}

async function logApplicationAction(applicationId: string, action: string, adminEmail?: string, notes?: string) {
  try {
    // In a real implementation, this would log to your database
    // For example, with Prisma:
    // await prisma.applicationLog.create({
    //   data: {
    //     applicationId: applicationId,
    //     action: action,
    //     performedBy: adminEmail,
    //     notes: notes,
    //     timestamp: new Date()
    //   }
    // })
    
    logger.error(`Action logged: ${action} on application ${applicationId} by ${adminEmail}`)
    if (notes) logger.error(`Notes: ${notes}`)
  } catch (error) {
    logger.error('Error logging application action:', error)
  }
}

async function sendRejectionEmail(application: unknown, reason?: string) {
  try {
    const emailContent = {
      to: application.email,
      subject: "Reviewer Application Update - AMHSJ",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Reviewer Application Update</h2>
          
          <p>Dear ${application.firstName} ${application.lastName},</p>
          
          <p>Thank you for your interest in becoming a reviewer for the African Medical and Health Sciences Journal.</p>
          
          <p>After careful consideration by our editorial team, we are unable to approve your reviewer application at this time.</p>
          
          ${reason ? `
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <strong>Feedback:</strong><br>
              ${reason}
            </div>
          ` : ''}
          
          <p>This decision does not reflect on your qualifications or expertise. We receive many excellent applications and must balance our reviewer pool across specialties and experience levels.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Future Opportunities:</strong></p>
            <p style="margin: 5px 0 0 0;">You are welcome to reapply in the future as our needs evolve and we expand our reviewer network. Consider addressing any feedback provided and gaining additional experience in peer review.</p>
          </div>
          
          <p>Thank you for your interest in supporting medical research in Africa.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>AMHSJ Editorial Team</strong><br>
            African Medical and Health Sciences Journal
          </p>
        </div>
      `,
      text: `Dear ${application.firstName} ${application.lastName},

Thank you for your interest in becoming a reviewer for the African Medical and Health Sciences Journal.

After careful consideration by our editorial team, we are unable to approve your reviewer application at this time.

${reason ? `Feedback: ${reason}` : ''}

This decision does not reflect on your qualifications or expertise. We receive many excellent applications and must balance our reviewer pool across specialties and experience levels.

You are welcome to reapply in the future as our needs evolve and we expand our reviewer network.

Thank you for your interest in supporting medical research in Africa.

Best regards,
AMHSJ Editorial Team
African Medical and Health Sciences Journal`
    }
    
    await sendEmail(emailContent)
    logger.error('Rejection email sent successfully')
  } catch (error) {
    logger.error('Error sending rejection email:', error)
    // Don't throw error - email failure shouldn't stop the rejection process
  }
}
