import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signup, verifyEmail, requestPasswordReset, resetPassword, getUserProfile } from '../lib/auth'
import { UserService } from '../lib/database'

// Mock dependencies
vi.mock('../lib/database')
vi.mock('../lib/email')
vi.mock('bcryptjs')
vi.mock('uuid')

const mockUserService = vi.mocked(UserService)

describe('Auth Functions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signup', () => {
    it('should create user successfully with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }

      // Mock getUserByEmail to return null (user doesn't exist)
      mockUserService.getUserByEmail = vi.fn().mockResolvedValue(null)
      mockUserService.createUser = vi.fn().mockResolvedValue(mockUser)
      mockUserService.saveVerificationToken = vi.fn().mockResolvedValue(true)

      // Mock bcrypt
      const bcrypt = await import('bcryptjs')
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password')

      // Mock uuid
      const { v4: uuidv4 } = await import('uuid')
      vi.mocked(uuidv4).mockReturnValue('verification-token')

      const result = await signup('test@example.com', 'password123', 'Test User')

      expect(result).toEqual({
        success: true,
        message: 'User created. Please verify your email.'
      })
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        'test@example.com',
        'hashed-password',
        'Test User'
      )
    })

    it('should fail with missing required fields', async () => {
      const result = await signup('', 'password123', 'Test User')

      expect(result).toEqual({
        success: false,
        message: 'Please provide an email, password, and name.'
      })
    })

    it('should fail with invalid email format', async () => {
      const result = await signup('invalid-email', 'password123', 'Test User')

      expect(result).toEqual({
        success: false,
        message: 'Please provide a valid email address.'
      })
    })

    it('should fail with weak password', async () => {
      const result = await signup('test@example.com', '123', 'Test User')

      expect(result).toEqual({
        success: false,
        message: 'Password must be at least 8 characters long.'
      })
    })

    it('should fail when user already exists', async () => {
      mockUserService.getUserByEmail = vi.fn().mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
        password: 'password',
        verified: true,
        name: 'Existing User',
        role: 'author'
      })

      const result = await signup('test@example.com', 'password123', 'Test User')

      expect(result).toEqual({
        success: false,
        message: 'Email already in use.'
      })
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      mockUserService.verifyUser = vi.fn().mockResolvedValue(true)

      const result = await verifyEmail('test@example.com', 'valid-token')

      expect(result).toEqual({
        success: true,
        message: 'Email verified successfully!'
      })
      expect(mockUserService.verifyUser).toHaveBeenCalledWith('test@example.com', 'valid-token')
    })

    it('should fail with invalid token', async () => {
      mockUserService.verifyUser = vi.fn().mockResolvedValue(false)

      const result = await verifyEmail('test@example.com', 'invalid-token')

      expect(result).toEqual({
        success: false,
        message: 'Invalid or expired verification token.'
      })
    })

    it('should handle verification errors', async () => {
      mockUserService.verifyUser = vi.fn().mockRejectedValue(new Error('Database error'))

      const result = await verifyEmail('test@example.com', 'token')

      expect(result).toEqual({
        success: false,
        message: 'Email verification failed.'
      })
    })
  })

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password',
        verified: true,
        name: 'Test User',
        role: 'author'
      }

      // Mock auth module's getUserByEmail function
      const authModule = await import('../lib/auth')
      vi.spyOn(authModule as any, 'getUserByEmail').mockResolvedValue(mockUser)
      
      mockUserService.savePasswordResetToken = vi.fn().mockResolvedValue(true)

      // Mock email service
      const emailModule = await import('../lib/email')
      vi.spyOn(emailModule, 'sendPasswordReset').mockResolvedValue()

      const result = await requestPasswordReset('test@example.com')

      expect(result).toEqual({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    })

    it('should not reveal if user does not exist', async () => {
      // Mock auth module's getUserByEmail function
      const authModule = await import('../lib/auth')
      vi.spyOn(authModule as any, 'getUserByEmail').mockResolvedValue(null)

      const result = await requestPasswordReset('nonexistent@example.com')

      expect(result).toEqual({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      mockUserService.resetPassword = vi.fn().mockResolvedValue(true)

      const result = await resetPassword('valid-token', 'newpassword123')

      expect(result).toEqual({
        success: true,
        message: 'Password reset successfully!'
      })
      expect(mockUserService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123')
    })

    it('should fail with weak password', async () => {
      const result = await resetPassword('token', '123')

      expect(result).toEqual({
        success: false,
        message: 'Password must be at least 8 characters long.'
      })
    })

    it('should fail with invalid token', async () => {
      mockUserService.resetPassword = vi.fn().mockResolvedValue(false)

      const result = await resetPassword('invalid-token', 'newpassword123')

      expect(result).toEqual({
        success: false,
        message: 'Invalid or expired reset token.'
      })
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'author',
        verified: true,
        affiliation: 'Test University',
        orcid: '0000-0000-0000-0000',
        bio: 'Test bio',
        expertise: ['AI', 'ML'],
        createdAt: new Date('2025-01-01')
      }

      const mockStats = {
        submissionsCount: 5,
        reviewsCount: 3,
        publicationsCount: 10,
        profileCompleteness: 80
      }

      mockUserService.getUserById = vi.fn().mockResolvedValue(mockUser)
      mockUserService.getUserStats = vi.fn().mockResolvedValue(mockStats)

      const result = await getUserProfile('user-123')

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'author',
        verified: true,
        affiliation: 'Test University',
        orcid: '0000-0000-0000-0000',
        bio: 'Test bio',
        expertise: ['AI', 'ML'],
        createdAt: new Date('2025-01-01'),
        stats: mockStats
      })
    })

    it('should fail when user not found', async () => {
      mockUserService.getUserById = vi.fn().mockResolvedValue(null)

      const result = await getUserProfile('nonexistent-user')

      expect(result).toEqual({
        success: false,
        message: 'User not found.'
      })
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      mockUserService.updateUserProfile = vi.fn().mockResolvedValue(true)
      mockUserService.updateLastActive = vi.fn().mockResolvedValue()

      const updates = {
        name: 'Updated Name',
        affiliation: 'New University',
        bio: 'Updated bio'
      }

      const result = await (await import('../lib/auth')).updateProfile('user-123', updates)

      expect(result).toEqual({
        success: true,
        message: 'Profile updated successfully!'
      })
      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith('user-123', updates)
      expect(mockUserService.updateLastActive).toHaveBeenCalledWith('user-123')
    })

    it('should fail when update fails', async () => {
      mockUserService.updateUserProfile = vi.fn().mockResolvedValue(false)

      const result = await (await import('../lib/auth')).updateProfile('user-123', {})

      expect(result).toEqual({
        success: false,
        message: 'Failed to update profile.'
      })
    })
  })

  describe('Input Validation', () => {
    it('should validate email formats correctly', async () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        ''
      ]

      for (const email of validEmails) {
        mockUserService.getUserByEmail = vi.fn().mockResolvedValue(null)
        const result = await signup(email, 'password123', 'Test User')
        expect(result.success).toBe(true)
      }

      for (const email of invalidEmails) {
        const result = await signup(email, 'password123', 'Test User')
        expect(result.success).toBe(false)
        expect(result.message).toContain('valid email')
      }
    })

    it('should validate password strength', async () => {
      const weakPasswords = ['123', 'pass', '1234567']
      const strongPasswords = ['password123', 'securePass!', 'myStrongP@ssw0rd']

      for (const password of weakPasswords) {
        const result = await signup('test@example.com', password, 'Test User')
        expect(result.success).toBe(false)
        expect(result.message).toContain('8 characters')
      }

      mockUserService.getUserByEmail = vi.fn().mockResolvedValue(null)
      for (const password of strongPasswords) {
        const result = await signup('test@example.com', password, 'Test User')
        // These should pass validation (but may fail for other reasons in mock)
        expect(result.message).not.toContain('8 characters')
      }
    })
  })
})
