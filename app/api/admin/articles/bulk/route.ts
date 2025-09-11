import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, submissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"
import { logAdminAction } from "@/lib/admin-logger"
import { z } from "zod"

// Validation schema for bulk article creation
const bulkCreateArticleSchema = z.object({
  articles: z.array(z.object({
    title: z.string().min(10, "Title must be at least 10 characters"),
    abstract: z.string().min(100, "Abstract must be at least 100 characters"),
    content: z.string().optional(),
    keywords: z.array(z.string()).min(3, "At least 3 keywords required"),
    category: z.string().min(1, "Category is required"),
    authorEmail: z.string().email("Valid author email required"),
    authorName: z.string().min(1, "Author name is required"),
    authorAffiliation: z.string().optional(),
    coAuthors: z.array(z.object({
      name: z.string(),
      email: z.string().email(),
      affiliation: z.string(),
      isCorresponding: z.boolean().default(false)
    })).optional(),
    status: z.enum(["draft", "submitted", "accepted", "published"]).default("accepted"),
    volume: z.string().default("1"),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    publishedDate: z.string().datetime().optional(),
    files: z.array(z.object({
      url: z.string(),
      type: z.string(),
      name: z.string(),
      fileId: z.string()
    })).optional(),
    metadata: z.record(z.any()).optional()
  })).min(1, "At least one article is required")
})

/**
 * POST /api/admin/articles/bulk
 * Bulk create articles for Volume 1 (2025)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input data
    const validationResult = bulkCreateArticleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { articles: articleData } = validationResult.data

    // Process all articles in a transaction
    const results = await db.transaction(async (tx) => {
      const createdArticles = []
      const errors = []

      for (let i = 0; i < articleData.length; i++) {
        const data = articleData[i]
        
        try {
          // Handle author lookup or creation
          let authorId: string
          const existingAuthor = await tx
            .select()
            .from(users)
            .where(eq(users.email, data.authorEmail))
            .limit(1)

          if (existingAuthor.length > 0) {
            authorId = existingAuthor[0].id
            
            // Update author name if provided and different
            if (data.authorName && existingAuthor[0].name !== data.authorName) {
              await tx
                .update(users)
                .set({ 
                  name: data.authorName,
                  affiliation: data.authorAffiliation || existingAuthor[0].affiliation
                })
                .where(eq(users.id, existingAuthor[0].id))
            }
          } else {
            // Create a new author record
            const newAuthor = await tx
              .insert(users)
              .values({
                email: data.authorEmail,
                name: data.authorName,
                affiliation: data.authorAffiliation || "",
                role: "author",
                isVerified: false,
                isActive: true
              })
              .returning()
            
            authorId = newAuthor[0].id
          }

          // Create the article
          const article = await tx
            .insert(articles)
            .values({
              title: data.title,
              abstract: data.abstract,
              content: data.content || "",
              keywords: data.keywords,
              category: data.category,
              status: data.status,
              volume: data.volume,
              issue: data.issue,
              pages: data.pages,
              doi: data.doi,
              publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
              authorId: authorId,
              coAuthors: data.coAuthors || [] as any,
              files: data.files || [],
              metadata: data.metadata || {},
              submittedDate: new Date(),
              views: 0,
              downloads: 0,
              citations: 0
            })
            .returning()

          // Create corresponding submission record for workflow tracking
          const submissionData = {
            articleId: article[0].id,
            authorId: authorId,
            status: data.status,
            statusHistory: [{
              status: data.status,
              timestamp: new Date(),
              userId: session.user.id!,
              notes: `Article created via bulk import by admin: ${session.user.email}`
            }] as any,
            submittedAt: new Date()
          }
          
          await tx
            .insert(submissions)
            .values(submissionData)

          createdArticles.push({
            index: i + 1,
            id: article[0].id,
            title: data.title,
            status: data.status,
            authorEmail: data.authorEmail,
            volume: data.volume
          })

        } catch (error) {
          logger.error(`Error creating article ${i + 1}`, { error })
          errors.push({
            index: i + 1,
            title: data.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return { createdArticles, errors }
    })

    // Log the bulk creation action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'BULK_CREATE_ARTICLES',
      resourceType: 'article',
      resourceId: 'bulk',
      details: `Bulk created ${results.createdArticles.length} articles. ${results.errors.length} errors occurred.`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    logger.info("Bulk article creation completed", {
      successful: results.createdArticles.length,
      errors: results.errors.length,
      adminId: session.user.id
    })

    const response = {
      success: true,
      summary: {
        total: articleData.length,
        successful: results.createdArticles.length,
        failed: results.errors.length
      },
      createdArticles: results.createdArticles,
      errors: results.errors,
      message: `Successfully created ${results.createdArticles.length} out of ${articleData.length} articles`
    }

    return NextResponse.json(response, { 
      status: results.errors.length > 0 ? 207 : 201 // 207 Multi-Status if some failed
    })

  } catch (error) {
    logger.error("Error in bulk article creation", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/articles/bulk/template
 * Get a template for bulk article import
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const template = {
      articles: [
        {
          title: "Article Title - Replace with actual title",
          abstract: "This is a sample abstract that should be at least 100 characters long. Replace this with the actual abstract of your article. It should summarize the key findings and methodology of the research.",
          content: "Full article content goes here (optional if you have PDF files)",
          keywords: ["keyword1", "keyword2", "keyword3", "keyword4"],
          category: "Clinical Research",
          authorEmail: "author@institution.edu",
          authorName: "Dr. Author Name",
          authorAffiliation: "Institution Name",
          coAuthors: [
            {
              name: "Dr. Co-Author Name",
              email: "coauthor@university.edu",
              affiliation: "Research Institute",
              isCorresponding: false
            }
          ],
          status: "accepted",
          volume: "1",
          issue: "", // Leave empty for volume-only publication
          pages: "1-15",
          doi: "", // Optional - will be generated if empty
          publishedDate: "2025-01-15T00:00:00Z", // ISO format, optional
          files: [], // PDF files and supplements
          metadata: {
            submissionDate: "2024-10-15",
            acceptanceDate: "2024-12-01",
            specialNotes: ""
          }
        }
      ],
      categories: [
        "Clinical Research",
        "Basic Science Research", 
        "Public Health",
        "Medical Education",
        "Case Studies",
        "Review Articles",
        "Editorial",
        "Commentary",
        "Letter to Editor"
      ],
      statuses: [
        "draft",
        "submitted", 
        "accepted",
        "published"
      ],
      instructions: {
        "title": "Article title (minimum 10 characters)",
        "abstract": "Article abstract (minimum 100 characters)",
        "keywords": "Array of keywords (minimum 3 required)",
        "category": "Select from available categories",
        "authorEmail": "Primary author's email (required)",
        "authorName": "Primary author's full name",
        "status": "Current article status",
        "volume": "Volume number (e.g., 1, 2, 3...)",
        "issue": "Issue number (leave empty for volume-only)",
        "publishedDate": "Use ISO format for published articles"
      }
    }

    return NextResponse.json(template)

  } catch (error) {
    logger.error("Error generating bulk template", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}