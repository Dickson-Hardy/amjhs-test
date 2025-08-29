/**
 * ORCID OAuth Callback Handler
 * Handles the OAuth flow completion and profile synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ORCIDService from '@/lib/orcid'
import { logError, logInfo } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      logError(new Error(`ORCID OAuth error: ${error}`), { 
        error, 
        description: searchParams.get('error_description') 
      })
      
      return NextResponse.redirect(
        new URL('/dashboard?error=orcid_auth_failed', request.url)
      )
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_code', request.url)
      )
    }

    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=session_required', request.url)
      )
    }

    try {
      // Exchange code for access token
      const tokenData = await ORCIDService.getAccessToken(code)
      
      // Sync ORCID profile with user account
      await ORCIDService.syncProfile(
        session.user.id,
        tokenData.orcidId,
        tokenData.accessToken
      )

      logInfo(`ORCID linked successfully for user ${session.user.id}`, {
        orcidId: tokenData.orcidId,
        userId: session.user.id
      })

      // Redirect to dashboard with success message
      return NextResponse.redirect(
        new URL('/dashboard?success=orcid_linked', request.url)
      )

    } catch (tokenError) {
      logError(tokenError as Error, { 
        context: 'ORCID token exchange',
        userId: session.user.id 
      })
      
      return NextResponse.redirect(
        new URL('/dashboard?error=orcid_link_failed', request.url)
      )
    }

  } catch (error) {
    logError(error as Error, { context: 'ORCID OAuth callback' })
    
    return NextResponse.redirect(
      new URL('/dashboard?error=unexpected_error', request.url)
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
