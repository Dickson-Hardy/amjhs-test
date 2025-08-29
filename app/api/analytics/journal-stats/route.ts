import { NextRequest, NextResponse } from "next/server"
import { Analytics } from "@/lib/analytics"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin or editor
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await Analytics.getJournalStats()
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Failed to fetch journal statistics" 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      stats: result.stats
    })
  } catch (error) {
    logger.error("Analytics API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch journal statistics" },
      { status: 500 }
    )
  }
}
