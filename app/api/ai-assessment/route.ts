/**
 * AI Assessment API Route
 * Handles manuscript assessment requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIAssessmentService, type ManuscriptContent } from '@/lib/ai-assessment'
import { logger } from '@/lib/logger'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { manuscriptId, content } = body

    if (!manuscriptId || !content) {
      return NextResponse.json(
        { error: 'Manuscript ID and content are required' },
        { status: 400 }
      )
    }

    // Validate manuscript ownership or access
    const { rows: manuscriptRows } = await sql`
      SELECT id, title, abstract, content, keywords, field_of_study
      FROM articles 
      WHERE id = ${manuscriptId} 
      AND (author_id = ${session.user.id} OR id IN (
        SELECT article_id FROM article_collaborators WHERE user_id = ${session.user.id}
      ))
    `

    if (manuscriptRows.length === 0) {
      return NextResponse.json(
        { error: 'Manuscript not found or access denied' },
        { status: 404 }
      )
    }

    const manuscript = manuscriptRows[0]

    // Prepare manuscript content for assessment
    const manuscriptContent: ManuscriptContent = {
      title: manuscript.title,
      abstract: manuscript.abstract || '',
      content: content.content || manuscript.content,
      keywords: content.keywords || manuscript.keywords || [],
      references: content.references || [],
      authors: content.authors || [
        {
          id: session.user.id,
          name: session.user.name || '',
          affiliation: session.user.affiliation || '',
          orcidId: session.user.orcidId
        }
      ],
      fieldOfStudy: content.fieldOfStudy || manuscript.field_of_study || 'General'
    }

    // Perform AI assessment
    const assessment = await AIAssessmentService.assessManuscript(
      manuscriptId,
      manuscriptContent
    )

    logger.info(`AI assessment completed for manuscript ${manuscriptId}`)

    return NextResponse.json({
      success: true,
      assessment
    })

  } catch (error) {
    logger.error('Error in AI assessment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const manuscriptId = searchParams.get('manuscriptId')

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      )
    }

    // Get existing assessment
    const assessment = await AIAssessmentService.getAssessment(manuscriptId)

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      assessment
    })

  } catch (error) {
    logger.error('Error getting AI assessment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
