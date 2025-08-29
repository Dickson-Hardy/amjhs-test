#!/usr/bin/env node

/**
 * AMHSJ Secrets Generator
 * Generates cryptographically secure secrets for the application
 */

import crypto from 'crypto'
import { writeFileSync } from 'fs'

// Generate a cryptographically secure random string
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

// Generate a base64 URL-safe token
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('base64url')
}

// Generate a UUID v4
function generateUUID() {
  return crypto.randomUUID()
}

// Generate JWT signing key (RS256)
function generateJWTKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })
  
  return { publicKey, privateKey }
}

// Generate secure secrets
function generateSecrets() {
  const timestamp = new Date().toISOString()
  
  const secrets = {
    // Core Authentication
    NEXTAUTH_SECRET: generateSecret(64),
    NEXTAUTH_URL: 'http://localhost:3000', // Update for production
    
    // JWT Secrets
    JWT_SECRET: generateSecret(64),
    JWT_REFRESH_SECRET: generateSecret(64),
    
    // Session Security
    SESSION_SECRET: generateSecret(32),
    COOKIE_SECRET: generateSecret(32),
    
    // Database Encryption
    DATABASE_ENCRYPTION_KEY: generateSecret(32),
    
    // API Keys (placeholders - replace with actual keys)
    CROSSREF_API_KEY: 'your_crossref_api_key_here',
    ORCID_CLIENT_ID: 'your_orcid_client_id_here',
    ORCID_CLIENT_SECRET: generateSecret(32),
    
    // Email Service (Resend)
    RESEND_API_KEY: 'your_resend_api_key_here',
    SMTP_HOST: 'smtp.resend.com',
    SMTP_PORT: '587',
    SMTP_USER: 'resend',
    SMTP_PASSWORD: 'your_resend_api_key_here',
    
    // File Upload Security
    UPLOAD_SECRET: generateSecret(32),
    FILE_ENCRYPTION_KEY: generateSecret(32),
    
    // Rate Limiting
    RATE_LIMIT_SECRET: generateSecret(32),
    
    // Webhook Security
    WEBHOOK_SECRET: generateSecret(32),
    
    // Admin Access
    ADMIN_API_KEY: generateToken(48),
    
    // Database URL (placeholder)
    DATABASE_URL: 'postgresql://username:password@localhost:5432/amhsj',
    
    // Redis/KV Store (for Vercel KV)
    KV_URL: 'redis://localhost:6379',
    KV_REST_API_URL: 'https://your-kv-store.upstash.io',
    KV_REST_API_TOKEN: generateToken(32),
    KV_REST_API_READ_ONLY_TOKEN: generateToken(32),
    
    // Blob Storage (for Vercel Blob)
    BLOB_READ_WRITE_TOKEN: generateToken(32),
    
    // Security Headers
    CSRF_SECRET: generateSecret(32),
    
    // Analytics (optional)
    GOOGLE_ANALYTICS_ID: 'GA-XXXXXXXXX',
    
    // Sentry (optional)
    SENTRY_DSN: 'https://your-sentry-dsn.ingest.sentry.io/project-id',
    
    // Environment
    NODE_ENV: 'development',
    
    // Generation metadata
    SECRETS_GENERATED_AT: timestamp,
    SECRETS_VERSION: '1.0.0'
  }
  
  return secrets
}

// Generate JWT key pair
function generateJWTKeys() {
  const { publicKey, privateKey } = generateJWTKeyPair()
  
  return {
    JWT_PUBLIC_KEY: Buffer.from(publicKey).toString('base64'),
    JWT_PRIVATE_KEY: Buffer.from(privateKey).toString('base64')
  }
}

// Main execution
function main() {
  console.log('🔐 Generating secure secrets for AMHSJ...\n')
  
  const secrets = generateSecrets()
  const jwtKeys = generateJWTKeys()
  
  const allSecrets = { ...secrets, ...jwtKeys }
  
  // Generate .env.local content
  let envContent = `# AMHSJ Environment Variables
# Generated on: ${new Date().toISOString()}
# ⚠️  KEEP THESE SECRETS SECURE - DO NOT COMMIT TO VERSION CONTROL
#
# This file contains sensitive information and should be:
# 1. Added to .gitignore
# 2. Stored securely
# 3. Backed up in a secure location
# 4. Rotated regularly

`
  
  // Add secrets to env content
  Object.entries(allSecrets).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`
  })
  
  // Add additional configuration
  envContent += `
# =============================================================================
# Additional Configuration Instructions
# =============================================================================
#
# 1. UPDATE THESE PLACEHOLDERS:
#    - Replace CROSSREF_API_KEY with your actual Crossref API key
#    - Replace ORCID_CLIENT_ID and ORCID_CLIENT_SECRET with ORCID credentials
#    - Replace RESEND_API_KEY with your Resend API key
#    - Update DATABASE_URL with your actual database connection string
#    - Update NEXTAUTH_URL for production deployment
#
# 2. FOR PRODUCTION:
#    - Set NODE_ENV=production
#    - Use secure HTTPS URLs
#    - Configure proper database connection
#    - Set up monitoring and logging
#
# 3. SECURITY NOTES:
#    - Rotate secrets regularly (every 90 days recommended)
#    - Use different secrets for different environments
#    - Monitor for secret exposure in logs or repositories
#    - Use environment-specific configurations
#
# =============================================================================
`
  
  // Write to file
  try {
    writeFileSync('.env.local', envContent)
    console.log('✅ Generated .env.local with secure secrets')
    
    // Generate .env.example (without actual secrets)
    const exampleContent = envContent
      .replace(/=.+$/gm, '=your_secret_here')
      .replace(/# Generated on:.+/, '# Template for environment variables')
      .replace(/SECRETS_GENERATED_AT=.+/, 'SECRETS_GENERATED_AT=')
      .replace(/NODE_ENV=development/, 'NODE_ENV=development')
      .replace(/NEXTAUTH_URL=.+/, 'NEXTAUTH_URL=http://localhost:3000')
    
    writeFileSync('.env.example', exampleContent)
    console.log('✅ Generated .env.example template')
    
    // Generate secrets summary
    const summary = {
      timestamp: new Date().toISOString(),
      secretsGenerated: Object.keys(allSecrets).length,
      environment: 'development',
      version: '1.0.0',
      nextSteps: [
        'Update placeholder API keys with real values',
        'Configure database connection string',
        'Set up external service credentials',
        'Test authentication flow',
        'Configure production environment'
      ]
    }
    
    writeFileSync('secrets-generation-summary.json', JSON.stringify(summary, null, 2))
    console.log('✅ Generated secrets summary')
    
  } catch (error) {
    console.error('❌ Error generating secrets:', error.message)
    process.exit(1)
  }
  
  console.log('\n🎉 Secrets generation complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Review .env.local and update placeholder values')
  console.log('2. Copy .env.local to .env.production for production')
  console.log('3. Configure your database and external services')
  console.log('4. Test your application with the new secrets')
  console.log('5. Add .env.local to .gitignore if not already there')
  
  console.log('\n🔒 Security reminders:')
  console.log('- Never commit .env.local to version control')
  console.log('- Store secrets securely and rotate regularly')
  console.log('- Use different secrets for different environments')
  console.log('- Monitor for accidental secret exposure')
  
  console.log('\n🚀 Generated secrets are ready for use!')
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateSecrets, generateJWTKeys }