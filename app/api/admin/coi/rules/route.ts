import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['admin', 'editor-in-chief'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock COI rules data - replace with actual database queries
    const rules = [
      {
        id: "1",
        name: "Financial Conflict Detection",
        description: "Automatically detect mentions of funding or financial relationships",
        type: "automatic",
        criteria: "funding, financial support, grant, sponsored",
        action: "flag",
        isActive: true,
        createdDate: "2024-01-01T00:00:00Z"
      },
      {
        id: "2",
        name: "Author Collaboration Check",
        description: "Flag submissions where reviewer has collaborated with authors",
        type: "automatic",
        criteria: "collaboration history within 3 years",
        action: "block",
        isActive: true,
        createdDate: "2024-01-01T00:00:00Z"
      }
    ]

    return NextResponse.json({
      success: true,
      rules
    })

  } catch (error) {
    console.error('Error fetching COI rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch COI rules' },
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
      createdDate: new Date().toISOString()
    }

    console.log('Creating COI rule:', newRule)

    return NextResponse.json({
      success: true,
      rule: newRule
    })

  } catch (error) {
    console.error('Error creating COI rule:', error)
    return NextResponse.json(
      { error: 'Failed to create COI rule' },
      { status: 500 }
    )
  }
}