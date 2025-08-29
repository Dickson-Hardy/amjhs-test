/**
 * Plagiarism Detection API
 * Handles plagiarism checking requests and report generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PlagiarismDetectionService from '@/lib/plagiarism'
import { logError, logInfo } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { articleId, content, title } = await request.json()

    if (!articleId && !content) {
      return NextResponse.json(
        { error: 'Article ID or content required' },
        { status: 400 }
      )
    }

    logInfo(`Plagiarism check requested by user ${session.user.id}`, {
      articleId,
      hasContent: !!content
    })

    // Run plagiarism check
    const report = await PlagiarismDetectionService.checkPlagiarism(articleId)

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    logError(error as Error, { 
      context: 'plagiarism check POST',
      userId: session?.user?.id 
    })
    
    return NextResponse.json(
      { error: 'Failed to run plagiarism check' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const action = searchParams.get('action')

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'report':
        const report = await PlagiarismDetectionService.getPlagiarismReport(articleId)
        if (!report) {
          return NextResponse.json(
            { error: 'No plagiarism report found' },
            { status: 404 }
          )
        }
        return NextResponse.json({ report })

      case 'similarity':
        const { text1, text2 } = Object.fromEntries(searchParams.entries())
        if (!text1 || !text2) {
          return NextResponse.json(
            { error: 'Two text samples required for similarity analysis' },
            { status: 400 }
          )
        }
        
        const analysis = await PlagiarismDetectionService.analyzeSimilarity(text1, text2)
        return NextResponse.json({ analysis })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { 
      context: 'plagiarism check GET',
      userId: session?.user?.id 
    })
    
    return NextResponse.json(
      { error: 'Failed to retrieve plagiarism data' },
      { status: 500 }
    )
  }
}
