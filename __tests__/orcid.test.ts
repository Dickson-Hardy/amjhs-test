/**
 * ORCID Integration Tests
 * Comprehensive test suite for ORCID authentication and profile management
 */

import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ORCIDService, type ORCIDProfile, type ORCIDToken } from '@/lib/orcid'
import { sql } from '@vercel/postgres'

// Mock dependencies
vi.mock('@vercel/postgres')
vi.mock('@/lib/logger')

const mockSql = vi.mocked(sql)

// Mock fetch globally
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('ORCIDService', () => {
  const mockToken: ORCIDToken = {
    accessToken: 'mock-access-token',
    tokenType: 'bearer',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    scope: '/authenticate /read-limited /activities/update',
    orcidId: '0000-0000-0000-0001'
  }

  const mockProfile: ORCIDProfile = {
    orcidId: '0000-0000-0000-0001',
    name: {
      givenNames: 'Jane',
      familyName: 'Doe',
      displayName: 'Jane Doe'
    },
    biography: 'Research scientist specializing in climate change.',
    emails: [
      {
        email: 'jane.doe@university.edu',
        primary: true,
        verified: true,
        visibility: 'public'
      }
    ],
    affiliations: [
      {
        organizationName: 'University of Science',
        organizationAddress: {
          city: 'Research City',
          country: 'US'
        },
        roleTitle: 'Professor',
        type: 'employment'
      }
    ],
    works: [
      {
        putCode: '12345',
        title: 'Climate Change Research',
        journal: 'Nature Climate Change',
        type: 'journal-article',
        publicationDate: {
          year: 2023,
          month: 6
        },
        doi: '10.1038/s41558-023-01234-5',
        contributors: [],
        visibility: 'public'
      }
    ],
    education: [],
    employment: [],
    lastModified: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables
    process.env.ORCID_CLIENT_ID = 'test-client-id'
    process.env.ORCID_CLIENT_SECRET = 'test-client-secret'
    process.env.ORCID_REDIRECT_URI = 'http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/auth/orcid/callback'
    
    // Mock successful database operations
    mockSql.mockResolvedValue({
      rows: [{
        id: 'token-123',
        user_id: 'user-456',
        orcid_id: '0000-0000-0000-0001',
        access_token: mockToken.accessToken,
        refresh_token: mockToken.refreshToken,
        expires_at: new Date(Date.now() + 3600000),
        scope: mockToken.scope,
        created_at: new Date(),
        updated_at: new Date()
      }],
      rowCount: 1
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const url = ORCIDService.getAuthorizationUrl('test-state')
      
      expect(url).toContain('oauth/authorize')
      expect(url).toContain('client_id=test-client-id')
      expect(url).toContain('response_type=code')
      expect(url).toContain('state=test-state')
      expect(url).toContain('redirect_uri=')
    })

    it('should work without state parameter', () => {
      const url = ORCIDService.getAuthorizationUrl()
      
      expect(url).toContain('oauth/authorize')
      expect(url).not.toContain('state=')
    })
  })

  describe('getAccessToken', () => {
    it('should exchange authorization code for access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockToken.accessToken,
          token_type: mockToken.tokenType,
          refresh_token: mockToken.refreshToken,
          expires_in: mockToken.expiresIn,
          scope: mockToken.scope,
          orcid: mockToken.orcidId
        })
      } as Response)

      const result = await ORCIDService.getAccessToken('test-code')

      expect(result).toEqual(mockToken)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      )
    })

    it('should handle token exchange errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      } as Response)

      await expect(ORCIDService.getAccessToken('invalid-code'))
        .rejects.toThrow('Failed to get ORCID access token')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(ORCIDService.getAccessToken('test-code'))
        .rejects.toThrow('Failed to get ORCID access token')
    })
  })

  describe('refreshToken', () => {
    it('should refresh expired token', async () => {
      const newToken = { ...mockToken, accessToken: 'new-access-token' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: newToken.accessToken,
          token_type: newToken.tokenType,
          refresh_token: newToken.refreshToken,
          expires_in: newToken.expiresIn,
          scope: newToken.scope,
          orcid: newToken.orcidId
        })
      } as Response)

      const result = await ORCIDService.refreshToken('refresh-token')

      expect(result.accessToken).toBe('new-access-token')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('grant_type=refresh_token')
        })
      )
    })

    it('should handle refresh token errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      } as Response)

      await expect(ORCIDService.refreshToken('invalid-refresh-token'))
        .rejects.toThrow('Failed to refresh ORCID token')
    })
  })

  describe('getProfile', () => {
    beforeEach(() => {
      // Mock ORCID API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            name: {
              'given-names': { value: 'Jane' },
              'family-name': { value: 'Doe' }
            },
            biography: { content: 'Research scientist specializing in climate change.' },
            emails: {
              email: [{
                email: 'jane.doe@university.edu',
                primary: true,
                verified: true,
                visibility: { value: 'public' }
              }]
            },
            'last-modified-date': { value: Date.now() }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            group: [{
              'work-summary': [{
                'put-code': 12345,
                title: { title: { value: 'Climate Change Research' } }
              }]
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'affiliation-group': []
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'affiliation-group': []
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'put-code': 12345,
            title: { title: { value: 'Climate Change Research' } },
            'journal-title': { value: 'Nature Climate Change' },
            type: 'journal-article',
            'publication-date': {
              year: { value: '2023' },
              month: { value: '06' }
            },
            'external-ids': {
              'external-id': [{
                'external-id-type': 'doi',
                'external-id-value': '10.1038/s41558-023-01234-5'
              }]
            },
            visibility: { value: 'public' },
            contributors: { contributor: [] }
          })
        })
    })

    it('should fetch complete ORCID profile', async () => {
      const result = await ORCIDService.getProfile(
        '0000-0000-0000-0001',
        'access-token'
      )

      expect(result.orcidId).toBe('0000-0000-0000-0001')
      expect(result.name.givenNames).toBe('Jane')
      expect(result.name.familyName).toBe('Doe')
      expect(result.name.displayName).toBe('Jane Doe')
      expect(result.emails).toHaveLength(1)
      expect(result.emails[0].email).toBe('jane.doe@university.edu')
      expect(result.works).toHaveLength(1)
      expect(result.works[0].title).toBe('Climate Change Research')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      } as Response)

      await expect(ORCIDService.getProfile('0000-0000-0000-0001', 'invalid-token'))
        .rejects.toThrow('Failed to fetch ORCID profile')
    })
  })

  describe('syncProfile', () => {
    it('should sync ORCID profile with local database', async () => {
      // Mock getProfile
      vi.spyOn(ORCIDService, 'getProfile').mockResolvedValueOnce(mockProfile)

      await ORCIDService.syncProfile(
        'user-456',
        '0000-0000-0000-0001',
        'access-token'
      )

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('UPDATE users SET')
        ])
      )
    })

    it('should handle sync errors', async () => {
      vi.spyOn(ORCIDService, 'getProfile').mockRejectedValueOnce(new Error('API Error'))

      await expect(ORCIDService.syncProfile(
        'user-456',
        '0000-0000-0000-0001',
        'access-token'
      )).rejects.toThrow('Failed to sync ORCID profile')
    })
  })

  describe('addWork', () => {
    it('should add work to ORCID profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['location', '/v3.0/0000-0000-0000-0001/work/12345']])
      } as any)

      const work = {
        title: 'New Research Paper',
        journal: 'Science Journal',
        type: 'journal-article' as const,
        doi: '10.1000/example'
      }

      const putCode = await ORCIDService.addWork(
        '0000-0000-0000-0001',
        'access-token',
        work
      )

      expect(putCode).toBe('12345')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/work'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'process.env.AUTH_TOKEN_PREFIX || "process.env.AUTH_TOKEN_PREFIX || "process.env.AUTH_TOKEN_PREFIX || "Bearer """access-token'
          })
        })
      )
    })

    it('should handle add work errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      } as Response)

      await expect(ORCIDService.addWork(
        '0000-0000-0000-0001',
        'access-token',
        { title: 'Test' }
      )).rejects.toThrow('Failed to add work to ORCID')
    })
  })

  describe('updateWork', () => {
    it('should update existing work in ORCID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response)

      const work = {
        title: 'Updated Research Paper',
        journal: 'Updated Journal',
        type: 'journal-article' as const
      }

      await ORCIDService.updateWork(
        '0000-0000-0000-0001',
        'access-token',
        '12345',
        work
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/work/12345'),
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })
  })

  describe('deleteWork', () => {
    it('should delete work from ORCID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response)

      await ORCIDService.deleteWork(
        '0000-0000-0000-0001',
        'access-token',
        '12345'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/work/12345'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('searchProfiles', () => {
    it('should search ORCID profiles', async () => {
      const mockSearchResults = {
        'num-found': 2,
        result: [
          {
            'orcid-identifier': {
              path: '0000-0000-0000-0001'
            },
            'person-details': {
              name: {
                'given-names': { value: 'Jane' },
                'family-name': { value: 'Doe' }
              }
            }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults
      } as Response)

      const results = await ORCIDService.searchProfiles('Jane Doe')

      expect(results).toEqual(mockSearchResults)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?q=Jane%20Doe'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      )
    })

    it('should handle search pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 'num-found': 0, result: [] })
      } as Response)

      await ORCIDService.searchProfiles('test query', 10, 20)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start=10&rows=20'),
        expect.any(Object)
      )
    })
  })

  describe('Token Management', () => {
    describe('storeToken', () => {
      it('should store token in database', async () => {
        await ORCIDService.storeToken('user-456', mockToken)

        expect(mockSql).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining('INSERT INTO orcid_tokens')
          ])
        )
      })
    })

    describe('getToken', () => {
      it('should retrieve stored token', async () => {
        const result = await ORCIDService.getToken('user-456')

        expect(result).toBeDefined()
        expect(result?.orcidId).toBe('0000-0000-0000-0001')
        expect(result?.accessToken).toBe(mockToken.accessToken)
      })

      it('should return null for non-existent token', async () => {
        mockSql.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

        const result = await ORCIDService.getToken('non-existent-user')

        expect(result).toBeNull()
      })
    })

    describe('ensureValidToken', () => {
      it('should return valid token if not expired', async () => {
        // Mock token that expires in 1 hour
        const futureExpiry = new Date(Date.now() + 3600000)
        mockSql.mockResolvedValueOnce({
          rows: [{
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_at: futureExpiry,
            scope: 'test-scope',
            orcid_id: '0000-0000-0000-0001'
          }],
          rowCount: 1
        } as any)

        const result = await ORCIDService.ensureValidToken('user-456')

        expect(result).toBeDefined()
        expect(result?.accessToken).toBe('valid-token')
      })

      it('should refresh token if expiring soon', async () => {
        // Mock token that expires in 2 minutes
        const soonExpiry = new Date(Date.now() + 120000)
        mockSql
          .mockResolvedValueOnce({
            rows: [{
              access_token: 'expiring-token',
              refresh_token: 'refresh-token',
              expires_at: soonExpiry,
              scope: 'test-scope',
              orcid_id: '0000-0000-0000-0001'
            }],
            rowCount: 1
          } as any)
          .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // Store new token

        // Mock refresh token response
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new-access-token',
            token_type: 'bearer',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
            scope: 'test-scope',
            orcid: '0000-0000-0000-0001'
          })
        } as Response)

        const result = await ORCIDService.ensureValidToken('user-456')

        expect(result?.accessToken).toBe('new-access-token')
      })

      it('should return null if refresh fails', async () => {
        const soonExpiry = new Date(Date.now() + 120000)
        mockSql.mockResolvedValueOnce({
          rows: [{
            access_token: 'expiring-token',
            refresh_token: 'refresh-token',
            expires_at: soonExpiry,
            scope: 'test-scope',
            orcid_id: '0000-0000-0000-0001'
          }],
          rowCount: 1
        } as any)

        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Invalid refresh token'
        } as Response)

        const result = await ORCIDService.ensureValidToken('user-456')

        expect(result).toBeNull()
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete ORCID workflow', async () => {
      // 1. Get authorization URL
      const authUrl = ORCIDService.getAuthorizationUrl('test-state')
      expect(authUrl).toContain('oauth/authorize')

      // 2. Exchange code for token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockToken.accessToken,
          token_type: mockToken.tokenType,
          refresh_token: mockToken.refreshToken,
          expires_in: mockToken.expiresIn,
          scope: mockToken.scope,
          orcid: mockToken.orcidId
        })
      } as Response)

      const token = await ORCIDService.getAccessToken('auth-code')
      expect(token).toEqual(mockToken)

      // 3. Store token
      await ORCIDService.storeToken('user-456', token)
      expect(mockSql).toHaveBeenCalled()

      // 4. Get and sync profile
      vi.spyOn(ORCIDService, 'getProfile').mockResolvedValueOnce(mockProfile)
      await ORCIDService.syncProfile('user-456', token.orcidId, token.accessToken)
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('UPDATE users SET')
        ])
      )
    })
  })
})
