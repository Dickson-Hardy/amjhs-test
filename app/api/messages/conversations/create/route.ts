import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { conversations, users } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { participantIds, subject, type, relatedId, relatedTitle } = await request.json()

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      return NextResponse.json({ error: "At least 2 participants required" }, { status: 400 })
    }

    if (!subject || !type) {
      return NextResponse.json({ error: "Subject and type are required" }, { status: 400 })
    }

    // Verify all participants exist and get their details
    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(inArray(users.id, participantIds))

    if (participants.length !== participantIds.length) {
      return NextResponse.json({ error: "One or more participants not found" }, { status: 400 })
    }

    // Ensure the session user is included in participants
    if (!participantIds.includes(session.user.id)) {
      participantIds.push(session.user.id)
      const sessionUser = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (sessionUser.length > 0) {
        participants.push(sessionUser[0])
      }
    }

    // Create the conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        subject,
        type,
        relatedId,
        relatedTitle,
        participants,
      })
      .returning()

    return NextResponse.json({
      success: true,
      conversation: newConversation,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/messages/conversations POST" })
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 })
  }
}
