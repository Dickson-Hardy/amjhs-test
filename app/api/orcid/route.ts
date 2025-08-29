/**
 * ORCID Integration API Route
 * Handles ORCID authentication and profile synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ORCIDService } from '@/lib/orcid'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'auth-url':
        return handleGetAuthUrl(searchParams)
      case 'callback':
        return handleCallback(searchParams)
      case 'profile':
        return handleGetProfile(request)
      case 'search':
        return handleSearch(searchParams)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Error in ORCID API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'sync':
        return handleSyncProfile(session.user.id, body)
      case 'add-work':
        return handleAddWork(session.user.id, body)
      case 'update-work':
        return handleUpdateWork(session.user.id, body)
      case 'delete-work':
        return handleDeleteWork(session.user.id, body)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Error in ORCID API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGetAuthUrl(searchParams: URLSearchParams) {
  const state = searchParams.get('state')
  const authUrl = ORCIDService.getAuthorizationUrl(state || undefined)
  
  return NextResponse.json({
    success: true,
    authUrl
  })
}

async function handleCallback(searchParams: URLSearchParams) {
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code is required' },
      { status: 400 }
    )
  }

  try {
    const token = await ORCIDService.getAccessToken(code)
    
    return NextResponse.json({
      success: true,
      token,
      state
    })
  } catch (error) {
    logger.error('ORCID callback error:', error)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code' },
      { status: 400 }
    )
  }
}

async function handleGetProfile(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const orcidId = searchParams.get('orcidId')

  if (!orcidId) {
    return NextResponse.json(
      { error: 'ORCID ID is required' },
      { status: 400 }
    )
  }

  try {
    const token = await ORCIDService.ensureValidToken(session.user.id)
    
    if (!token) {
      return NextResponse.json(
        { error: 'ORCID authentication required' },
        { status: 401 }
      )
    }

    const profile = await ORCIDService.getProfile(orcidId, token.accessToken)
    
    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    logger.error('Get ORCID profile error:', error)
    return NextResponse.json(
      { error: 'Failed to get ORCID profile' },
      { status: 500 }
    )
  }
}

async function handleSearch(searchParams: URLSearchParams) {
  const query = searchParams.get('q')
  const start = parseInt(searchParams.get('start') || '0')
  const rows = parseInt(searchParams.get('rows') || '10')

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    const results = await ORCIDService.searchProfiles(query, start, rows)
    
    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    logger.error('ORCID search error:', error)
    return NextResponse.json(
      { error: 'Failed to search ORCID profiles' },
      { status: 500 }
    )
  }
}

async function handleSyncProfile(userId: string, body: unknown) {
  const { orcidId, accessToken } = body as { orcidId: string; accessToken: string }

  if (!orcidId || !accessToken) {
    return NextResponse.json(
      { error: 'ORCID ID and access token are required' },
      { status: 400 }
    )
  }

  try {
    await ORCIDService.syncProfile(userId, orcidId, accessToken)
    
    return NextResponse.json({
      success: true,
      message: 'Profile synchronized successfully'
    })
  } catch (error) {
    logger.error('Sync ORCID profile error:', error)
    return NextResponse.json(
      { error: 'Failed to sync ORCID profile' },
      { status: 500 }
    )
  }
}

async function handleAddWork(userId: string, body: unknown) {
  const { work } = body

  if (!work) {
    return NextResponse.json(
      { error: 'Work data is required' },
      { status: 400 }
    )
  }

  try {
    const token = await ORCIDService.ensureValidToken(userId)
    
    if (!token) {
      return NextResponse.json(
        { error: 'ORCID authentication required' },
        { status: 401 }
      )
    }

    const putCode = await ORCIDService.addWork(token.orcidId, token.accessToken, work)
    
    return NextResponse.json({
      success: true,
      putCode
    })
  } catch (error) {
    logger.error('Add ORCID work error:', error)
    return NextResponse.json(
      { error: 'Failed to add work to ORCID' },
      { status: 500 }
    )
  }
}

async function handleUpdateWork(userId: string, body: unknown) {
  const { putCode, work } = body

  if (!putCode || !work) {
    return NextResponse.json(
      { error: 'Put code and work data are required' },
      { status: 400 }
    )
  }

  try {
    const token = await ORCIDService.ensureValidToken(userId)
    
    if (!token) {
      return NextResponse.json(
        { error: 'ORCID authentication required' },
        { status: 401 }
      )
    }

    await ORCIDService.updateWork(token.orcidId, token.accessToken, putCode, work)
    
    return NextResponse.json({
      success: true,
      message: 'Work updated successfully'
    })
  } catch (error) {
    logger.error('Update ORCID work error:', error)
    return NextResponse.json(
      { error: 'Failed to update work in ORCID' },
      { status: 500 }
    )
  }
}

async function handleDeleteWork(userId: string, body: unknown) {
  const { putCode } = body

  if (!putCode) {
    return NextResponse.json(
      { error: 'Put code is required' },
      { status: 400 }
    )
  }

  try {
    const token = await ORCIDService.ensureValidToken(userId)
    
    if (!token) {
      return NextResponse.json(
        { error: 'ORCID authentication required' },
        { status: 401 }
      )
    }

    await ORCIDService.deleteWork(token.orcidId, token.accessToken, putCode)
    
    return NextResponse.json({
      success: true,
      message: 'Work deleted successfully'
    })
  } catch (error) {
    logger.error('Delete ORCID work error:', error)
    return NextResponse.json(
      { error: 'Failed to delete work from ORCID' },
      { status: 500 }
    )
  }
}
