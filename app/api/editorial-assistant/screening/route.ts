import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialAssistantService } from "@/lib/workflow"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Screening data validation schema
const screeningSchema = z.object({
  submissionId: z.string().uuid(),
  screeningData: z.object({
    fileCompleteness: z.boolean(),
    plagiarismCheck: z.boolean(),
    formatCompliance: z.boolean(),
    ethicalCompliance: z.boolean(),
    notes: z.string().optional()
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validation = screeningSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { submissionId, screeningData } = validation.data
    const editorialAssistantId = session.user.id

    // Perform initial screening
    const editorialAssistantService = new EditorialAssistantService()
    const result = await editorialAssistantService.performInitialScreening(
      submissionId,
      editorialAssistantId,
      screeningData
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      nextStatus: result.nextStatus
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/screening", action: "performInitialScreening" })
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

    // Check if user has editorial assistant role
    if (session.user.role !== "editorial-assistant" && 
        session.user.role !== "admin" && 
        session.user.role !== "managing-editor" && 
        session.user.role !== "editor-in-chief") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 })
    }

    // Get submission details for screening
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: {
        article: true,
        statusHistory: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        article: submission.article,
        statusHistory: submission.statusHistory,
        createdAt: submission.createdAt
      }
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/screening", action: "fetchSubmission" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
