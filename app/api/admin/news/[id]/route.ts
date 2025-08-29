import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

// PUT - Update news item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, excerpt, type, category, authorName, isPublished, tags } = body

    // Validate required fields
    if (!title || !content || !excerpt) {
      return NextResponse.json({
        success: false,
        error: "Title, content, and excerpt are required"
      }, { status: 400 })
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)

    // Update news item
    const [updatedNewsItem] = await db.update(news)
      .set({
        title,
        content,
        excerpt,
        type: type || 'announcement',
        category: category || '',
        authorName: authorName || 'Editorial Team',
        publishedAt: isPublished ? new Date() : null,
        isPublished: isPublished || false,
        slug,
        tags: tags || [],
        updatedAt: new Date()
      })
      .where(eq(news.id, id))
      .returning()

    if (!updatedNewsItem) {
      return NextResponse.json({
        success: false,
        error: "News item not found"
      }, { status: 404 })
    }

    logInfo('News item updated', { 
      newsId: id, 
      title, 
      type,
      updatedBy: session.user.id 
    })

    return NextResponse.json({
      success: true,
      news: updatedNewsItem
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/news/[id] PUT' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update news item" 
    }, { status: 500 })
  }
}

// DELETE - Delete news item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Check if news item exists
    const [existingItem] = await db.select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1)

    if (!existingItem) {
      return NextResponse.json({
        success: false,
        error: "News item not found"
      }, { status: 404 })
    }

    // Delete news item
    await db.delete(news).where(eq(news.id, id))

    logInfo('News item deleted', { 
      newsId: id, 
      title: existingItem.title,
      deletedBy: session.user.id 
    })

    return NextResponse.json({
      success: true,
      message: "News item deleted successfully"
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/news/[id] DELETE' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete news item" 
    }, { status: 500 })
  }
}
