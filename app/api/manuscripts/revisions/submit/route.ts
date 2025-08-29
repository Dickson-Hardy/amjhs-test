import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revisionWorkflow } from "@/lib/revision-workflow"
import { logError } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const revisionData = await request.json()

    // Validate the revision submission
    const validation = revisionWorkflow.validateRevisionSubmission(revisionData)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
        warnings: validation.warnings
      }, { status: 400 })
    }

    // Submit the revision
    const result = await revisionWorkflow.submitRevision(
      session.user.id,
      revisionData
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        versionNumber: result.versionNumber,
        revisionId: result.revisionId,
        message: result.message,
        warnings: validation.warnings
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }

  } catch (error: unknown) {
    logError(error, { endpoint: '/api/manuscripts/revisions/submit' })
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
