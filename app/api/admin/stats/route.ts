import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Analytics } from "@/lib/analytics"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await Analytics.getJournalStats()

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: result.stats.totalUsers,
        totalArticles: result.stats.totalArticles,
        pendingReviews: result.stats.totalReviews,
        publishedThisMonth: result.stats.publishedThisMonth,
        iotPercentage: result.stats.iotPercentage,
        topCategories: result.stats.topCategories,
        monthlySubmissions: result.stats.monthlySubmissions,
      },
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/stats" })
    return NextResponse.json({ success: false, error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
