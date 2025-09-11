import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock workflow rules data - replace with actual database queries
    const rules = [
      {
        id: "1",
        name: "Auto-assign reviewers for cardiology papers",
        description: "Automatically assign reviewers from cardiology specialty when submission category is cardiovascular",
        trigger: {
          type: "submission_status",
          condition: "equals",
          value: "submitted"
        },
        actions: [
          {
            type: "assign_reviewer",
            config: {
              specialty: "cardiology",
              count: 2,
              criteria: "expertise_match"
            }
          }
        ],
        isActive: true,
        executionCount: 23,
        lastExecuted: "2024-01-15T14:30:00Z",
        createdDate: "2024-01-01T00:00:00Z"
      },
      {
        id: "2",
        name: "Reminder for overdue reviews",
        description: "Send reminder emails to reviewers 3 days before deadline",
        trigger: {
          type: "deadline_approaching",
          condition: "equals",
          value: "3"
        },
        actions: [
          {
            type: "send_email",
            config: {
              template: "review_reminder",
              recipient: "reviewer"
            }
          }
        ],
        isActive: true,
        executionCount: 156,
        lastExecuted: "2024-01-16T09:15:00Z",
        createdDate: "2024-01-01T00:00:00Z"
      }
    ]

    return NextResponse.json({
      success: true,
      rules
    })

  } catch (error) {
    console.error('Error fetching workflow rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ruleData = await request.json()

    // Mock rule creation - replace with actual database insert
    const newRule = {
      id: Date.now().toString(),
      ...ruleData,
      executionCount: 0,
      lastExecuted: null,
      createdDate: new Date().toISOString()
    }

    console.log('Creating workflow rule:', newRule)

    return NextResponse.json({
      success: true,
      rule: newRule
    })

  } catch (error) {
    console.error('Error creating workflow rule:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow rule' },
      { status: 500 }
    )
  }
}