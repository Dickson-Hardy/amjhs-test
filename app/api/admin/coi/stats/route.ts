import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { conflictQuestionnaires } from '@/lib/db/schema'
import { count, eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch actual COI statistics from database
    const [
      totalDeclarations,
      pendingReview,
      completedDeclarations,
      conflictDeclarations,
      editorialConflicts,
      reviewerConflicts
    ] = await Promise.all([
      // Total declarations
      db.select({ count: count() })
        .from(conflictQuestionnaires),
      
      // Pending review (not completed)
      db.select({ count: count() })
        .from(conflictQuestionnaires)
        .where(eq(conflictQuestionnaires.isCompleted, false)),
      
      // Completed declarations
      db.select({ count: count() })
        .from(conflictQuestionnaires)
        .where(eq(conflictQuestionnaires.isCompleted, true)),
      
      // Declarations with conflicts
      db.select({ count: count() })
        .from(conflictQuestionnaires)
        .where(eq(conflictQuestionnaires.hasConflicts, true)),
      
      // Editorial conflicts
      db.select({ count: count() })
        .from(conflictQuestionnaires)
        .where(and(
          eq(conflictQuestionnaires.role, 'associate-editor'),
          eq(conflictQuestionnaires.hasConflicts, true)
        )),
      
      // Reviewer conflicts
      db.select({ count: count() })
        .from(conflictQuestionnaires)
        .where(and(
          eq(conflictQuestionnaires.role, 'reviewer'),
          eq(conflictQuestionnaires.hasConflicts, true)
        ))
    ])

    const stats = {
      totalDeclarations: totalDeclarations[0].count,
      pendingReview: pendingReview[0].count,
      approvedDeclarations: completedDeclarations[0].count - conflictDeclarations[0].count,
      rejectedDeclarations: conflictDeclarations[0].count,
      criticalCases: editorialConflicts[0].count, // Editorial conflicts are more critical
      autoDetected: 0 // TODO: Implement auto-detection tracking
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching COI stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch COI statistics' },
      { status: 500 }
    )
  }
}