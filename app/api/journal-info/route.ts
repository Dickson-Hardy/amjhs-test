import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { 
  createApiResponse, 
  createErrorResponse,
  withErrorHandler,
  handleDatabaseError
} from "@/lib/api-utils"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { logger } from "@/lib/logger"

async function getJournalInfo(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  logger.api("Public journal info requested", {
    requestId,
    endpoint: "/api/journal-info"
  })

  try {
    const journalInfo = await loadPublicJournalInfo()
    
    logger.api("Public journal info retrieved successfully", {
      requestId
    })
    
    return createApiResponse(
      journalInfo,
      "Journal information retrieved successfully",
      requestId
    )
    
  } catch (error) {
    return handleDatabaseError(error)
  }
}

async function loadPublicJournalInfo() {
  try {
    // Get journal settings
    const settingsResult = await db.execute(sql`
      SELECT settings_data FROM journal_settings WHERE id = 'default'
    `)
    
    let settings = null
    if (settingsResult.length > 0) {
      const settingsData = (settingsResult[0] as any).settings_data
      try {
        // Check if it's already an object or needs parsing
        if (typeof settingsData === 'string') {
          settings = JSON.parse(settingsData)
        } else if (typeof settingsData === 'object' && settingsData !== null) {
          settings = settingsData
        }
      } catch (parseError) {
        logger.error("Error parsing journal settings data", {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          data: typeof settingsData === 'string' ? settingsData.substring(0, 100) : String(settingsData)
        })
        settings = null
      }
    }
    
    // Get impact factor and journal metrics from database if available
    const metricsResult = await db.execute(sql`
      SELECT 
        impact_factor,
        jci_score,
        h_index,
        total_citations,
        online_issn,
        print_issn,
        established_year,
        publisher,
        frequency,
        subject_areas
      FROM journal_metrics 
      WHERE id = 'current'
    `)
    
    let metrics = null
    if (metricsResult.length > 0) {
      metrics = metricsResult[0] as any
    }
    
    // Get publication stats
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_articles,
        COUNT(DISTINCT volume) as total_volumes,
        COUNT(DISTINCT CONCAT(volume, '-', issue)) as total_issues
      FROM articles 
      WHERE status = 'published'
    `)
    
    const stats = statsResult[0] as any
    
    // Return comprehensive journal information - only from database
    return {
      name: settings?.journalName || null,
      shortName: settings?.shortName || null,
      description: settings?.description || null,
      
      // ISSN numbers - only from database
      onlineIssn: metrics?.online_issn || null,
      printIssn: metrics?.print_issn || null,
      
      // Impact metrics - only from database
      impactFactor: metrics?.impact_factor || null,
      jciScore: metrics?.jci_score || null,
      hIndex: metrics?.h_index || null,
      totalCitations: metrics?.total_citations || null,
      
      // Publication info - only from database
      publisher: metrics?.publisher || null,
      frequency: metrics?.frequency || null,
      establishedYear: metrics?.established_year || null,
      
      // Subject areas - only from database
      subjectAreas: metrics?.subject_areas ? (() => {
        try {
          return typeof metrics.subject_areas === 'string' ? JSON.parse(metrics.subject_areas) : metrics.subject_areas
        } catch {
          return null
        }
      })() : null,
      
      // Statistics
      stats: {
        totalArticles: parseInt(stats?.total_articles) || 0,
        totalVolumes: parseInt(stats?.total_volumes) || 0,
        totalIssues: parseInt(stats?.total_issues) || 0
      },
      
      // Access and submission info - only from database
      openAccess: settings?.enableOpenAccess || null,
      submissionsOpen: settings?.enableSubmissions || null,
      license: settings?.license || null,
      
      // Contact and social - only from database
      website: settings?.website || null,
      email: settings?.email || null,
      
      // Indexing - only from database
      indexing: settings?.indexing ? (() => {
        try {
          return typeof settings.indexing === 'string' ? JSON.parse(settings.indexing) : settings.indexing
        } catch {
          return null
        }
      })() : null
    }
    
  } catch (error) {
    logger.error("Error loading public journal info", {
      error: error instanceof Error ? error.message : String(error)
    })
    
    // Return null values on error - no fallbacks
    return {
      name: null,
      shortName: null,
      description: null,
      onlineIssn: null,
      printIssn: null,
      impactFactor: null,
      jciScore: null,
      hIndex: null,
      totalCitations: null,
      publisher: null,
      frequency: null,
      establishedYear: null,
      subjectAreas: null,
      stats: {
        totalArticles: 0,
        totalVolumes: 0,
        totalIssues: 0
      },
      openAccess: null,
      submissionsOpen: null,
      license: null,
      website: null,
      email: null,
      indexing: null
    }
  }
}

export const GET = withErrorHandler(getJournalInfo)