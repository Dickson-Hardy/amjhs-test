import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const messageId = params.id

    // Update message status to read
    await db
      .update(messages)
      .set({
        status: 'read',
        updatedAt: new Date()
      })
      .where(and(
        eq(messages.id, messageId),
        eq(messages.recipientId, session.user.id)
      ))

    return NextResponse.json({
      success: true,
      message: "Message marked as read"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/messages/${context.params}/read` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to mark message as read" 
    }, { status: 500 })
  }
}
