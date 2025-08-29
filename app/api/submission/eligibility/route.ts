import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProfileCompletenessService } from "@/lib/profile-completeness"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check submission eligibility
    const eligibility = await ProfileCompletenessService.canSubmitArticles(session.user.id)
    const requirements = ProfileCompletenessService.getSubmissionRequirements()

    return NextResponse.json({
      success: true,
      eligibility: {
        canSubmit: eligibility.canSubmit,
        score: eligibility.score,
        minimumRequired: requirements.minimumScore,
        missingFields: eligibility.missingFields,
        recommendations: eligibility.recommendations,
        requirements: requirements
      }
    })

  } catch (error) {
    logError(error as Error, { endpoint: `/api/submission/eligibility` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to check submission eligibility" 
    }, { status: 500 })
  }
}
