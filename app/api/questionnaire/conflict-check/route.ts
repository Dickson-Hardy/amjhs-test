import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { db } from "@/lib/db"
import { conflictQuestionnaires, users, submissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

// Questionnaire validation schema
const questionnaireSchema = z.object({
  manuscriptId: z.string().uuid(),
  role: z.enum(["associate-editor", "reviewer"]),
  questionnaireData: z.object({
    hasAffiliations: z.boolean(),
    hasCollaborations: z.boolean(),
    hasFinancialInterests: z.boolean(),
    hasPersonalRelationships: z.boolean(),
    hasInstitutionalConflicts: z.boolean(),
    additionalDetails: z.string().optional(),
    canReviewObjectively: z.boolean()
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has appropriate role
    const allowedRoles = ["editor", "reviewer", "admin", "editor-in-chief", "managing-editor"]
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = questionnaireSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { manuscriptId, role, questionnaireData } = validation.data
    const userId = session.user.id

    // Check if questionnaire already exists
    const existingQuestionnaire = await db.query.conflictQuestionnaires.findFirst({
      where: and(
        eq(conflictQuestionnaires.userId, userId),
        eq(conflictQuestionnaires.manuscriptId, manuscriptId),
        eq(conflictQuestionnaires.role, role)
      )
    })

    if (existingQuestionnaire) {
      return NextResponse.json({ 
        error: "Questionnaire already completed for this manuscript" 
      }, { status: 400 })
    }

    // Determine if there are conflicts
    const hasConflicts = questionnaireData.hasAffiliations || 
                        questionnaireData.hasCollaborations || 
                        questionnaireData.hasFinancialInterests || 
                        questionnaireData.hasPersonalRelationships || 
                        questionnaireData.hasInstitutionalConflicts ||
                        !questionnaireData.canReviewObjectively

    // Create questionnaire record
    const questionnaire = await db.insert(conflictQuestionnaires).values({
      id: uuidv4(),
      userId: userId,
      manuscriptId: manuscriptId,
      role: role,
      questionnaireData: questionnaireData,
      hasConflicts: hasConflicts,
      conflictDetails: hasConflicts ? 
        `Conflicts detected: ${Object.entries(questionnaireData)
          .filter(([key, value]) => value === true && key !== 'canReviewObjectively')
          .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
          .join(', ')}` : null,
      isCompleted: true,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    if (hasConflicts) {
      return NextResponse.json({
        success: true,
        message: "Questionnaire completed. Conflicts detected - you cannot review this manuscript.",
        hasConflicts: true,
        conflictDetails: questionnaire[0].conflictDetails,
        questionnaireId: questionnaire[0].id
      })
    }

    return NextResponse.json({
      success: true,
      message: "Questionnaire completed successfully. No conflicts detected.",
      hasConflicts: false,
      questionnaireId: questionnaire[0].id
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/questionnaire/conflict-check", action: "submitQuestionnaire" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const manuscriptId = searchParams.get("manuscriptId")
    const role = searchParams.get("role")

    if (!manuscriptId || !role) {
      return NextResponse.json({ error: "Manuscript ID and role required" }, { status: 400 })
    }

    // Check if questionnaire exists
    const questionnaire = await db.query.conflictQuestionnaires.findFirst({
      where: and(
        eq(conflictQuestionnaires.userId, session.user.id),
        eq(conflictQuestionnaires.manuscriptId, manuscriptId),
        eq(conflictQuestionnaires.role, role as "associate-editor" | "reviewer")
      )
    })

    if (!questionnaire) {
      return NextResponse.json({
        success: true,
        questionnaire: null,
        needsCompletion: true
      })
    }

    return NextResponse.json({
      success: true,
      questionnaire: {
        id: questionnaire.id,
        hasConflicts: questionnaire.hasConflicts,
        conflictDetails: questionnaire.conflictDetails,
        isCompleted: questionnaire.isCompleted,
        completedAt: questionnaire.completedAt
      },
      needsCompletion: false
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/questionnaire/conflict-check", action: "fetchQuestionnaire" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
