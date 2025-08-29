import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const articleId = params.id

    // Verify article exists and get details before deletion
    const article = await getArticleById(articleId)
    
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    // Delete article from database
    await deleteArticleById(articleId)
    
    // Log the deletion action
    await logArticleDeletion(session.user?.email || '', articleId, article.title)
    
    return NextResponse.json({
      success: true,
      message: "Article deleted successfully"
    })
    
  } catch (error) {
    logger.error("Error deleting article:", error)
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    )
  }
}

async function getArticleById(articleId: string) {
  try {
    // Fetch from database with author information
    const [article] = await db.select({
      id: articles.id,
      title: articles.title,
      abstract: articles.abstract,
      content: articles.content,
      keywords: articles.keywords,
      category: articles.category,
      status: articles.status,
      doi: articles.doi,
      volume: articles.volume,
      issue: articles.issue,
      pages: articles.pages,
      publishedDate: articles.publishedDate,
      submittedDate: articles.submittedDate,
      views: articles.views,
      downloads: articles.downloads,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      // Author information
      authorName: users.name,
      authorEmail: users.email,
      authorAffiliation: users.affiliation
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.id, articleId))

    return article || null
  } catch (error) {
    logger.error('Error fetching article:', error)
    return null
  }
}

async function deleteArticleById(articleId: string) {
  try {
    // Delete from database (cascade deletes should handle related records)
    const [deletedArticle] = await db.delete(articles)
      .where(eq(articles.id, articleId))
      .returning()

    if (!deletedArticle) {
      throw new NotFoundError('Article not found')
    }

    logger.error(`Article ${articleId} deleted from database`)
    return deletedArticle
  } catch (error) {
    logger.error('Error deleting article from database:', error)
    throw new AppError('Failed to delete article from database')
  }
}

async function logArticleDeletion(adminEmail: string, articleId: string, articleTitle: string) {
  try {
    // In a real implementation, log the action:
    // await prisma.adminLog.create({
    //   data: {
    //     action: 'ARTICLE_DELETED',
    //     performedBy: adminEmail,
    //     details: `Deleted article: "${articleTitle}" (ID: ${articleId})`,
    //     relatedId: articleId,
    //     timestamp: new Date()
    //   }
    // })
    
    logger.error(`Article deletion logged by ${adminEmail}: "${articleTitle}" (${articleId})`)
  } catch (error) {
    logger.error('Error logging article deletion:', error)
  }
}
