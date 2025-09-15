import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { canUserAccessManuscript } from "@/lib/workflow"

/**
 * Download manuscript files with role-based permissions
 * Supports access for editorial assistants, associate editors, and other authorized roles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const manuscriptId = params.id

    // Check if user has permission to access this manuscript
    const hasPermission = await canUserAccessManuscript(
      manuscriptId,
      session.user.id,
      session.user.role
    )

    if (!hasPermission) {
      return NextResponse.json({ 
        error: "Access denied - You don't have permission to download this manuscript" 
      }, { status: 403 })
    }

    // Get manuscript/article data
    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        files: articles.files,
        status: articles.status
      })
      .from(articles)
      .where(eq(articles.id, manuscriptId))
      .limit(1)

    if (!article) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 })
    }

    if (!article.files) {
      return NextResponse.json({ error: "No files available for this manuscript" }, { status: 404 })
    }

    // Parse files JSON and get the main manuscript file
    let files
    try {
      files = typeof article.files === 'string' 
        ? JSON.parse(article.files) 
        : article.files
    } catch (error) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 })
    }

    // Find the main manuscript file
    const manuscriptFile = files.find((file: any) => 
      file.type === 'manuscript' || 
      file.type === 'main' ||
      file.name?.toLowerCase().includes('manuscript')
    ) || files[0]

    if (!manuscriptFile) {
      return NextResponse.json({ error: "Manuscript file not found" }, { status: 404 })
    }

    // Return download information
    return NextResponse.json({
      success: true,
      downloadUrl: manuscriptFile.url || `/api/files/${manuscriptFile.id}/download`,
      fileName: manuscriptFile.name || `manuscript-${article.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`,
      fileSize: manuscriptFile.size || 0,
      contentType: manuscriptFile.contentType || 'application/pdf',
      articleTitle: article.title
    })

  } catch (error) {
    logError(error as Error, { 
      endpoint: `/api/manuscripts/${params.id}/download`,
      userId: session?.user?.id 
    })
    return NextResponse.json({ 
      error: "Download failed - Internal server error" 
    }, { status: 500 })
  }
}

/**
 * POST method for handling download requests with additional validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // For now, just redirect to GET method
  return GET(request, { params })
}