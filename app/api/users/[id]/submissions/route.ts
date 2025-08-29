import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
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

    // Query user's articles with reviewer counts (avoid broken correlated subquery)
    const userSubmissions = await db
      .select({
        id: articles.id,
        title: articles.title,
        category: articles.category,
        status: articles.status,
        submittedDate: articles.submittedDate,
        createdAt: articles.createdAt,
        reviewerCount: count(reviews.id).as("reviewer_count"),
      })
      .from(articles)
      .leftJoin(reviews, eq(reviews.articleId, articles.id))
      .where(eq(articles.authorId, id))
      .groupBy(articles.id)
      .orderBy(desc(articles.submittedDate))

    // Format submissions for frontend
    const formattedSubmissions = userSubmissions.map((submission) => {
      const category = submission.category || "";
      return {
        ...submission,
        reviewers: Number(submission.reviewerCount) || 0,
        comments: 0, // Placeholder - implement when comments system ready
        lastUpdate: submission.createdAt || submission.submittedDate,
        isMedical:
          category.toLowerCase().includes("clinical") || 
          category.toLowerCase().includes("medical") ||
          category.toLowerCase().includes("healthcare"),
      }
    })

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    logError(error as Error, { endpoint: `/api/users/${id}/submissions` })
    return NextResponse.json({ success: false, error: "Failed to fetch submissions" }, { status: 500 })
  }
}
