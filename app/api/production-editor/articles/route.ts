import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, users } from '@/lib/db/schema'
import { eq, desc, or } from 'drizzle-orm'

export async function GET() {
  try {
    const productionArticles = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        author: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
        status: submissions.status,
        priority: submissions.priority,
        submittedAt: submissions.createdAt,
        acceptedAt: submissions.acceptedAt,
        productionStage: submissions.productionStage,
        targetIssue: submissions.targetIssue,
        estimatedPages: submissions.estimatedPages,
        notes: submissions.productionNotes,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(or(
        eq(submissions.status, 'accepted'),
        eq(submissions.status, 'in_production'),
        eq(submissions.status, 'copyediting'),
        eq(submissions.status, 'layout'),
        eq(submissions.status, 'proofreading')
      ))
      .orderBy(desc(submissions.acceptedAt))

    const formattedArticles = productionArticles.map(article => ({
      id: article.id,
      title: article.title,
      author: `${article.author} ${article.authorLastName}`,
      authorEmail: article.authorEmail,
      status: article.status,
      priority: article.priority || 'medium',
      submittedDate: article.submittedAt?.toISOString().split('T')[0] || '',
      acceptedDate: article.acceptedAt?.toISOString().split('T')[0] || '',
      productionStage: article.productionStage || 'copyediting',
      targetIssue: article.targetIssue || 'Vol. 1, No. 4',
      estimatedPages: article.estimatedPages || 8,
      daysInProduction: article.acceptedAt 
        ? Math.floor((Date.now() - new Date(article.acceptedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      notes: article.notes || ''
    }))

    return NextResponse.json(formattedArticles)
  } catch (error) {
    logger.error('Error fetching production articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
