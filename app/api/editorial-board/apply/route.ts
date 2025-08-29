import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/database"
import { sql } from "@/lib/db"
import { sendTemplateEmail } from "@/lib/email-hybrid"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Extract form data
    const applicationData: { [key: string]: unknown } = {
      applicant_id: session.user.id,
      position: formData.get("position") as string,
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      current_position: formData.get("currentPosition") as string,
      institution: formData.get("institution") as string,
      department: formData.get("department") as string,
      address: formData.get("address") as string,
      country: formData.get("country") as string,
      highest_degree: formData.get("highestDegree") as string,
      field_of_study: formData.get("fieldOfStudy") as string,
      years_of_experience: parseInt(formData.get("yearsOfExperience") as string) || 0,
      research_interests: formData.get("researchInterests") as string,
      expertise_areas: JSON.parse(formData.get("expertiseAreas") as string || "[]"),
      academic_positions: formData.get("academicPositions") as string,
      industry_experience: formData.get("industryExperience") as string,
      editorial_experience: formData.get("editorialExperience") as string,
      total_publications: parseInt(formData.get("totalPublications") as string) || 0,
      h_index: parseInt(formData.get("hIndex") as string) || 0,
      major_publications: formData.get("majorPublications") as string,
      awards_honors: formData.get("awardsHonors") as string,
      motivation_statement: formData.get("motivationStatement") as string,
      availability_commitment: formData.get("availabilityCommitment") as string,
      language_proficiency: formData.get("languageProficiency") as string,
      cover_letter_url: formData.get("coverLetter") as string, // Store as text initially
      status: "pending"
    }

    // Validate required fields
    const requiredFields = [
      "position", "first_name", "last_name", "email", 
      "current_position", "institution", "highest_degree", 
      "field_of_study", "motivation_statement"
    ]
    
    for (const field of requiredFields) {
      if (!(applicationData as unknown)[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` }, 
          { status: 400 }
        )
      }
    }

    // Handle file uploads (CV and additional documents)
    const cvFile = formData.get("cvFile") as File
    let cvFileUrl: string | null = null
    if (cvFile) {
      cvFileUrl = await uploadFile(cvFile, 'cv')
    }

    // Handle additional documents
    const additionalDocuments: string[] = []
    let index = 0
    while (formData.get(`additionalDocument_${index}`)) {
      const file = formData.get(`additionalDocument_${index}`) as File
      if (file) {
        const fileUrl = await uploadFile(file, 'additional')
        additionalDocuments.push(fileUrl)
      }
      index++
    }

    // Insert application into database
    const insertResult = await sql`
      INSERT INTO editorial_board_applications (
        applicant_id, position, first_name, last_name, email, phone,
        current_position, institution, department, address, country,
        highest_degree, field_of_study, years_of_experience, research_interests,
        expertise_areas, academic_positions, industry_experience, editorial_experience,
        total_publications, h_index, major_publications, awards_honors,
        motivation_statement, availability_commitment, language_proficiency,
        cv_file_url, cover_letter_url, additional_documents_urls, status
      ) VALUES (
        ${applicationData.applicant_id},
        ${applicationData.position},
        ${applicationData.first_name},
        ${applicationData.last_name},
        ${applicationData.email},
        ${applicationData.phone},
        ${applicationData.current_position},
        ${applicationData.institution},
        ${applicationData.department},
        ${applicationData.address},
        ${applicationData.country},
        ${applicationData.highest_degree},
        ${applicationData.field_of_study},
        ${applicationData.years_of_experience},
        ${applicationData.research_interests},
        ${applicationData.expertise_areas},
        ${applicationData.academic_positions},
        ${applicationData.industry_experience},
        ${applicationData.editorial_experience},
        ${applicationData.total_publications},
        ${applicationData.h_index},
        ${applicationData.major_publications},
        ${applicationData.awards_honors},
        ${applicationData.motivation_statement},
        ${applicationData.availability_commitment},
        ${applicationData.language_proficiency},
        ${cvFileUrl},
        ${applicationData.cover_letter_url},
        ${additionalDocuments},
        ${applicationData.status}
      ) RETURNING id
    `;
    const applicationId = insertResult[0]?.id;

    // Get admin emails for notifications
    const adminResult = await sql`
      SELECT email FROM users WHERE role IN ('admin', 'editor') AND email IS NOT NULL
    `;
    const adminEmails = adminResult.map((row: unknown) => row.email);

    // Send confirmation and notification emails
    try {
      await sendEditorialBoardApplication(
        applicationData.email,
        `${applicationData.first_name} ${applicationData.last_name}`,
        applicationData.position,
        applicationId,
        adminEmails
      )
    } catch (emailError) {
      logger.error("Failed to send emails:", emailError)
      // Don't fail the application submission if email fails
    }

    // Log the application submission
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (
        ${session.user.id},
        ${"editorial_board_application_submitted"},
        ${JSON.stringify({ applicationId, position: applicationData.position })},
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}
      )
    `;

    return NextResponse.json({
      success: true,
      applicationId,
      message: "Application submitted successfully"
    })

  } catch (error) {
    logger.error("Editorial board application error:", error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get("id")
    if (applicationId) {
      // Get specific application
      const isAdminOrEditor = session.user.role === 'admin' || session.user.role === 'editor';
      const result = await sql`
        SELECT 
          eba.*,
          u.name as applicant_name,
          u.email as applicant_email
        FROM editorial_board_applications eba
        JOIN users u ON eba.applicant_id = u.id
        WHERE eba.id = ${applicationId} AND (eba.applicant_id = ${session.user.id} OR ${isAdminOrEditor})
      `;
      if (!result.length) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 })
      }
      return NextResponse.json({ application: result[0] })
    } else {
      // Get user's applications
      const result = await sql`
        SELECT 
          id, position, status, submitted_at, reviewed_at, decision_at
        FROM editorial_board_applications
        WHERE applicant_id = ${session.user.id}
        ORDER BY submitted_at DESC
      `;
      return NextResponse.json({ applications: result })
    }
  } catch (error) {
    logger.error("Get editorial board applications error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve applications" },
      { status: 500 }
    )
  }
}

async function uploadFile(file: File, category: string): Promise<string> {
  try {
    // In a real implementation, upload to cloud storage:
    // Example with AWS S3:
    // const uploadResult = await s3.upload({
    //   Bucket: process.env.AWS_S3_BUCKET!,
    //   Key: `editorial-board/${category}/${Date.now()}_${file.name}`,
    //   Body: Buffer.from(await file.arrayBuffer()),
    //   ContentType: file.type
    // }).promise()
    // return uploadResult.Location
    
    // Example with Cloudinary:
    // const uploadResult = await cloudinary.uploader.upload(
    //   `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`,
    //   {
    //     folder: `editorial-board/${category}`,
    //     resource_type: 'auto'
    //   }
    // )
    // Simple file storage - in production, use proper file upload service
    const timestamp = Date.now()
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uploadUrl = `uploads/${category}/${timestamp}_${filename}`
    
    // In production, you would:
    // 1. Validate file type and size
    // 2. Upload to cloud storage (S3, Cloudinary, etc.)
    // 3. Return the actual storage URL
    // For now, we'll store the file reference
    
    logger.info(`File uploaded: ${file.name} -> ${uploadUrl}`)
    
    return uploadUrl
  } catch (error) {
    logger.error('Error uploading file:', error)
    throw new AppError(`Failed to upload ${category} file`)
  }
}
