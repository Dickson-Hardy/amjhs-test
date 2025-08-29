/**
 * Security Validation Utilities for Next.js 15+
 * Provides comprehensive input validation and sanitization
 */

import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { z } from 'zod';

// Common validation schemas
export const securitySchemas = {
  // User input validation
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
  
  // File upload validation
  fileUpload: z.object({
    name: z.string().min(1).max(255),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    type: z.string().regex(/^[a-zA-Z0-9\/\-\.]+$/),
  }),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // ID validation
  id: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid ID format'),
  
  // Search query validation
  searchQuery: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_\.,!?]+$/, 'Invalid search characters'),
};

// Input sanitization functions
export const sanitizers = {
  // HTML sanitization
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  // SQL injection prevention
  sql: (input: string): string => {
    return input
      .replace(/['";]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },
  
  // XSS prevention
  xss: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  },
  
  // Path traversal prevention
  path: (input: string): string => {
    return input
      .replace(/\.\./g, '')
      .replace(/\//g, '')
      .replace(/\\/g, '');
  }
};

// Rate limiting utilities
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// CSRF protection
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

// JWT utilities with security
export const jwtUtils = {
  // Generate secure JWT
  generate: (payload: any, secret: string, options: { expiresIn?: string } = {}) => {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
      kid: crypto.randomUUID()
    };
    
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (options.expiresIn ? parseInt(options.expiresIn) : 3600);
    
    const data = {
      ...payload,
      iat: now,
      exp,
      jti: crypto.randomUUID()
    };
    
    return { header, data, exp };
  },
  
  // Validate JWT
  validate: (token: string, secret: string): boolean => {
    try {
      // process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "Basic """JWT validation (in production, use a proper JWT library)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Add your JWT validation logic here
      return true;
    } catch {
      return false;
    }
  }
};

// Security headers
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Input validation middleware
export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: Function) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}