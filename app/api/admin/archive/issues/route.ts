import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { issues, volumes, submissions, articles } from "@/lib/db/schema"
import { desc, eq, count, sql, and } from "drizzle-orm"
import { logAdminAction } from "@/lib/admin-logger"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const volumeId = searchParams.get("volumeId")

    // Build the base query
    const baseQuery = db
      .select({
        id: issues.id,
        number: issues.number,
        title: issues.title,
        volumeId: issues.volumeId,
        description: issues.description,
        coverImage: issues.coverImage,
        isPublished: sql<boolean>`CASE WHEN ${issues.status} = 'published' THEN true ELSE false END`.as('isPublished'),
        publishedDate: issues.publishedDate,
        createdAt: issues.createdAt,
        updatedAt: issues.updatedAt,
        volumeNumber: volumes.number,
        volumeYear: volumes.year
      })
      .from(issues)
      .leftJoin(volumes, eq(issues.volumeId, volumes.id))

    // Apply volumeId filter if provided
    const allIssues = volumeId 
      ? await baseQuery.where(eq(issues.volumeId, volumeId)).orderBy(desc(issues.createdAt))
      : await baseQuery.orderBy(desc(issues.createdAt))

    // Get article count for each issue
    const issuesWithStats = await Promise.all(
      allIssues.map(async (issue) => {
        const articleCount = await db
          .select({ count: count() })
          .from(articles)
          .where(eq(articles.issue, issue.number.toString()))

        return {
          ...issue,
          articleCount: articleCount[0].count
        }
      })
    )

    return NextResponse.json({
      issues: issuesWithStats
    })

  } catch (error) {
    logger.error("Error fetching issues:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { number, title, volumeId, description, coverImage } = await request.json()

    // Validate input
    if (!number || !volumeId) {
      return NextResponse.json(
        { error: "Issue number and volume ID are required" },
        { status: 400 }
      )
    }

    // Check if volume exists
    const volume = await db
      .select()
      .from(volumes)
      .where(eq(volumes.id, volumeId))
      .limit(1)

    if (volume.length === 0) {
      return NextResponse.json(
        { error: "Volume not found" },
        { status: 404 }
      )
    }

    // Check if issue already exists in this volume
    const existingIssue = await db
      .select()
      .from(issues)
      .where(and(eq(issues.volumeId, volumeId), eq(issues.number, number)))
      .limit(1)

    if (existingIssue.length > 0) {
      return NextResponse.json(
        { error: "Issue with this number already exists in this volume" },
        { status: 400 }
      )
    }

    // Create new issue
    const newIssue = await db
      .insert(issues)
      .values({
        number,
        title: title || `Issue ${number}`,
        volumeId,
        description: description || "",
        coverImage: coverImage || "",
        status: "draft"
      })
      .returning()

    // Log the action
    await logAdminAction({
      adminId: session.user.id!,
      adminEmail: session.user.email!,
      action: 'CREATE_ISSUE',
      resourceType: 'issue',
      resourceId: newIssue[0].id,
      details: `Created issue ${number} in volume ${volume[0].number} (${volume[0].year}) - ${title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      issue: newIssue[0],
      message: `Issue ${number} created successfully`
    })

  } catch (error) {
    logger.error("Error creating issue:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
