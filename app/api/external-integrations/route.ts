import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth"
import { externalIntegrationsService } from "@/lib/external-integrations"
import { apiRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import { users, articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Request validation schemas
const ORCIDConnectSchema = z.object({
  authCode: z.string(),
  redirectUri: z.string()
})

const ORCIDSyncSchema = z.object({
  orcidId: z.string()
})

const CrossRefSearchSchema = z.object({
  query: z.string(),
  filters: z.object({
    type: z.string().optional(),
    publishedAfter: z.string().optional(),
    publishedBefore: z.string().optional(),
    hasORCID: z.boolean().optional(),
    hasAbstract: z.boolean().optional(),
    hasFullText: z.boolean().optional()
  }).optional(),
  rows: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

const DOIRegistrationSchema = z.object({
  manuscriptId: z.string(),
  metadata: z.object({
    title: z.string(),
    authors: z.array(z.object({
      givenName: z.string(),
      familyName: z.string(),
      orcid: z.string().optional(),
      affiliation: z.string().optional()
    })),
    abstract: z.string(),
    publicationDate: z.string(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    keywords: z.array(z.string()),
    references: z.array(z.string()),
    license: z.string().optional(),
    fundingInfo: z.array(z.object({
      funderName: z.string(),
      award: z.string().optional()
    })).optional()
  })
})

const PubMedSearchSchema = z.object({
  query: z.string(),
  filters: z.object({
    publicationType: z.array(z.string()).optional(),
    publicationDateStart: z.string().optional(),
    publicationDateEnd: z.string().optional(),
    journal: z.string().optional(),
    authors: z.array(z.string()).optional(),
    hasAbstract: z.boolean().optional(),
    hasFullText: z.boolean().optional(),
    sortBy: z.enum(["relevance", "publication_date", "author", "journal"]).optional()
  }).optional(),
  retmax: z.number().min(1).max(200).default(20),
  retstart: z.number().min(0).default(0)
})

const CitationAnalysisSchema = z.object({
  manuscriptData: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    references: z.array(z.string()),
    keywords: z.array(z.string())
  }),
  analysisDepth: z.enum(["basic", "comprehensive"]).default("basic")
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit.isAllowed(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: "Rate limit exceeded"
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
        }
      })
    }

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action

    switch (action) {
      case "connect-orcid":
        return await handleORCIDConnect(body, session.user.id)
      case "sync-orcid":
        return await handleORCIDSync(body, session.user.id)
      case "search-crossref":
        return await handleCrossRefSearch(body, session.user.id)
      case "register-doi":
        return await handleDOIRegistration(body, session.user.id)
      case "search-pubmed":
        return await handlePubMedSearch(body, session.user.id)
      case "analyze-citations":
        return await handleCitationAnalysis(body, session.user.id)
      case "find-similar-works":
        return await handleSimilarWorksSearch(body, session.user.id)
      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action"
        }, { status: 400 })
    }
  } catch (error) {
    logger.error("External integrations API error", { error })
    return NextResponse.json({
      success: false,
      error: "External integration service temporarily unavailable"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    switch (action) {
      case "orcid-profile":
        const orcidId = searchParams.get("orcidId")
        if (!orcidId) {
          return NextResponse.json({
            success: false,
            error: "ORCID ID required"
          }, { status: 400 })
        }
        return await handleGetORCIDProfile(orcidId, session.user.id)
      
      case "user-integrations":
        return await handleGetUserIntegrations(session.user.id)
      
      case "doi-status":
        const manuscriptId = searchParams.get("manuscriptId")
        if (!manuscriptId) {
          return NextResponse.json({
            success: false,
            error: "Manuscript ID required"
          }, { status: 400 })
        }
        return await handleGetDOIStatus(manuscriptId, session.user.id)
      
      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action"
        }, { status: 400 })
    }
  } catch (error) {
    logger.error("External integrations API GET error", { error })
    return NextResponse.json({
      success: false,
      error: "External integration service temporarily unavailable"
    }, { status: 500 })
  }
}

async function handleORCIDConnect(body: unknown, userId: string) {
  try {
    const validatedData = ORCIDConnectSchema.parse(body)

    logger.info("Connecting ORCID account", { userId })

    const result = await externalIntegrationsService.connectORCID(
      validatedData.authCode,
      validatedData.redirectUri,
      userId
    )

    return NextResponse.json({
      success: true,
      data: {
        orcidId: result.orcidId,
        accessToken: result.accessprocess.env.AUTH_TOKEN_PREFIX? "********" : null, // Don't expose actual token
        profile: result.profile
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("ORCID connection failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to connect ORCID account"
    }, { status: 500 })
  }
}

async function handleORCIDSync(body: unknown, userId: string) {
  try {
    const validatedData = ORCIDSyncSchema.parse(body)

    logger.info("Syncing ORCID profile", { orcidId: validatedData.orcidId, userId })

    const profile = await externalIntegrationsService.fetchORCIDProfile(
      validatedData.orcidId
    )

    // Store/update user profile with ORCID data
    // Implementation would update user's profile in database

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("ORCID sync failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to sync ORCID profile"
    }, { status: 500 })
  }
}

async function handleCrossRefSearch(body: unknown, userId: string) {
  try {
    const validatedData = CrossRefSearchSchema.parse(body)

    logger.info("Searching CrossRef", { 
      query: validatedData.query.substring(0, 100),
      userId 
    })

    const results = await externalIntegrationsService.searchCrossRef(
      validatedData.query,
      validatedData.filters,
      validatedData.rows,
      validatedData.offset
    )

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("CrossRef search failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "CrossRef search failed"
    }, { status: 500 })
  }
}

async function handleDOIRegistration(body: unknown, userId: string) {
  try {
    const validatedData = DOIRegistrationSchema.parse(body)

    // Check if user has permission to register DOI for this manuscript
    const hasPermission = await checkManuscriptPermission(
      validatedData.manuscriptId,
      userId,
      ["admin", "editor"]
    )

    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to register DOI for this manuscript"
      }, { status: 403 })
    }

    logger.info("Registering DOI", { 
      manuscriptId: validatedData.manuscriptId,
      userId 
    })

    const doiResult = await externalIntegrationsService.registerDOI(
      validatedData.manuscriptId,
      validatedData.metadata
    )

    return NextResponse.json({
      success: true,
      data: doiResult
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("DOI registration failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "DOI registration failed"
    }, { status: 500 })
  }
}

async function handlePubMedSearch(body: unknown, userId: string) {
  try {
    const validatedData = PubMedSearchSchema.parse(body)

    logger.info("Searching PubMed", { 
      query: validatedData.query.substring(0, 100),
      userId 
    })

    const results = await externalIntegrationsService.searchPubMed(
      validatedData.query,
      validatedData.filters,
      validatedData.retmax,
      validatedData.retstart
    )

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("PubMed search failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "PubMed search failed"
    }, { status: 500 })
  }
}

async function handleCitationAnalysis(body: unknown, userId: string) {
  try {
    const validatedData = CitationAnalysisSchema.parse(body)

    logger.info("Analyzing citations", { userId })

    const analysis = await externalIntegrationsService.analyzeCitationNetwork(
      validatedData.manuscriptData,
      validatedData.analysisDepth
    )

    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("Citation analysis failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Citation analysis failed"
    }, { status: 500 })
  }
}

async function handleSimilarWorksSearch(body: unknown, userId: string) {
  try {
    const { manuscriptData, threshold = 0.7 } = body

    if (!manuscriptData || !manuscriptData.title) {
      return NextResponse.json({
        success: false,
        error: "Manuscript data with title required"
      }, { status: 400 })
    }

    logger.info("Finding similar works", { userId })

    const similarWorks = await externalIntegrationsService.findSimilarWorks(
      manuscriptData,
      threshold
    )

    return NextResponse.json({
      success: true,
      data: {
        similarWorks,
        threshold,
        totalFound: similarWorks.length
      }
    })
  } catch (error) {
    logger.error("Similar works search failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Similar works search failed"
    }, { status: 500 })
  }
}

async function handleGetORCIDProfile(orcidId: string, userId: string) {
  try {
    logger.info("Fetching ORCID profile", { orcidId, userId })

    const profile = await externalIntegrationsService.fetchORCIDProfile(orcidId)

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error) {
    logger.error("Failed to fetch ORCID profile", { error, orcidId, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to fetch ORCID profile"
    }, { status: 500 })
  }
}

async function handleGetUserIntegrations(userId: string) {
  try {
    // Get user's connected integrations from database
    const [user] = await db.select({
      orcid: users.orcid,
      orcidVerified: users.orcidVerified,
      orcidLastSync: users.orcidLastSync,
      orcidAccessToken: users.orcidAccessToken
    }).from(users).where(eq(users.id, userId))

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 })
    }

    const integrations = {
      orcid: {
        connected: !!user.orcid,
        orcidId: user.orcid,
        lastSync: user.orcidLastSync,
        verified: user.orcidVerified
      },
      crossref: {
        enabled: true,
        apiKey: process.env.CROSSREF_API_KEY ? "configured" : null
      },
      pubmed: {
        enabled: true
      },
      datacite: {
        enabled: true,
        repositoryId: process.env.DATACITE_REPOSITORY_ID ? "configured" : null
      }
    }

    return NextResponse.json({
      success: true,
      data: integrations
    })
  } catch (error) {
    logger.error("Failed to get user integrations", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve integrations"
    }, { status: 500 })
  }
}

async function handleGetDOIStatus(manuscriptId: string, userId: string) {
  try {
    const hasPermission = await checkManuscriptPermission(
      manuscriptId,
      userId,
      ["admin", "editor", "author"]
    )

    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to view DOI status for this manuscript"
      }, { status: 403 })
    }

    // Get DOI status from database
    const [article] = await db.select({
      id: articles.id,
      doi: articles.doi,
      doiRegistered: articles.doiRegistered,
      doiRegisteredAt: articles.doiRegisteredAt,
      crossrefMetadata: articles.crossrefMetadata
    }).from(articles).where(eq(articles.id, manuscriptId))

    if (!article) {
      return NextResponse.json({
        success: false,
        error: "Manuscript not found"
      }, { status: 404 })
    }

    const doiStatus = {
      manuscriptId,
      doi: article.doi,
      status: article.doiRegistered ? "registered" : "not_registered",
      registeredAt: article.doiRegisteredAt,
      metadata: article.crossrefMetadata
    }

    return NextResponse.json({
      success: true,
      data: doiStatus
    })
  } catch (error) {
    logger.error("Failed to get DOI status", { error, manuscriptId, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve DOI status"
    }, { status: 500 })
  }
}

async function checkManuscriptPermission(
  manuscriptId: string, 
  userId: string,
  requiredRoles?: string[]
): Promise<boolean> {
  try {
    // Check if manuscript exists and user has permission
    const [article] = await db.select({
      id: articles.id,
      authorId: articles.authorId,
      editorId: articles.editorId
    }).from(articles).where(eq(articles.id, manuscriptId))

    if (!article) {
      return false
    }

    // Get user role
    const [user] = await db.select({
      id: users.id,
      role: users.role
    }).from(users).where(eq(users.id, userId))

    if (!user) {
      return false
    }

    // Check permissions
    if (user.role === 'admin') {
      return true
    }

    if (requiredRoles?.includes(user.role)) {
      // Author can access their own manuscripts
      if (user.role === 'author' && article.authorId === userId) {
        return true
      }
      
      // Editor can access manuscripts they're assigned to
      if (user.role === 'editor' && article.editorId === userId) {
        return true
      }
      
      // Other role-based permissions
      if (user.role === 'editor' || user.role === 'reviewer') {
        return true
      }
    }

    return false
  } catch (error) {
    logger.error("Permission check failed", { error, manuscriptId, userId })
    return false
  }
}
