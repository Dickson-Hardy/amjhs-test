import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issues } from '@/lib/db/schema'
import { gte, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const currentDate = new Date()
    
    const upcomingIssues = await db
      .select({
        id: issues.id,
        volume: issues.volume,
        number: issues.number,
        title: issues.title,
        description: issues.description,
        targetDate: issues.targetDate,
        status: issues.status,
        articleCount: issues.articleCount,
        maxArticles: issues.maxArticles,
        coverDesigned: issues.coverDesigned,
        editorialComplete: issues.editorialComplete,
        productionStatus: issues.productionStatus,
        specialIssue: issues.specialIssue,
        guestEditor: issues.guestEditor,
      })
      .from(issues)
      .where(gte(issues.targetDate, currentDate))
      .orderBy(desc(issues.targetDate))
      .limit(10)

    const formattedIssues = upcomingIssues.map(issue => ({
      id: issue.id,
      volume: issue.volume || 1,
      number: issue.number || 1,
      title: issue.title || `Vol. ${issue.volume}, No. ${issue.number}`,
      description: issue.description || '',
      targetDate: issue.targetDate?.toISOString().split('T')[0] || '',
      status: issue.status || 'planning',
      articleCount: issue.articleCount || 0,
      maxArticles: issue.maxArticles || 12,
      progress: Math.round(((issue.articleCount || 0) / (issue.maxArticles || 12)) * 100),
      coverDesigned: issue.coverDesigned || false,
      editorialComplete: issue.editorialComplete || false,
      productionStatus: issue.productionStatus || 'not_started',
      specialIssue: issue.specialIssue || false,
      guestEditor: issue.guestEditor || null,
      daysUntilDeadline: Math.ceil((new Date(issue.targetDate || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json(formattedIssues)
  } catch (error) {
    logger.error('Error fetching production issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}
