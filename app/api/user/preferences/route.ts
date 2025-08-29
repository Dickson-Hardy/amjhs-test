import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user preferences from the users table
    const userProfile = await db
      .select({
        id: users.id,
        emailPreferences: users.emailPreferences,
        submissionDefaults: users.submissionDefaults,
        privacySettings: users.privacySettings,
        languageSettings: users.languageSettings,
        notificationSettings: users.notificationSettings,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!userProfile.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userProfile[0]

    // Return default preferences if none exist
    const preferences = {
      id: user.id,
      emailPreferences: user.emailPreferences || {
        submissionUpdates: true,
        reviewRequests: true,
        publicationAlerts: true,
        newsletter: false,
        marketing: false,
        digest: true,
        digestFrequency: "weekly"
      },
      submissionDefaults: user.submissionDefaults || {
        defaultCategory: "original_research",
        defaultKeywords: [],
        defaultAbstract: "",
        autoSave: true,
        autoSaveInterval: 60,
        defaultLanguage: "en"
      },
      privacySettings: user.privacySettings || {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
        showInstitution: true,
        allowContact: true
      },
      languageSettings: user.languageSettings || {
        interfaceLanguage: "en",
        submissionLanguage: "en",
        preferredReviewLanguage: "en"
      },
      notificationSettings: user.notificationSettings || {
        browserNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        quietHours: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00"
      }
    }

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/preferences` })
    return NextResponse.json({ success: false, error: "Failed to fetch user preferences" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the preferences structure
    const {
      emailPreferences,
      submissionDefaults,
      privacySettings,
      languageSettings,
      notificationSettings
    } = body

    // Update user preferences in the database
    await db
      .update(users)
      .set({
        emailPreferences: emailPreferences || {},
        submissionDefaults: submissionDefaults || {},
        privacySettings: privacySettings || {},
        languageSettings: languageSettings || {},
        notificationSettings: notificationSettings || {},
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/preferences` })
    return NextResponse.json({ success: false, error: "Failed to update user preferences" }, { status: 500 })
  }
}
