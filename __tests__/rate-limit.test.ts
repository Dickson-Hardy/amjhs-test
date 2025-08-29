import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter } from '../lib/rate-limit'
import { NextRequest } from 'next/server'

describe('Rate Limiting Tests', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5
    })
  })

  describe('Rate Limiter', () => {
    it('should allow requests within limit', async () => {
      const req = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })

      const result = await rateLimiter.isAllowed(req)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1 = 4
    })

    it('should block requests when limit exceeded', async () => {
      const req = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      })

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.isAllowed(req)
        expect(result.allowed).toBe(true)
      }

      // 6th request should be blocked
      const blockedResult = await rateLimiter.isAllowed(req)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      // Create rate limiter with very short window for testing
      const shortRateLimiter = new RateLimiter({
        windowMs: 100, // 100ms
        maxRequests: 2
      })

      const req = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' }
      })

      // Use up the limit
      await shortRateLimiter.isAllowed(req)
      await shortRateLimiter.isAllowed(req)
      
      // Should be blocked
      let result = await shortRateLimiter.isAllowed(req)
      expect(result.allowed).toBe(false)

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      result = await shortRateLimiter.isAllowed(req)
      expect(result.allowed).toBe(true)
    })

    it('should use custom key generator', async () => {
      const customRateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        keyGenerator: (req) => req.headers.get('user-id') || 'anonymous'
      })

      const req1 = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'user-id': 'user123' }
      })

      const req2 = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'user-id': 'user456' }
      })

      // Both users should have separate limits
      const result1 = await customRateLimiter.isAllowed(req1)
      const result2 = await customRateLimiter.isAllowed(req2)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result1.remaining).toBe(2)
      expect(result2.remaining).toBe(2)
    })
  })

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const req = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' }
      })

      const result = await rateLimiter.isAllowed(req)
      expect(result.allowed).toBe(true)
    })

    it('should handle missing IP gracefully', async () => {
      const req = new NextRequest('http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""/api/test')

      const result = await rateLimiter.isAllowed(req)
      expect(result.allowed).toBe(true)
    })
  })
})
