import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks, submissions, reviews, emailLogs } from '@/lib/db/schema'
import { count, eq, gte, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch workflow-related statistics from database
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const [
      totalTasks,
      activeTasks,
      recentSubmissions,
      completedReviews,
      emailsSent,
      pendingTasks
    ] = await Promise.all([
      // Total workflow tasks
      db.select({ count: count() })
        .from(tasks),
      
      // Active/pending tasks
      db.select({ count: count() })
        .from(tasks)
        .where(eq(tasks.status, 'pending')),
      
      // Recent submissions (workflow triggers)
      db.select({ count: count() })
        .from(submissions)
        .where(gte(submissions.createdAt, last30Days)),
      
      // Completed reviews (workflow outcomes)
      db.select({ count: count() })
        .from(reviews)
        .where(eq(reviews.status, 'completed')),
      
      // Email automation executions
      db.select({ count: count() })
        .from(emailLogs)
        .where(gte(emailLogs.sentAt, last30Days)),
      
      // Pending workflow tasks
      db.select({ count: count() })
        .from(tasks)
        .where(eq(tasks.status, 'pending'))
    ])

    // Calculate success rate based on completed vs total tasks
    const totalWorkflowItems = totalTasks[0].count
    const completedItems = totalTasks[0].count - pendingTasks[0].count
    const successRate = totalWorkflowItems > 0 ? (completedItems / totalWorkflowItems) * 100 : 0

    const stats = {
      totalRules: 8, // TODO: Create workflow_rules table
      activeRules: 6, // TODO: Track active rules
      totalExecutions: emailsSent[0].count + completedReviews[0].count,
      successRate: Math.round(successRate * 10) / 10,
      recentExecutions: recentSubmissions[0].count,
      avgExecutionTime: 145 // TODO: Calculate actual execution time
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching workflow stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow statistics' },
      { status: 500 }
    )
  }
}