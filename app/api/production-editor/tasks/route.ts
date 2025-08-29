import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissions, users, adminLogs } from '@/lib/db/schema'
import { desc, eq, and, gte } from 'drizzle-orm'

export async function GET() {
  try {
    // Get high priority production tasks
    const urgentDeadlines = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        author: users.firstName,
        authorLastName: users.lastName,
        acceptedAt: submissions.acceptedAt,
        targetIssue: submissions.targetIssue,
        priority: submissions.priority,
        productionStage: submissions.productionStage,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.authorId, users.id))
      .where(and(
        eq(submissions.status, 'in_production'),
        eq(submissions.priority, 'high')
      ))
      .orderBy(desc(submissions.acceptedAt))
      .limit(5)

    // Get recent production activities from admin logs
    const recentActivities = await db
      .select({
        id: adminLogs.id,
        action: adminLogs.action,
        details: adminLogs.details,
        createdAt: adminLogs.createdAt,
        userId: adminLogs.userId,
      })
      .from(adminLogs)
      .where(gte(adminLogs.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) // Last 7 days
      .orderBy(desc(adminLogs.createdAt))
      .limit(10)

    const tasks = [
      // Urgent deadlines
      ...urgentDeadlines.map(task => ({
        id: `deadline_${task.id}`,
        type: 'deadline',
        title: `Production deadline: ${task.title}`,
        description: `Article by ${task.author} ${task.authorLastName} requires immediate attention`,
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: task.acceptedAt ? new Date(task.acceptedAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
        assignedTo: 'Production Team',
        category: 'Production',
        submissionId: task.id,
        currentStage: task.productionStage || 'copyediting',
        targetIssue: task.targetIssue || 'Next Issue'
      })),
      
      // Quality checks needed
      {
        id: 'quality_check_1',
        type: 'quality_check',
        title: 'Quality review for Vol. 1, No. 4',
        description: 'Final quality check needed for upcoming issue',
        priority: 'medium' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Quality Team',
        category: 'Quality Assurance',
        estimatedTime: '4 hours'
      },
      
      // Cover design
      {
        id: 'cover_design_1',
        type: 'design',
        title: 'Cover design for upcoming special issue',
        description: 'Design cover for AI in Healthcare special issue',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Design Team',
        category: 'Design',
        estimatedTime: '8 hours'
      }
    ]

    return NextResponse.json(tasks)
  } catch (error) {
    logger.error('Error fetching production tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
