import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { fixMessagingSchema } from "@/lib/migrate-messaging"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await fixMessagingSchema()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Messaging schema migration completed successfully" 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Migration failed" 
    }, { status: 500 })
  }
}