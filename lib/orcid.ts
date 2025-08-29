/**
 * ORCID Integration System
 * Provides authentication and profile synchronization with ORCID
 */

import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import { logError, logInfo } from './logger'

// ORCID API configuration
// test: https://sandbox.orcid.org
const ORCID_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.orcid.org' 
  : 'https://api.sandbox.orcid.org'

const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET
const ORCID_REDIRECT_URI = process.env.ORCID_REDIRECT_URI

// process.env.AUTH_TOKEN_PREFIX + ' 'types for ORCID integration
export interface ORCIDProfile {
  orcidId: string
  name: {
    givenNames: string
    familyName: string
    displayName: string
  }
  biography?: string
  emails: ORCIDEmail[]
  affiliations: ORCIDAffiliation[]
  works: ORCIDWork[]
  lastModified: Date
}

export interface ORCIDEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: 'public' | 'limited' | 'private'
}

export interface ORCIDAffiliation {
  organizationName: string
  departmentName?: string
  roleTitle?: string
  type: string
  startDate?: { year: number; month?: number }
  endDate?: { year: number; month?: number }
}

export interface ORCIDWork {
  putCode: string
  title: string
  journal?: string
  type: string
  publicationDate?: { year: number; month?: number }
  doi?: string
  url?: string
  visibility: string
}

export interface ORCIDToken {
  accessToken: string
  tokenType: 'bearer'
  refreshToken?: string
  expiresIn: number
  scope: string
  orcidId: string
}

/**
 * ORCID Integration Service
 */
export class ORCIDService {
  
  /**
   * Generate ORCID OAuth authorization URL
   */
  static getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: ORCID_CLIENT_ID!,
      response_type: 'code',
      scope: '/authenticate /read-limited',
      redirect_uri: ORCID_REDIRECT_URI!,
      ...(state && { state })
    })

    return `${ORCID_API_BASE}/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string): Promise<ORCIDToken> {
    try {
      const response = await fetch(`${ORCID_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ORCID_CLIENT_ID!,
          client_secret: ORCID_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: ORCID_REDIRECT_URI!,
        }),
      })

      if (!response.ok) {
        throw new AppError(`ORCID token exchange failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        orcidId: data.orcid,
      }
    } catch (error) {
      logError(error as Error, { context: 'getAccessToken' })
      throw new AuthorizationError('Failed to get ORCID access token')
    }
  }

  /**
   * Get basic ORCID profile
   */
  static async getProfile(orcidId: string, accessToken: string): Promise<ORCIDProfile> {
    try {
      // Fetch person data
      const personResponse = await this.makeORCIDRequest(`${orcidId}/person`, accessToken)
      const person = await personResponse.json()

      // Build simplified profile object
      const profile: ORCIDProfile = {
        orcidId,
        name: {
          givenNames: person.name?.['given-names']?.value || '',
          familyName: person.name?.['family-name']?.value || '',
          displayName: this.formatDisplayName(person.name)
        },
        biography: person.biography?.content || undefined,
        emails: this.processEmails(person.emails),
        affiliations: [], // Simplified for now
        works: [], // Simplified for now
        lastModified: new Date(person['last-modified-date']?.value || Date.now())
      }

      return profile
    } catch (error) {
      logError(error as Error, { context: 'getProfile', orcidId })
      throw new AppError('Failed to fetch ORCID profile')
    }
  }

  /**
   * Sync ORCID profile with local user data
   */
  static async syncProfile(userId: string, orcidId: string, accessToken: string): Promise<void> {
    try {
      logInfo(`Syncing ORCID profile for user ${userId}`)

      // Get ORCID profile
      const profile = await this.getProfile(orcidId, accessToken)

      // Update user profile with available fields
      await db
        .update(users)
        .set({
          orcid: orcidId,
          orcidVerified: true,
          orcidAccessToken: accessToken,
          orcidProfile: profile,
          orcidLastSync: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))

      logInfo(`ORCID profile synced successfully for user ${userId}`)
    } catch (error) {
      logError(error as Error, { context: 'syncProfile', userId, orcidId })
      throw new AppError('Failed to sync ORCID profile')
    }
  }

  /**
   * Search ORCID profiles
   */
  static async searchProfiles(query: string, start = 0, rows = 10): Promise<unknown> {
    try {
      const response = await fetch(
        `${ORCID_API_BASE}/v3.0/search?q=${encodeURIComponent(query)}&start=${start}&rows=${rows}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new AppError(`ORCID search failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logError(error as Error, { context: 'searchProfiles', query })
      throw new AppError('Failed to search ORCID profiles')
    }
  }

  /**
   * Disconnect ORCID from user account
   */
  static async disconnectORCID(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          orcid: null,
          orcidVerified: false,
          orcidAccessToken: null,
          orcidRefreshToken: null,
          orcidProfile: null,
          orcidLastSync: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))

      logInfo(`ORCID disconnected for user ${userId}`)
    } catch (error) {
      logError(error as Error, { context: 'disconnectORCID', userId })
      throw new AppError('Failed to disconnect ORCID')
    }
  }

  // Private helper methods

  private static async makeORCIDRequest(endpoint: string, accessToken: string): Promise<Response> {
    const response = await fetch(`${ORCID_API_BASE}/v3.0/${endpoint}`, {
      headers: {
        'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new AppError(`ORCID API request failed: ${response.statusText}`)
    }

    return response
  }

  private static processEmails(emailsData: unknown): ORCIDEmail[] {
    if (!emailsData?.email) return []

    return emailsData.email.map((email: unknown) => ({
      email: email.email,
      primary: email.primary || false,
      verified: email.verified || false,
      visibility: email.visibility?.value || 'private',
    }))
  }

  private static formatDisplayName(name: unknown): string {
    const givenNames = name?.['given-names']?.value || ''
    const familyName = name?.['family-name']?.value || ''
    return `${givenNames} ${familyName}`.trim()
  }
}

export default ORCIDService
