import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProductionDOIService } from "@/lib/doi-production"
import { logError, logInfo } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only editors and admins can register DOIs
    if (!session || !['editor', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { doi, metadata } = body

    if (!doi || !metadata) {
      return NextResponse.json(
        { success: false, error: "DOI and metadata are required" },
        { status: 400 }
      )
    }

    logInfo(`DOI registration requested by ${session.user.email}`, { doi })

    // Register DOI with CrossRef
    const result = await ProductionDOIService.registerWithCrossRef(doi, metadata)

    if (result.success) {
      logInfo(`DOI ${doi} registration successful`, {
        registrationId: result.registrationId,
        batchId: result.batchId
      })

      return NextResponse.json({
        success: true,
        data: {
          doi: result.doi,
          registrationId: result.registrationId,
          status: result.status,
          batchId: result.batchId,
          timestamp: result.timestamp
        }
      })
    } else {
      logError(new Error(`DOI registration failed: ${result.error}`), { doi })

      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: result.timestamp
      }, { status: 400 })
    }
  } catch (error: unknown) {
    logError(error, { context: 'POST /api/integrations/doi' })
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doi = searchParams.get('doi')
    const action = searchParams.get('action')

    if (action === 'verify' && doi) {
      // Verify DOI exists
      const result = await ProductionDOIService.verifyDOI(doi)
      
      return NextResponse.json({
        success: true,
        data: result
      })
    } else if (action === 'search') {
      // Search DOIs
      const title = searchParams.get('title')
      const author = searchParams.get('author')
      const journal = searchParams.get('journal')
      const year = searchParams.get('year')
      const limit = searchParams.get('limit')

      const searchQuery = {
        title: title || undefined,
        author: author || undefined,
        journal: journal || undefined,
        year: year ? parseInt(year) : undefined,
        limit: limit ? parseInt(limit) : undefined
      }

      const results = await ProductionDOIService.searchDOIs(searchQuery)
      
      return NextResponse.json({
        success: true,
        data: results
      })
    } else if (action === 'status') {
      // Check registration status
      const batchId = searchParams.get('batchId')
      
      if (!batchId) {
        return NextResponse.json(
          { success: false, error: "Batch ID required for status check" },
          { status: 400 }
        )
      }

      const status = await ProductionDOIService.checkRegistrationStatus(batchId)
      
      return NextResponse.json({
        success: true,
        data: status
      })
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action or missing parameters" },
        { status: 400 }
      )
    }
  } catch (error: unknown) {
    logError(error, { context: 'GET /api/integrations/doi' })
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
