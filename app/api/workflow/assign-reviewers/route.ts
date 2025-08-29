import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EditorialWorkflow } from "@/lib/workflow"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !["editor", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { articleId, reviewerIds } = await request.json()

    if (!articleId || !reviewerIds || !Array.isArray(reviewerIds)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const result = await EditorialWorkflow.assignReviewers(articleId, reviewerIds, session.user.id)

    if (result.success) {
      logInfo("Reviewers assigned", {
        articleId,
        reviewerIds,
        editorId: session.user.id,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    logError(error as Error, { endpoint: "/api/workflow/assign-reviewers" })
    return NextResponse.json({ success: false, error: "Assignment failed" }, { status: 500 })
  }
}
