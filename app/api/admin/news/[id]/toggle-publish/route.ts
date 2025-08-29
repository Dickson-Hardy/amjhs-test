import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

// PUT - Toggle publish status
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
    const { isPublished } = body

    // Update publish status
    const [updatedNewsItem] = await db.update(news)
      .set({
        isPublished,
        publishedAt: isPublished ? new Date() : null,
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

    logInfo('News item publish status toggled', { 
      newsId: id, 
      isPublished,
      toggledBy: session.user.id 
    })

    return NextResponse.json({
      success: true,
      news: updatedNewsItem
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/news/[id]/toggle-publish' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to toggle publish status" 
    }, { status: 500 })
  }
}
