import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks, submissions, articles, emailLogs, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch recent workflow executions from database
    const [taskExecutions, emailExecutions] = await Promise.all([
      // Recent task executions
      db
        .select({
          id: tasks.id,
          ruleId: tasks.type,
          ruleName: tasks.title,
          submissionId: tasks.relatedId,
          submissionTitle: articles.title,
          executedAt: tasks.completedAt,
          status: tasks.status,
          result: tasks.description
        })
        .from(tasks)
        .leftJoin(submissions, eq(tasks.relatedId, submissions.id))
        .leftJoin(articles, eq(submissions.articleId, articles.id))
        .where(eq(tasks.relatedType, 'submission'))
        .orderBy(desc(tasks.createdAt))
        .limit(20),
      
      // Recent email executions
      db
        .select({
          id: emailLogs.id,
          ruleId: emailLogs.emailType,
          ruleName: sql<string>`CONCAT('Email: ', ${emailLogs.emailType})`,
          submissionId: emailLogs.submissionId,
          submissionTitle: articles.title,
          executedAt: emailLogs.sentAt,
          status: emailLogs.status,
          result: emailLogs.subject
        })
        .from(emailLogs)
        .leftJoin(submissions, eq(emailLogs.submissionId, submissions.id))
        .leftJoin(articles, eq(submissions.articleId, articles.id))
        .orderBy(desc(emailLogs.sentAt))
        .limit(20)
    ])

    // Combine and format executions
    const allExecutions = [
      ...taskExecutions.map(exec => ({
        id: exec.id,
        ruleId: exec.ruleId || 'unknown',
        ruleName: exec.ruleName || 'Task execution',
        submissionId: exec.submissionId,
        submissionTitle: exec.submissionTitle || 'No title',
        executedAt: exec.executedAt?.toISOString() || new Date().toISOString(),
        status: exec.status === 'completed' ? 'success' : 
               exec.status === 'cancelled' ? 'failed' : 'pending',
        result: exec.result || 'No details available'
      })),
      ...emailExecutions.map(exec => ({
        id: exec.id,
        ruleId: exec.ruleId || 'email',
        ruleName: exec.ruleName || 'Email notification',
        submissionId: exec.submissionId,
        submissionTitle: exec.submissionTitle || 'No title',
        executedAt: exec.executedAt?.toISOString() || new Date().toISOString(),
        status: exec.status === 'sent' ? 'success' : 'failed',
        result: exec.result || 'Email sent'
      }))
    ]

    // Sort by execution time and limit to recent executions
    const executions = allExecutions
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, 30)

    return NextResponse.json({
      success: true,
      executions
    })

  } catch (error) {
    console.error('Error fetching workflow executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow executions' },
      { status: 500 }
    )
  }
}