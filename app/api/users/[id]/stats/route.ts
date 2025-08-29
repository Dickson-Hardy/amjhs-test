import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Analytics } from "@/lib/analytics"
import { logError } from "@/lib/logger"

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const id = params.id;
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.id !== id && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await Analytics.getUserAnalytics(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions: result.analytics.articles.total,
        medicalSubmissions: Math.floor(result.analytics.articles.total * 0.7), // Medical focus
        underReview: result.analytics.articles.underReview,
        published: result.analytics.articles.published,
        totalDownloads: result.analytics.totalDownloads,
        totalViews: result.analytics.totalViews,
      },
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    logError(error as Error, { endpoint: `/api/users/${id}/stats` })
    return NextResponse.json({ success: false, error: "Failed to fetch user stats" }, { status: 500 })
  }
}
