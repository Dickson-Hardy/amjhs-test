import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { submissions, articles, users } from "@/lib/db/schema"
import { eq, inArray, desc } from "drizzle-orm"

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

    // Get manuscripts that need editorial assistant attention
    const relevantStatuses = ["submitted", "editorial_assistant_review", "associate_editor_assignment"]
    
    const manuscripts = await db.query.submissions.findMany({
      where: inArray(submissions.status, relevantStatuses),
      with: {
        article: {
          with: {
            author: true
          }
        }
      },
      orderBy: [desc(submissions.createdAt)]
    })

    // Transform data for frontend
    const transformedManuscripts = manuscripts.map(manuscript => ({
      id: manuscript.id,
      title: manuscript.article?.title || "Untitled",
      authors: manuscript.article?.author ? [manuscript.article.author.name] : ["Unknown Author"],
      category: manuscript.article?.category || "Uncategorized",
      status: manuscript.status,
      submittedAt: manuscript.createdAt?.toISOString() || new Date().toISOString(),
      priority: determinePriority(manuscript.createdAt, manuscript.status)
    }))

    return NextResponse.json({
      success: true,
      manuscripts: transformedManuscripts
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editorial-assistant/manuscripts", action: "fetchManuscripts" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

function determinePriority(createdAt: Date | null, status: string): "high" | "medium" | "low" {
  if (!createdAt) return "medium"
  
  const now = new Date()
  const daysSinceSubmission = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceSubmission > 7) return "high"
  if (daysSinceSubmission > 3) return "medium"
  return "low"
}
