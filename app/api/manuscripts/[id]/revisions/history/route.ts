import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revisionWorkflow } from "@/lib/revision-workflow"
import { logError } from "@/lib/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: articleId } = await params

    const history = await revisionWorkflow.getRevisionHistory(articleId)

    return NextResponse.json(history)

  } catch (error: unknown) {
    logError(error, { endpoint: `/api/manuscripts/${params}/revisions/history` })
    return NextResponse.json({
      success: false,
      message: "Failed to fetch revision history"
    }, { status: 500 })
  }
}
