import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// Rate limiting function for Vercel KV
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60 // seconds
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  try {
    const key = `rate_limit:${identifier}`
    const current = await kv.incr(key)
    
    if (current === 1) {
      // Set expiry on first increment
      await kv.expire(key, window)
    }
    
    const remaining = Math.max(0, limit - current)
    const resetTime = Date.now() + (window * 1000)
    
    return {
      success: current <= limit,
      remaining,
      resetTime
    }
  } catch (error) {
    logger.error('Rate limiting error:', error)
    // Fallback: allow the request if rate limiting fails
    return {
      success: true,
      remaining: limit,
      resetTime: Date.now() + (window * 1000)
    }
  }
}

// Rate limit middleware for API routes
export function withRateLimit(
  handler: (request: Request) => Promise<Response | NextResponse>,
  options: { limit?: number; window?: number; keyGenerator?: (request: Request) => string } = {}
) {
  return async (request: Request) => {
    const { limit = 100, window = 60, keyGenerator } = options
    
    // Generate rate limit key
    const identifier = keyGenerator 
      ? keyGenerator(request)
      : request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'anonymous'
    
    const rateResult = await rateLimit(identifier, limit, window)
    
    if (!rateResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${window} seconds.`
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': rateResult.remaining.toString(),
            'X-RateLimit-Reset': rateResult.resetTime.toString(),
            'Retry-After': window.toString()
          }
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(request)
    
    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateResult.resetTime.toString())
    }
    
    return response
  }
}
