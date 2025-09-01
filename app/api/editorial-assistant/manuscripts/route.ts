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
    
    const manuscriptsData = await db
      .select()
      .from(submissions)
      .where(inArray(submissions.status, relevantStatuses))
      .orderBy(desc(submissions.createdAt))

    // Get associated articles and authors
    const transformedManuscripts = []
    for (const submission of manuscriptsData) {
      let article = null
      let author = null
      
      try {
        if (submission.articleId) {
          const articleResult = await db.select().from(articles).where(eq(articles.id, submission.articleId)).limit(1)
          article = articleResult[0] || null
          
          if (article && article.authorId) {
            try {
              const authorResult = await db.select().from(users).where(eq(users.id, article.authorId)).limit(1)
              author = authorResult[0] || null
            } catch (authorError) {
              // Log the missing author but continue processing
              logError(authorError as Error, { 
                endpoint: "/api/editorial-assistant/manuscripts", 
                action: "fetchAuthor",
                articleId: article.id,
                authorId: article.authorId
              })
              author = null
            }
          }
        }
      } catch (articleError) {
        // Log the error but continue processing other submissions
        logError(articleError as Error, { 
          endpoint: "/api/editorial-assistant/manuscripts", 
          action: "fetchArticle",
          submissionId: submission.id,
          articleId: submission.articleId
        })
      }
      
      transformedManuscripts.push({
        id: submission.id,
        title: article?.title || "Untitled",
        authors: author ? [author.name] : ["Unknown Author"],
        category: article?.category || "Uncategorized", 
        status: submission.status,
        submittedAt: submission.createdAt?.toISOString() || new Date().toISOString(),
        priority: determinePriority(submission.createdAt, submission.status)
      })
    }

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
