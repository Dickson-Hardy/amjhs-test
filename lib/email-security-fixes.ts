// Email Security Fixes for AMHSJ
// This file contains essential security functions to fix XSS vulnerabilities

/**
 * HTML encode function to prevent XSS attacks in email templates
 */
export function htmlEncode(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * URL validation to prevent malicious URLs in email templates
 */
export function validateUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const parsedUrl = new URL(url)
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitize URL for safe use in email templates
 */
export function sanitizeUrl(url: string): string {
  if (!validateUrl(url)) {
    return '#'
  }
  return url
}

/**
 * Enhanced email validation
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  // More robust email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Secure SMTP configuration
 */
export function getSecureSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true, // Enable certificate validation
      minVersion: 'TLSv1.2'
    }
  }
}