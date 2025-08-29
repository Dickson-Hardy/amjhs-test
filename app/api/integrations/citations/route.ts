/**
 * Citation Management API
 * Handles citation extraction, validation, and formatting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import CitationService, { type CitationStyle } from '@/lib/citations'
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

    const { action, data } = await request.json()

    switch (action) {
      case 'extract':
        const { text } = data
        if (!text) {
          return NextResponse.json(
            { error: 'Text content required for citation extraction' },
            { status: 400 }
          )
        }

        const citations = await CitationService.extractCitations(text)
        
        logInfo(`Citations extracted by user ${session.user.id}`, {
          extractedCount: citations.length
        })

        return NextResponse.json({
          success: true,
          citations
        })

      case 'validate':
        const { citations: citationsToValidate } = data
        if (!citationsToValidate || !Array.isArray(citationsToValidate)) {
          return NextResponse.json(
            { error: 'Citations array required for validation' },
            { status: 400 }
          )
        }

        const validations = await CitationService.validateCitations(citationsToValidate)

        return NextResponse.json({
          success: true,
          validations
        })

      case 'format':
        const { citations: citationsToFormat, style } = data
        if (!citationsToFormat || !style) {
          return NextResponse.json(
            { error: 'Citations and style required for formatting' },
            { status: 400 }
          )
        }

        const validStyles: CitationStyle[] = ['apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee']
        if (!validStyles.includes(style)) {
          return NextResponse.json(
            { error: `Invalid citation style. Supported: ${validStyles.join(', ')}` },
            { status: 400 }
          )
        }

        const bibliography = CitationService.generateBibliography(citationsToFormat, style)

        return NextResponse.json({
          success: true,
          bibliography,
          style
        })

      case 'analyze':
        const { citations: citationsToAnalyze } = data
        if (!citationsToAnalyze || !Array.isArray(citationsToAnalyze)) {
          return NextResponse.json(
            { error: 'Citations array required for analysis' },
            { status: 400 }
          )
        }

        const analysis = await CitationService.analyzeReferences(citationsToAnalyze)

        return NextResponse.json({
          success: true,
          analysis
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { 
      context: 'citation management POST',
      userId: session?.user?.id 
    })
    
    return NextResponse.json(
      { error: 'Failed to process citation request' },
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
    const action = searchParams.get('action')
    const query = searchParams.get('query')

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Search query required' },
            { status: 400 }
          )
        }

        const searchResults = await CitationService.searchCitationMetadata(query)

        return NextResponse.json({
          success: true,
          results: searchResults,
          query
        })

      case 'styles':
        const supportedStyles = [
          { id: 'apa', name: 'APA (American Psychological Association)' },
          { id: 'mla', name: 'MLA (Modern Language Association)' },
          { id: 'chicago', name: 'Chicago Manual of Style' },
          { id: 'harvard', name: 'Harvard Referencing' },
          { id: 'vancouver', name: 'Vancouver System' },
          { id: 'ieee', name: 'IEEE Citation Style' }
        ]

        return NextResponse.json({
          success: true,
          styles: supportedStyles
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { 
      context: 'citation management GET',
      userId: session?.user?.id 
    })
    
    return NextResponse.json(
      { error: 'Failed to retrieve citation data' },
      { status: 500 }
    )
  }
}
