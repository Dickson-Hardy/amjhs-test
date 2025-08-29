import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { adminLogs } from "@/lib/db/schema"
import { desc, gte, lte, ilike, and } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const { action, resourceType, resourceId, details } = await request.json()

    // Log the admin action
    await db.insert(adminLogs).values({
      id: nanoid(),
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action,
      resourceType,
      resourceId,
      details: details || '',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      createdAt: new Date()
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error("Error logging admin action:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit
    const action = searchParams.get("action")
    const resourceType = searchParams.get("resourceType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const conditions = []

    // Apply filters
    if (action) {
      conditions.push(ilike(adminLogs.action, `%${action}%`))
    }
    if (resourceType) {
      conditions.push(ilike(adminLogs.resourceType, `%${resourceType}%`))
    }
    if (startDate) {
      conditions.push(gte(adminLogs.createdAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(adminLogs.createdAt, new Date(endDate)))
    }

    const logs = conditions.length > 0 
      ? await db.select().from(adminLogs)
          .where(and(...conditions))
          .orderBy(desc(adminLogs.createdAt))
          .limit(limit)
          .offset(offset)
      : await db.select().from(adminLogs)
          .orderBy(desc(adminLogs.createdAt))
          .limit(limit)
          .offset(offset)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        hasMore: logs.length === limit
      }
    })

  } catch (error) {
    logger.error("Error fetching admin logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
