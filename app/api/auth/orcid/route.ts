/**
 * ORCID OAuth Initiation Handler
 * Redirects users to ORCID OAuth authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ORCIDService from '@/lib/orcid'
import { logInfo } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=session_required', request.url)
      )
    }

    // Generate state parameter for security
    const state = crypto.randomUUID()

    // Store state in session or database for verification
    // For now, we'll use a simple approach
    const authUrl = ORCIDService.getAuthorizationUrl(state)

    logInfo(`ORCID OAuth initiated for user ${session.user.id}`, {
      userId: session.user.id,
      state
    })

    // Redirect to ORCID authorization
    return NextResponse.redirect(authUrl)

  } catch (error) {
    logger.error('Error initiating ORCID OAuth:', error)
    
    return NextResponse.redirect(
      new URL('/dashboard?error=orcid_init_failed', request.url)
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
