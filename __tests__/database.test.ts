import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserService } from '../lib/database'
import { db } from '../lib/db'
import { users, notifications } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

// Mock the database
vi.mock('../lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock the cache
vi.mock('../lib/cache', () => ({
  CacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }
}))

const mockDb = vi.mocked(db)

describe('Database Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UserService', () => {
    describe('getUserByEmail', () => {
      it('should return user when found', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          verified: true,
          name: 'Test User',
          role: 'author'
        }

        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser])
            })
          })
        })

        const result = await UserService.getUserByEmail('test@example.com')
        
        expect(result).toEqual(mockUser)
        expect(mockDb.select).toHaveBeenCalled()
      })

      it('should return null when user not found', async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })

        const result = await UserService.getUserByEmail('nonexistent@example.com')
        
        expect(result).toBeNull()
      })

      it('should handle database errors gracefully', async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })

        const result = await UserService.getUserByEmail('test@example.com')
        
        expect(result).toBeNull()
      })
    })

    describe('createUser', () => {
      it('should create user successfully', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'new@example.com',
          name: 'New User'
        }

        mockDb.insert.mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUser])
          })
        })

        const result = await UserService.createUser(
          'new@example.com',
          'hashed-password',
          'New User'
        )
        
        expect(result).toEqual(mockUser)
        expect(mockDb.insert).toHaveBeenCalledWith(users)
      })

      it('should handle creation errors', async () => {
        mockDb.insert.mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })

        const result = await UserService.createUser(
          'new@example.com',
          'hashed-password',
          'New User'
        )
        
        expect(result).toBeNull()
      })
    })

    describe('verifyUser', () => {
      it('should verify user with valid token', async () => {
        const mockUser = {
          id: 'user-123',
          emailVerificationToken: 'valid-token'
        }

        // Mock select for finding user
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser])
            })
          })
        })

        // Mock update for verification
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
          })
        })

        const result = await UserService.verifyUser('test@example.com', 'valid-token')
        
        expect(result).toBe(true)
        expect(mockDb.update).toHaveBeenCalledWith(users)
      })

      it('should fail with invalid token', async () => {
        const mockUser = {
          id: 'user-123',
          emailVerificationToken: 'different-token'
        }

        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser])
            })
          })
        })

        const result = await UserService.verifyUser('test@example.com', 'invalid-token')
        
        expect(result).toBe(false)
      })
    })

    describe('saveVerificationToken', () => {
      it('should save token successfully', async () => {
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
          })
        })

        const result = await UserService.saveVerificationToken('user-123', 'token-123')
        
        expect(result).toBe(true)
        expect(mockDb.update).toHaveBeenCalledWith(users)
      })

      it('should handle save errors', async () => {
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })

        const result = await UserService.saveVerificationToken('user-123', 'token-123')
        
        expect(result).toBe(false)
      })
    })

    describe('updateUserProfile', () => {
      it('should update profile successfully', async () => {
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
          })
        })

        const updates = {
          name: 'Updated Name',
          affiliation: 'New University',
          bio: 'Updated bio'
        }

        const result = await UserService.updateUserProfile('user-123', updates)
        
        expect(result).toBe(true)
        expect(mockDb.update).toHaveBeenCalledWith(users)
      })
    })

    describe('userExists', () => {
      it('should return true when user exists', async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'user-123' }])
            })
          })
        })

        const result = await UserService.userExists('test@example.com')
        
        expect(result).toBe(true)
      })

      it('should return false when user does not exist', async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })

        const result = await UserService.userExists('nonexistent@example.com')
        
        expect(result).toBe(false)
      })
    })

    describe('createNotification', () => {
      it('should create notification successfully', async () => {
        mockDb.insert.mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined)
        })

        const result = await UserService.createNotification(
          'user-123',
          'Test Title',
          'Test Message',
          'system'
        )
        
        expect(result).toBe(true)
        expect(mockDb.insert).toHaveBeenCalledWith(notifications)
      })
    })

    describe('resetPassword', () => {
      it('should reset password with valid token', async () => {
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'user-123',
                email: 'test@example.com'
              }])
            })
          })
        })

        const result = await UserService.resetPassword('valid-token', 'newpassword123')
        
        expect(result).toBe(true)
        expect(mockDb.update).toHaveBeenCalledWith(users)
      })

      it('should fail with invalid token', async () => {
        mockDb.update.mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([])
            })
          })
        })

        const result = await UserService.resetPassword('invalid-token', 'newpassword123')
        
        expect(result).toBe(false)
      })
    })

    describe('getUserStats', () => {
      it('should return user statistics', async () => {
        // Mock getUserById
        UserService.getUserById = vi.fn().mockResolvedValue({
          id: 'user-123',
          verified: true
        })

        const result = await UserService.getUserStats('user-123')
        
        expect(result).toEqual({
          submissionsCount: 0,
          reviewsCount: 0,
          publicationsCount: 0,
          profileCompleteness: 60
        })
      })

      it('should handle unverified users', async () => {
        UserService.getUserById = vi.fn().mockResolvedValue({
          id: 'user-123',
          verified: false
        })

        const result = await UserService.getUserStats('user-123')
        
        expect(result.profileCompleteness).toBe(20)
      })
    })
  })

  describe('Cache Integration', () => {
    it('should use cache for user lookups', async () => {
      const { CacheManager } = await import('../lib/cache')
      const mockCacheManager = vi.mocked(CacheManager)
      
      const cachedUser = {
        id: 'user-123',
        email: 'cached@example.com',
        verified: true
      }

      mockCacheManager.get.mockResolvedValue(cachedUser)

      const result = await UserService.getUserByEmail('cached@example.com')
      
      expect(result).toEqual(cachedUser)
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:email:cached@example.com')
      expect(mockDb.select).not.toHaveBeenCalled()
    })

    it('should invalidate cache on user updates', async () => {
      const { CacheManager } = await import('../lib/cache')
      const mockCacheManager = vi.mocked(CacheManager)
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      })

      await UserService.updateUserProfile('user-123', { name: 'Updated Name' })
      
      expect(mockCacheManager.del).toHaveBeenCalledWith('user:id:user-123')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await UserService.getUserByEmail('test@example.com')
      
      expect(result).toBeNull()
    })

    it('should handle constraint violations', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Unique constraint violation'))
        })
      })

      const result = await UserService.createUser(
        'duplicate@example.com',
        'password',
        'Test User'
      )
      
      expect(result).toBeNull()
    })
  })
})
