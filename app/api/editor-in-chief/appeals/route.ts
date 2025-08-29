import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users } from "@/lib/db/schema"
import { sql, eq, desc, and, inArray } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only editor-in-chief and admin can access this
    if (!session?.user || !["editor-in-chief", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // For now, we'll identify appeals as submissions that:
    // 1. Were rejected but author has submitted revision_requested
    // 2. Have appeal_pending status (if implemented)
    // 3. Have been in review for unusually long time with conflicts

    let whereConditions = []
    
    if (status === 'pending') {
      whereConditions.push(
        sql`(
          status = 'appeal_pending' OR
          (status = 'revision_requested' AND 
           EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 > 30) OR
          (status = 'rejected' AND 
           EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 <= 30)
        )`
      )
    } else if (status === 'under_review') {
      whereConditions.push(eq(articles.status, 'under_review'))
    } else if (status === 'resolved') {
      whereConditions.push(
        sql`status IN ('accepted', 'published') AND 
            EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 <= 60`
      )
    }

    // Get potential appeals
    const appeals = await db
      .select({
        id: articles.id,
        title: articles.title,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        updatedAt: articles.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        daysSinceUpdate: sql<number>`
          EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400
        `,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(articles.updatedAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...whereConditions))

    const totalCount = totalCountResult[0]?.count || 0

    // Process appeals and determine types/urgency
    const processedAppeals = appeals.map((appeal) => {
      const daysSinceUpdate = appeal.daysSinceUpdate || 0
      
      // Determine appeal type
      let appealType: 'decision' | 'reviewer' | 'process' = 'decision'
      let urgency: 'high' | 'medium' | 'low' = 'medium'
      
      if (appeal.status === 'rejected') {
        appealType = 'decision'
        urgency = daysSinceUpdate < 7 ? 'high' : 'medium'
      } else if (appeal.status === 'revision_requested' && daysSinceUpdate > 30) {
        appealType = 'process'
        urgency = 'high'
      } else if (appeal.status === 'under_review' && daysSinceUpdate > 45) {
        appealType = 'reviewer'
        urgency = 'high'
      }

      return {
        id: appeal.id,
        submissionId: appeal.id,
        submissionTitle: appeal.title,
        author: appeal.author?.name || 'Unknown Author',
        appealType,
        status: status as 'pending' | 'under_review' | 'resolved',
        submittedDate: appeal.updatedAt?.toISOString() || appeal.submittedDate?.toISOString() || '',
        urgency,
        daysSinceUpdate: Math.floor(daysSinceUpdate),
        originalStatus: appeal.status,
        authorEmail: appeal.author?.email,
        section: appeal.category,
      }
    })

    // Get appeal statistics
    const appealStats = {
      total: totalCount,
      pending: status === 'pending' ? processedAppeals.length : 0,
      highUrgency: processedAppeals.filter(a => a.urgency === 'high').length,
      avgResolutionTime: 0, // Would need historical data to calculate
    }

    return NextResponse.json({
      success: true,
      appeals: processedAppeals,
      stats: appealStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/editor-in-chief/appeals` })
    return NextResponse.json({ success: false, error: "Failed to fetch appeals" }, { status: 500 })
  }
}
