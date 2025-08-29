import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationQuerySchema, notificationUpdateSchema } from "@/lib/enhanced-validations"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryData = notificationQuerySchema.parse(Object.fromEntries(searchParams))
    
    const limit = queryData.limit || 10
    const unreadOnly = queryData.unread === "true"
    const type = queryData.type
    const page = queryData.page || 1
    const offset = (page - 1) * limit

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    // Apply filters
    const conditions = [eq(notifications.userId, session.user.id)]
    
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false))
    }
    
    if (type) {
      conditions.push(eq(notifications.type, type))
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions))
    }

    const userNotifications = await query

    // Get total count for pagination
    let countQuery = db
      .select({ count: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))

    if (unreadOnly) {
      countQuery = countQuery.where(and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      ))
    }

    const totalCount = await countQuery

    return NextResponse.json({
      success: true,
      notifications: userNotifications,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid query parameters", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: "/api/notifications" })
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updateData = notificationUpdateSchema.parse(body)
    
    const { notificationId, isRead, markAllAsRead } = updateData

    if (markAllAsRead) {
      // Mark all notifications as read for the user
      await db
        .update(notifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(eq(notifications.userId, session.user.id))

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    }

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: "notificationId is required when not marking all as read" 
      }, { status: 400 })
    }

    // Update specific notification
    const [updatedNotification] = await db
      .update(notifications)
      .set({ 
        isRead: isRead ?? true,
        readAt: isRead !== false ? new Date() : null
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      ))
      .returning()

    if (!updatedNotification) {
      return NextResponse.json({ 
        success: false, 
        error: "Notification not found or unauthorized" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      notification: updatedNotification
    })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: "/api/notifications" })
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      // Delete all notifications for the user
      await db
        .delete(notifications)
        .where(eq(notifications.userId, session.user.id))

      return NextResponse.json({
        success: true,
        message: "All notifications deleted"
      })
    }

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: "notificationId is required when not deleting all" 
      }, { status: 400 })
    }

    // Delete specific notification
    const deletedNotification = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      ))
      .returning()

    if (!deletedNotification.length) {
      return NextResponse.json({ 
        success: false, 
        error: "Notification not found or unauthorized" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/notifications DELETE" })
    return NextResponse.json({ success: false, error: "Failed to delete notification" }, { status: 500 })
  }
}
