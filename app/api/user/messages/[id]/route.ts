import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function DELETE(
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

    // Delete the message (only if user is the recipient)
    await db
      .delete(messages)
      .where(and(
        eq(messages.id, messageId),
        eq(messages.recipientId, session.user.id)
      ))

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully"
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/user/messages/${context.params}` })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete message" 
    }, { status: 500 })
  }
}
