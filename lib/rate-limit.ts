import type { NextRequest } from "next/server"
import { CacheManager } from "./cache"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

// Helper function to extract IP address from NextRequest
function getClientIP(req: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get("x-forwarded-for")
  const realIP = req.headers.get("x-real-ip")
  const cfConnectingIP = req.headers.get("cf-connecting-ip") // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  // Fallback to a default identifier
  return "unknown"
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async isAllowed(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req)
      const now = Date.now()
      const windowStart = now - this.config.windowMs

      // Get current request count and ensure it's an array
      const requestsData = await CacheManager.get<number[]>(`ratelimit:${key}`)
      let requests: number[] = []
      
      if (requestsData) {
        // Handle both array and string formats from Redis
        if (Array.isArray(requestsData)) {
          requests = requestsData
        } else if (typeof requestsData === 'string') {
          try {
            requests = JSON.parse(requestsData)
          } catch {
            requests = []
          }
        }
      }

      // Filter requests within the current window
      const validRequests = requests.filter((timestamp) => timestamp > windowStart)

      if (validRequests.length >= this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Math.min(...validRequests) + this.config.windowMs,
        }
      }

      // Add current request
      validRequests.push(now)
      await CacheManager.set(`ratelimit:${key}`, validRequests, Math.ceil(this.config.windowMs / 1000))

      return {
        allowed: true,
        remaining: this.config.maxRequests - validRequests.length,
        resetTime: now + this.config.windowMs,
      }
    } catch (error) {
      // Rate limiter error, allowing request
      // If rate limiting fails, allow the request to avoid blocking users
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      }
    }
  }

  private getDefaultKey(req: NextRequest): string {
    return getClientIP(req)
  }
}

// Pre-configured rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
})

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    // For auth, try to get email from body or fall back to IP
    const userAgent = req.headers.get("user-agent") || ""
    const ip = getClientIP(req)
    return `auth:${ip}:${userAgent.slice(0, 50)}` // Include partial user agent for better uniqueness
  },
})

export const submissionRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
})

// Export a default rate limiter for general use
export const rateLimit = apiRateLimit
