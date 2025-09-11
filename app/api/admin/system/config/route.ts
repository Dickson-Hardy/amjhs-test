import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock system configuration - replace with actual database queries
    const systemConfig = {
      general: {
        siteName: "American Journal of Health Sciences",
        siteUrl: "https://amjhs.com",
        adminEmail: "admin@amjhs.com",
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true
      },
      email: {
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: "noreply@amjhs.com",
        smtpPassword: "********",
        fromName: "AMJHS Editorial Office",
        fromEmail: "noreply@amjhs.com"
      },
      security: {
        sessionTimeout: 1440, // 24 hours in minutes
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireStrongPasswords: true,
        enableTwoFactor: false,
        allowedDomains: ["amjhs.com", "university.edu"]
      },
      review: {
        defaultReviewDeadline: 30,
        reminderDays: 7,
        autoExtendDays: 14,
        maxReviewers: 3,
        allowSelfAssignment: false
      },
      publication: {
        autoPublish: false,
        embargoMonths: 0,
        doiPrefix: "10.1234",
        issn: "1234-5678",
        copyrightNotice: "© 2024 American Journal of Health Sciences. All rights reserved."
      }
    }

    return NextResponse.json({
      success: true,
      config: systemConfig
    })

  } catch (error) {
    console.error('Error fetching system config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { section, updates } = await request.json()

    // Mock update - replace with actual database update
    console.log(`Updating ${section} configuration:`, updates)

    return NextResponse.json({
      success: true,
      message: `${section} configuration updated successfully`
    })

  } catch (error) {
    console.error('Error updating system config:', error)
    return NextResponse.json(
      { error: 'Failed to update system configuration' },
      { status: 500 }
    )
  }
}