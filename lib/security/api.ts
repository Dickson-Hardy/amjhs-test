/**
 * API Security Utilities for Next.js 15+
 * Provides API-level security measures and middleware
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, AccountLockout } from './validation';

// API security middleware
export class APISecurity {
  private rateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
  private accountLockout = new AccountLockout();
  
  // Rate limiting middleware
  rateLimit(identifier: string): boolean {
    return this.rateLimiter.isAllowed(identifier);
  }
  
  // Account lockout middleware
  checkLockout(identifier: string): boolean {
    return !this.accountLockout.isLocked(identifier);
  }
  
  // Record failed authentication
  recordFailedAuth(identifier: string): boolean {
    return this.accountLockout.recordFailedAttempt(identifier);
  }
  
  // Security headers middleware
  addSecurityHeaders(response: NextResponse): NextResponse {
    const headers = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // CORS configuration
  configureCORS(response: NextResponse, allowedOrigins: string[] = ['*']): NextResponse {
    const origin = allowedOrigins.includes('*') ? '*' : allowedOrigins.join(', ');
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // Input sanitization middleware
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
  
  // SQL injection prevention
  preventSQLInjection(input: string): string {
    return input
      .replace(/['";]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }
  
  // XSS prevention
  preventXSS(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  }
}

// Create global instance
export const apiSecurity = new APISecurity();

// Security middleware for API routes
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: boolean;
    sanitize?: boolean;
    cors?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const identifier = req.ip || 'unknown';
        if (!apiSecurity.rateLimit(identifier)) {
          return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );
        }
      }
      
      // Call original handler
      const response = await handler(req);
      
      // Add security headers
      apiSecurity.addSecurityHeaders(response);
      
      // Configure CORS
      if (options.cors) {
        apiSecurity.configureCORS(response);
      }
      
      return response;
    } catch (error) {
      logger.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}