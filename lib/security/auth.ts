/**
 * Authentication Security Utilities for Next.js 15+
 * Provides secure authentication patterns and session management
 */

import { hash, compare, genSalt } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

// Password security
export const passwordSecurity = {
  // Hash password with salt
  async hash(password: string): Promise<string> {
    const salt = await genSalt(12);
    return hash(password, salt);
  },
  
  // Verify password
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  },
  
  // Generate secure password
  generate(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  },
  
  // Check password strength
  checkStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\d/.test(password)) score++;
    else feedback.push('Password should contain numbers');
    
    if (/[!@#$%^&*]/.test(password)) score++;
    else feedback.push('Password should contain special characters');
    
    return { score, feedback };
  }
};

// Session security
export const sessionSecurity = {
  // Generate secure session ID
  generateSessionId(): string {
    return randomBytes(32).toString('hex');
  },
  
  // Hash session data
  hashSession(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  },
  
  // Validate session
  validateSession(sessionId: string, storedHash: string): boolean {
    const computedHash = this.hashSession(sessionId);
    return computedHash === storedHash;
  }
};

// Two-factor authentication
export const twoFactorAuth = {
  // Generate TOTP secret
  generateSecret(): string {
    return randomBytes(20).toString('base32');
  },
  
  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
};

// Account lockout protection
export class AccountLockout {
  private failedAttempts = new Map<string, { count: number; lockoutUntil: number }>();
  
  constructor(
    private maxAttempts: number = 5,
    private lockoutDuration: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.failedAttempts.get(identifier);
    
    if (!attempt || now > attempt.lockoutUntil) {
      this.failedAttempts.set(identifier, { count: 1, lockoutUntil: 0 });
      return true;
    }
    
    attempt.count++;
    
    if (attempt.count >= this.maxAttempts) {
      attempt.lockoutUntil = now + this.lockoutDuration;
      return false;
    }
    
    return true;
  }
  
  isLocked(identifier: string): boolean {
    const attempt = this.failedAttempts.get(identifier);
    if (!attempt) return false;
    
    return Date.now() < attempt.lockoutUntil;
  }
  
  reset(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }
}