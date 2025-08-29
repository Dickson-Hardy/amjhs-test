import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { workflowManager } from "@/lib/workflow"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor permissions
    if (!["editor", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { articleId, targetReviewerCount = 3 } = body

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
    }

    // Use the enhanced reviewer assignment with recommendations
    const result = await workflowManager.reviewerAssignment.assignReviewersWithRecommendations(
      articleId,
      session.user.id,
      targetReviewerCount
    )

    if (result.success) {
      logInfo("Enhanced reviewer assignment completed", {
        articleId,
        editorId: session.user.id,
        assignedCount: result.assignedReviewers.length,
        recommendedUsed: result.recommendedUsed,
        systemFound: result.systemFound,
        workflow: result.workflow
      })

      return NextResponse.json({
        success: true,
        message: "Reviewers assigned successfully",
        data: {
          assignedReviewers: result.assignedReviewers,
          recommendedUsed: result.recommendedUsed,
          systemFound: result.systemFound,
          totalAssigned: result.assignedReviewers.length,
          workflow: result.workflow,
          summary: {
            step1: `Retrieved ${result.workflow.step1_recommendedRetrieved} author recommendations`,
            step2: `Validated ${result.workflow.step2_recommendedValidated} recommended reviewers`,
            step3: `Found ${result.workflow.step3_systemCandidates} system candidates`,
            step4: `Ranked ${result.workflow.step4_totalRanked} total reviewers`,
            step5: `Selected ${result.workflow.step5_finalSelected} final reviewers (${result.recommendedUsed} recommended + ${result.systemFound} system-found)`
          }
        },
        errors: result.errors
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to assign reviewers",
        errors: result.errors
      }, { status: 400 })
    }

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/workflow/assign-reviewers-enhanced",
      userId: session?.user?.id 
    })
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
    }

    // Get preview of recommended vs system reviewers without assigning
    const article = await workflowManager.submissionService.getArticleDetails(articleId)
    
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Get recommended reviewers
    const recommendedReviewers = await workflowManager.reviewerAssignment.getRecommendedReviewers(articleId)
    
    // Get system candidates
    const systemCandidates = await workflowManager.reviewerAssignment.findSuitableReviewers(
      articleId,
      {
        expertise: article.keywords || [],
        minQualityScore: 70,
        excludeConflicts: [article.authorId]
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          category: article.category,
          keywords: article.keywords
        },
        recommendedReviewers: recommendedReviewers.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          affiliation: r.affiliation,
          expertise: r.expertise,
          status: r.status,
          isInSystem: !!r.userId // Whether they exist as a user in our system
        })),
        systemCandidates: systemCandidates.slice(0, 10).map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          score: r.score
        })),
        summary: {
          totalRecommended: recommendedReviewers.length,
          validRecommended: recommendedReviewers.filter(r => r.status === 'suggested').length,
          topSystemCandidates: Math.min(systemCandidates.length, 10)
        }
      }
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: "/api/workflow/assign-reviewers-enhanced GET",
      userId: session?.user?.id 
    })
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
