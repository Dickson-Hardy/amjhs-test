/**
 * Enhanced Constants for Next.js 15+
 * Centralized configuration and environment variables
 */

export const APP_CONFIG = {
  // URLs and Hosts
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000/api',
  
  // Authentication
  AUTH_TOKEN_PREFIX: process.env.AUTH_TOKEN_PREFIX || 'Bearer ',
  AUTH_BASIC_PREFIX: process.env.AUTH_BASIC_PREFIX || 'Basic ',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/amjhs',
  
  // Email
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@amjhs.com',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx'],
  
  // Rate Limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  
  // Account Lockout
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
};

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Feature flags
export const FEATURES = {
  TWO_FACTOR_AUTH: process.env.ENABLE_2FA === 'true',
  EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN === 'true',
  API_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
  FILE_UPLOAD: process.env.ENABLE_FILE_UPLOAD === 'true',
};

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 254,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
};

// API constants
export const API = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
};

// Security constants
export const SECURITY = {
  PASSWORD_SALT_ROUNDS: 12,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  CSRF_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  JWT_EXPIRY: 60 * 60, // 1 hour
};
