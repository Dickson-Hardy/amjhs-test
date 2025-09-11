import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { conflictQuestionnaires, users, submissions, articles } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch actual COI declarations from database
    const declarations = await db
      .select({
        id: conflictQuestionnaires.id,
        userId: conflictQuestionnaires.userId,
        userName: users.name,
        userEmail: users.email,
        submissionId: conflictQuestionnaires.manuscriptId,
        submissionTitle: articles.title,
        conflictType: conflictQuestionnaires.role,
        description: conflictQuestionnaires.conflictDetails,
        status: conflictQuestionnaires.isCompleted,
        severity: conflictQuestionnaires.hasConflicts,
        reportedDate: conflictQuestionnaires.createdAt,
        reviewedDate: conflictQuestionnaires.completedAt
      })
      .from(conflictQuestionnaires)
      .leftJoin(users, eq(conflictQuestionnaires.userId, users.id))
      .leftJoin(submissions, eq(conflictQuestionnaires.manuscriptId, submissions.id))
      .leftJoin(articles, eq(submissions.articleId, articles.id))
      .orderBy(desc(conflictQuestionnaires.createdAt))
      .limit(50)

    // Format the data for frontend consumption
    const formattedDeclarations = declarations.map(decl => ({
      id: decl.id,
      userId: decl.userId,
      userName: decl.userName || 'Unknown User',
      userEmail: decl.userEmail || '',
      submissionId: decl.submissionId,
      submissionTitle: decl.submissionTitle || 'No Title',
      conflictType: decl.conflictType === 'associate-editor' ? 'editorial' : 'reviewer',
      description: decl.description || 'No details provided',
      status: decl.status ? 'completed' : 'pending',
      severity: decl.severity ? 'high' : 'low',
      reportedDate: decl.reportedDate ? new Date(decl.reportedDate).toISOString() : null,
      reviewedBy: null, // TODO: Add reviewer tracking field
      reviewedDate: decl.reviewedDate ? new Date(decl.reviewedDate).toISOString() : null,
      notes: null // TODO: Add review notes field
    }))

    return NextResponse.json({
      success: true,
      declarations: formattedDeclarations
    })

  } catch (error) {
    console.error('Error fetching COI declarations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch COI declarations' },
      { status: 500 }
    )
  }
}