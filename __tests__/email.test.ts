import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendEmail, sendEmailVerification, sendPasswordReset } from '../lib/email'
import nodemailer from 'nodemailer'

// Mock nodemailer
vi.mock('nodemailer')
const mockNodemailer = vi.mocked(nodemailer)

describe('Email Service Tests', () => {
  let mockTransporter: any

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn(),
    }
    mockNodemailer.createTransporter = vi.fn().mockReturnValue(mockTransporter)
    
    // Mock environment variables
    process.env.SMTP_HOST = 'smtp.zoho.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASSWORD = 'testpassword'
    process.env.SMTP_FROM = 'noreply@example.com'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Configuration', () => {
    it('should configure Zoho Mail transporter correctly', () => {
      expect(mockNodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpassword',
        },
        tls: {
          rejectUnauthorized: false
        }
      })
    })
  })

  describe('process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "Basic """Email Sending', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'test-id' })

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        priority: true
      })

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"AMHSJ Editorial Team" <noreply@example.com>',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      })
    })

    it('should handle email sending failures gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'))

      // Should not throw error, should queue for retry
      await expect(sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        priority: true
      })).resolves.toBeUndefined()
    })

    it('should queue non-priority emails', async () => {
      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        priority: false
      })

      // Should not call sendMail immediately for non-priority emails
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })
  })

  describe('Email Templates', () => {
    it('should send email verification with correct template', async () => {
      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'test-id' })

      await sendEmailVerification(
        'user@example.com',
        'John Doe',
        'https://example.com/verify?token=123'
      )

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('verify'),
          html: expect.stringContaining('John Doe'),
        })
      )
    })

    it('should send password reset with correct template', async () => {
      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'test-id' })

      await sendPasswordReset(
        'user@example.com',
        'John Doe',
        'https://example.com/reset?token=123'
      )

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('reset'),
          html: expect.stringContaining('John Doe'),
        })
      )
    })
  })

  describe('Email Queue System', () => {
    it('should retry failed emails', async () => {
      // First call fails, second succeeds
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Temporary SMTP Error'))
        .mockResolvedValueOnce({ messageId: 'test-id' })

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        priority: true
      })

      // Wait for retry processing
      await new Promise(resolve => setTimeout(resolve, 6000))

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2)
    })

    it('should give up after 3 retries', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Persistent SMTP Error'))

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        priority: true
      })

      // Wait for all retry attempts
      await new Promise(resolve => setTimeout(resolve, 20000))

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })
  })

  describe('Email Aliases and Routing', () => {
    it('should handle different email aliases', async () => {
      const aliases = [
        'editorial@example.com',
        'submissions@example.com',
        'support@example.com',
        'noreply@example.com'
      ]

      for (const alias of aliases) {
        process.env.SMTP_FROM = alias
        mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'test-id' })

        await sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          priority: true
        })

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            from: `"AMHSJ Editorial Team" <${alias}>`,
          })
        )
      }
    })
  })

  describe('Email Validation', () => {
    it('should validate email addresses', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        ''
      ]

      for (const email of invalidEmails) {
        await expect(sendEmail({
          to: email,
          subject: 'Test',
          html: '<p>Test</p>',
          priority: true
        })).rejects.toThrow()
      }
    })

    it('should accept valid email addresses', async () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@sub.domain.com'
      ]

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      for (const email of validEmails) {
        await expect(sendEmail({
          to: email,
          subject: 'Test',
          html: '<p>Test</p>',
          priority: true
        })).resolves.toBeUndefined()
      }
    })
  })
})
