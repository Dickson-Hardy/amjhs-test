import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userApplications, reviewerApplications, notifications } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email-hybrid"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    const formData = await req.json()
    
    // Save the application to database
    const application = await saveReviewerApplication(session.user.email || '', formData)
    
    // Create notification record for admin dashboard
    await createAdminNotification(application)
    
    // Log the application submission
    await logApplicationSubmission(application)
    
    // Send email notifications to editorial team
    await sendNotificationToEditorialTeam(application)
    
    return NextResponse.json({ 
      success: true, 
      message: "Application submitted successfully",
      applicationId: application.id 
    })
    
  } catch (error) {
    logger.error("Error submitting reviewer application:", error)
    return NextResponse.json({ 
      message: "Failed to submit application" 
    }, { status: 500 })
  }
}

async function sendNotificationToEditorialTeam(application: unknown) {
  // This function would send emails to:
  // 1. All users with 'admin' role
  // 2. All users with 'editor' role
  // 3. Designated editorial coordinators
  
  const recipients = [
    // These would come from your database
    'editor@journal.com',
    'process.env.EMAIL_FROMjournal.com',
    'editorial.coordinator@journal.com'
  ]
  
  const emailContent = {
    subject: `New Reviewer Application - ${application.firstName} ${application.lastName}`,
    body: `
      A new reviewer application has been submitted:
      
      Name: ${application.firstName} ${application.lastName}
      Email: ${application.email}
      Institution: ${application.institution}
      Primary Specialty: ${application.primarySpecialty}
      Experience: ${application.yearsExperience}
      
      Please review the application in the admin dashboard:
      ${process.env.NEXTAUTH_URL}/admin
      
      Application Details:
      - Current Position: ${application.currentPosition}
      - Research Areas: ${application.researchAreas}
      - Review Frequency Preference: ${application.reviewFrequency}
      
      Review and approve/reject this application as appropriate.
    `
  }
  
  // Integrate with your email service
  logger.info('Email notification would be sent to:', recipients)
  logger.info('Email content:', emailContent)
  
  // In production, use your email service:
  // await emailService.send({
  //   to: recipients,
  //   subject: emailContent.subject,
  //   html: generateReviewerApplicationEmailHTML(emailContent.body),
  //   from: process.env.EMAIL_FROM || 'process.env.EMAIL_FROMjournal.com'
  // })
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100))
}

async function saveReviewerApplication(userEmail: string, formData: any) {
  try {
    // Save to the reviewerApplications table
    const [application] = await db.insert(reviewerApplications).values({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      institution: formData.institution,
      currentPosition: formData.currentPosition,
      primarySpecialty: formData.primarySpecialty,
      secondarySpecialties: formData.secondarySpecialties || [],
      yearsExperience: parseInt(formData.yearsExperience),
      researchAreas: formData.researchAreas || [],
      reviewFrequency: formData.reviewFrequency,
      previousJournals: formData.previousJournals || [],
      linkedinUrl: formData.linkedinUrl,
      publications: formData.publications,
      cvFile: formData.cvFile,
      status: "pending",
      submittedAt: new Date()
    }).returning()

    return { success: true, applicationId: application.id }
  } catch (error) {
    console.error('Error saving reviewer application:', error)
    return { success: false, error: 'Failed to save application' }
  }
}

async function createAdminNotification(application: any) {
  try {
    // Create admin notification for new reviewer application
    await db.insert(notifications).values({
      userId: null, // System notification - will be handled by admin role
      title: `New Reviewer Application from ${application.firstName} ${application.lastName}`,
      message: `Application from ${application.institution} - ${application.primarySpecialty} specialist`,
      type: 'system',
      relatedId: application.id,
      isRead: false,
    })
    
    console.log(`Admin notification created for application ${application.id}`)
  } catch (error) {
    console.error('Error creating admin notification:', error)
  }
}

async function logApplicationSubmission(application: any) {
  try {
    // Log the application submission
    console.log(`Reviewer application submitted: ${application.id}`, {
      applicationId: application.id,
      action: 'SUBMITTED',
      applicantName: `${application.firstName} ${application.lastName}`,
      institution: application.institution,
      timestamp: new Date().toISOString()
    })
    
    // In a production system, you would save this to an audit log table
    // await db.insert(applicationLogs).values({...})
    
    console.log(`Application submission logged for ${application.id}`)
  } catch (error) {
    console.error('Error logging application submission:', error)
  }
}