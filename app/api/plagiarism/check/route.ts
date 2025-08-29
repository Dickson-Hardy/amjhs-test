import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProductionPlagiarismService } from "@/lib/plagiarism-production"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only authenticated users can check plagiarism
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { text, title, author, fileName, articleId } = body

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      )
    }

    // Use article title and first author if not provided
    const requestTitle = title || `Article ${articleId || 'Unknown'}`
    const requestAuthor = author || session.user.name || 'Unknown Author'

    logInfo(`Plagiarism check requested by ${session.user.email}`, {
      title: requestTitle,
      textLength: text.length,
      articleId
    })

    // Submit for plagiarism checking
    const result = await ProductionPlagiarismService.checkPlagiarism({
      text,
      title: requestTitle,
      author: requestAuthor,
      fileName,
      metadata: {
        articleId: articleId || '',
        submissionId: articleId || '',
        category: 'research'
      }
    })

    logInfo(`Plagiarism check submitted`, {
      submissionId: result.id,
      status: result.status,
      provider: result.provider,
      similarity: result.similarity
    })

    // Return immediate result for completed checks, or status for processing
    if (result.status === 'completed') {
      return NextResponse.json({
        success: true,
        result: {
          submissionId: result.id,
          similarityScore: result.similarity,
          status: result.status,
          sources: result.sources.map(source => ({
            title: source.title,
            url: source.url,
            similarity: `${source.similarity.toFixed(1)}%`,
            matchedText: source.matchedText,
            source: source.source,
            type: source.type
          })),
          reportUrl: result.reportUrl,
          provider: result.provider,
          submittedAt: result.submittedAt,
          completedAt: result.completedAt
        }
      })
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        result: {
          submissionId: result.id,
          status: result.status,
          similarityScore: 0,
          sources: [],
          provider: result.provider,
          submittedAt: result.submittedAt,
          message: "Plagiarism check is being processed. Use the submission ID to check status."
        }
      })
    }
  } catch (error: unknown) {
    logError(error, { context: 'POST /api/plagiarism/check' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to submit plagiarism check"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    const action = searchParams.get('action') || 'result'

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "Submission ID is required" },
        { status: 400 }
      )
    }

    if (action === 'status') {
      // Check status only
      const status = await ProductionPlagiarismService.checkStatus(submissionId)
      
      return NextResponse.json({
        success: true,
        result: {
          submissionId,
          status: status.status,
          progress: status.progress,
          estimatedCompletion: status.estimatedCompletion
        }
      })
    } else {
      // Get full result
      const result = await ProductionPlagiarismService.getResult(submissionId)
      
      if (result) {
        return NextResponse.json({
          success: true,
          result: {
            submissionId: result.id,
            similarityScore: result.similarity,
            status: result.status,
            sources: result.sources.map(source => ({
              title: source.title,
              url: source.url,
              similarity: `${source.similarity.toFixed(1)}%`,
              matchedText: source.matchedText,
              source: source.source,
              type: source.type
            })),
            reportUrl: result.reportUrl,
            provider: result.provider,
            submittedAt: result.submittedAt,
            completedAt: result.completedAt,
            error: result.error
          }
        })
      } else {
        return NextResponse.json(
          { success: false, error: "Result not found or still processing" },
          { status: 404 }
        )
      }
    }
  } catch (error: unknown) {
    logError(error, { context: 'GET /api/plagiarism/check' })
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
