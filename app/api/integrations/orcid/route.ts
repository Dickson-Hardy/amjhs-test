/**
 * ORCID Management API
 * Handles ORCID profile operations and disconnection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ORCIDService from '@/lib/orcid'
import { logError, logInfo } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'search':
        const query = searchParams.get('q')
        if (!query) {
          return NextResponse.json(
            { error: 'Search query required' },
            { status: 400 }
          )
        }

        const results = await ORCIDService.searchProfiles(query)
        return NextResponse.json({ results })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { context: 'ORCID management GET' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Disconnect ORCID from user account
    await ORCIDService.disconnectORCID(session.user.id)

    logInfo(`ORCID disconnected for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'ORCID account disconnected successfully'
    })

  } catch (error) {
    logError(error as Error, { 
      context: 'ORCID disconnect'
    })
    
    return NextResponse.json(
      { error: 'Failed to disconnect ORCID' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { action, orcidId, accessToken } = await request.json()

    switch (action) {
      case 'sync':
        if (!orcidId || !accessToken) {
          return NextResponse.json(
            { error: 'ORCID ID and access token required' },
            { status: 400 }
          )
        }

        await ORCIDService.syncProfile(session.user.id, orcidId, accessToken)
        
        return NextResponse.json({
          success: true,
          message: 'ORCID profile synced successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logError(error as Error, { context: 'ORCID management POST' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
