import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, submissions } from "@/lib/db/schema"
import { desc, eq, ilike, and } from "drizzle-orm"
import { logError, logger } from "@/lib/logger"
import { logAdminAction } from "@/lib/admin-logger"
import { z } from "zod"
import { nanoid } from "nanoid"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Validation schema for article creation (for direct admin uploads)
const createArticleSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  abstract: z.string().optional(), // Optional for direct admin uploads
  content: z.string().optional(),
  keywords: z.array(z.string()).optional(), // Optional for direct admin uploads
  category: z.string().min(1, "Category is required"),
  authorId: z.string().uuid("Valid author ID required").optional(),
  authorName: z.string().min(1, "Author name is required"),
  authorEmail: z.string().email("Valid author email required"),
  coAuthors: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    affiliation: z.string(),
    isCorresponding: z.boolean().default(false)
  })).optional(),
  status: z.enum(["draft", "submitted", "accepted", "published"]).default("submitted"),
  volume: z.string().optional(),
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
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const includeDOI = searchParams.get("include_doi") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    if (search) {
      whereConditions.push(ilike(articles.title, `%${search}%`))
    }
    if (status && status !== "all") {
      whereConditions.push(eq(articles.status, status))
    }

    // Build the complete query
    const baseQuery = db
      .select({
        id: articles.id,
        title: articles.title,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        publishedDate: articles.publishedDate,
        views: articles.views,
        downloads: articles.downloads,
        doi: articles.doi,
        volume: articles.volume,
        issue: articles.issue,
        articleNumber: articles.articleNumber,
        pages: articles.pages,
        author: users.name,
        authorEmail: users.email,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))

    const finalQuery = whereConditions.length > 0 
      ? baseQuery.where(and(...whereConditions))
      : baseQuery

    const articleList = await finalQuery.orderBy(desc(articles.submittedDate)).limit(limit).offset(offset)

    // If DOI info is requested, fetch additional details separately
    let enrichedArticles = articleList
    if (includeDOI) {
      enrichedArticles = articleList.map(article => ({
        ...article,
        coAuthors: [], // Will be filled from database if needed
        abstract: '',
        keywords: []
      }))
    }

    return NextResponse.json({
      success: true,
      articles: enrichedArticles,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/articles" })
    return NextResponse.json({ success: false, error: "Failed to fetch articles" }, { status: 500 })
  }
}

/**
 * POST /api/admin/articles
 * Create a new article directly as admin with file upload support
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

    // Parse FormData for file upload support
    const formData = await request.formData()
    
    // Extract form fields
    const title = formData.get('title') as string
    const abstract = formData.get('abstract') as string || ""
    const content = formData.get('content') as string || ""
    const keywordsStr = formData.get('keywords') as string
    const category = formData.get('category') as string
    const authorName = formData.get('authorName') as string
    const authorEmail = formData.get('authorEmail') as string
    const coAuthorsStr = formData.get('coAuthors') as string
    const status = formData.get('status') as string || "submitted"
    const volume = formData.get('volume') as string
    const issue = formData.get('issue') as string
    const pages = formData.get('pages') as string
    const articleNumber = formData.get('articleNumber') as string
    const doi = formData.get('doi') as string
    const publishedDateStr = formData.get('publishedDate') as string
    const pdfFile = formData.get('pdfFile') as File

    // Parse JSON fields
    let keywords: string[] = []
    let coAuthors: any[] = []
    
    try {
      keywords = keywordsStr ? JSON.parse(keywordsStr) : []
      coAuthors = coAuthorsStr ? JSON.parse(coAuthorsStr) : []
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in keywords or coAuthors" },
        { status: 400 }
      )
    }

    // Validate required fields for direct admin upload
    if (!title || title.length < 10) {
      return NextResponse.json(
        { error: "Title must be at least 10 characters" },
        { status: 400 }
      )
    }

    // Abstract is optional for direct admin uploads
    if (abstract && abstract.length > 0 && abstract.length < 100) {
      return NextResponse.json(
        { error: "If provided, abstract must be at least 100 characters" },
        { status: 400 }
      )
    }

    // Keywords are optional for direct admin uploads
    if (keywords && keywords.length > 0 && keywords.length < 3) {
      return NextResponse.json(
        { error: "If provided, at least 3 keywords are required" },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      )
    }

    if (!authorName) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      )
    }

    if (!authorEmail) {
      return NextResponse.json(
        { error: "Author email is required" },
        { status: 400 }
      )
    }

    if (!pdfFile || pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      )
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (pdfFile.size > maxSize) {
      return NextResponse.json(
        { error: "PDF file must be smaller than 50MB" },
        { status: 400 }
      )
    }

    // Handle file upload
    let fileUrl = ""
    let fileId = ""
    
    if (pdfFile) {
      try {
        fileId = nanoid()
        const fileName = `${fileId}-${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        
        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'articles')
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }
        
        // Save file
        const filePath = join(uploadDir, fileName)
        const bytes = await pdfFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
        
        fileUrl = `/uploads/articles/${fileName}`
        
        logger.info(`File uploaded successfully: ${fileName}`)
      } catch (fileError) {
        logger.error("File upload error", { error: fileError })
        return NextResponse.json(
          { error: "Failed to upload PDF file" },
          { status: 500 }
        )
      }
    }

    // Handle author lookup or creation
    let authorId: string
    const existingAuthor = await db
      .select()
      .from(users)
      .where(eq(users.email, authorEmail))
      .limit(1)

    if (existingAuthor.length > 0) {
      authorId = existingAuthor[0].id
      
      // Update author name if provided and different
      if (authorName && existingAuthor[0].name !== authorName) {
        await db
          .update(users)
          .set({ name: authorName })
          .where(eq(users.id, existingAuthor[0].id))
      }
    } else {
      // Create a basic author record
      const newAuthor = await db
        .insert(users)
        .values({
          email: authorEmail,
          name: authorName || "Author Name Required",
          role: "author",
          isVerified: false,
          isActive: true
        })
        .returning()
      
      authorId = newAuthor[0].id
    }

    // Create the article
    const newArticle = await db.transaction(async (tx) => {
      // Prepare files array
      const files = fileUrl ? [{
        url: fileUrl,
        type: "application/pdf",
        name: pdfFile.name,
        fileId: fileId
      }] : []

      // Insert article
      const article = await tx
        .insert(articles)
        .values({
          title,
          abstract,
          content,
          keywords,
          category,
          status: status as any,
          volume: volume || null,
          issue: issue || null,
          articleNumber: articleNumber ? parseInt(articleNumber) : null,
          pages: pages || null,
          doi: doi || null,
          publishedDate: publishedDateStr ? new Date(publishedDateStr) : null,
          authorId: authorId,
          coAuthors: coAuthors || [],
          files: files,
          metadata: {},
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
        status: status,
        statusHistory: [{
          status: status,
          timestamp: new Date(),
          userId: session.user.id!,
          notes: `Article created directly by admin: ${session.user.email}`
        }] as any,
        submittedAt: new Date()
      }
      
      await tx
        .insert(submissions)
        .values(submissionData)

      return article[0]
    })

    // Log the admin action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'CREATE_ARTICLE',
      resourceType: 'article',
      resourceId: newArticle.id,
      details: `Created article: "${title}" for ${volume ? `Volume ${volume}` : 'the journal'} with PDF upload`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    logger.info("Article created by admin with file upload", {
      articleId: newArticle.id,
      title: title,
      adminId: session.user.id,
      volume: volume,
      fileName: pdfFile.name,
      fileSize: pdfFile.size
    })

    return NextResponse.json({
      success: true,
      article: {
        id: newArticle.id,
        title: newArticle.title,
        status: newArticle.status,
        volume: newArticle.volume,
        issue: newArticle.issue,
        doi: newArticle.doi,
        fileUrl: fileUrl,
        createdAt: newArticle.createdAt
      },
      message: "Article created successfully with PDF uploaded"
    }, { status: 201 })

  } catch (error) {
    logger.error("Error creating article", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
