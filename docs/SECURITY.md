# Security Documentation

This document outlines the security measures, best practices, and protocols implemented in the AMHSJ platform.

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [Network Security](#network-security)
- [File Upload Security](#file-upload-security)
- [Session Management](#session-management)
- [API Security](#api-security)
- [Database Security](#database-security)
- [Infrastructure Security](#infrastructure-security)
- [Monitoring & Auditing](#monitoring--auditing)
- [Incident Response](#incident-response)
- [Compliance](#compliance)

## Security Overview

The AMHSJ platform implements a defense-in-depth security strategy with multiple layers of protection:

1. **Network Layer**: SSL/TLS encryption, DDoS protection, firewall rules
2. **Application Layer**: Authentication, authorization, input validation
3. **Data Layer**: Encryption at rest and in transit, access controls
4. **Infrastructure Layer**: Container security, secrets management
5. **Monitoring Layer**: Audit logging, intrusion detection, anomaly detection

### Security Principles

- **Least Privilege**: Users and systems have minimal required permissions
- **Zero Trust**: No implicit trust, verify everything
- **Defense in Depth**: Multiple security layers
- **Fail Securely**: Secure defaults when systems fail
- **Security by Design**: Security integrated from the beginning

## Authentication & Authorization

### Authentication Methods

#### 1. NextAuth.js Integration

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await getUserByEmail(credentials.email)
        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.lastActive = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  }
}
```

#### 2. Multi-Factor Authentication (Planned)

```typescript
// lib/auth/mfa.ts
export class MFAService {
  static async generateTOTPSecret(userId: string): Promise<string> {
    const secret = authenticator.generateSecret()
    
    await db.update(users)
      .set({ totpSecret: await encrypt(secret) })
      .where(eq(users.id, userId))
    
    return secret
  }

  static async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await getUserById(userId)
    if (!user?.totpSecret) return false
    
    const secret = await decrypt(user.totpSecret)
    return authenticator.verify({ token, secret })
  }
}
```

### Authorization Framework

#### Role-Based Access Control (RBAC)

```typescript
// lib/auth/rbac.ts
export enum Role {
  ADMIN = "admin",
  EDITOR = "editor", 
  REVIEWER = "reviewer",
  AUTHOR = "author"
}

export enum Permission {
  READ_ARTICLES = "read:articles",
  WRITE_ARTICLES = "write:articles",
  DELETE_ARTICLES = "delete:articles",
  MANAGE_USERS = "manage:users",
  REVIEW_ARTICLES = "review:articles",
  PUBLISH_ARTICLES = "publish:articles"
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_ARTICLES,
    Permission.WRITE_ARTICLES,
    Permission.DELETE_ARTICLES,
    Permission.MANAGE_USERS,
    Permission.REVIEW_ARTICLES,
    Permission.PUBLISH_ARTICLES
  ],
  [Role.EDITOR]: [
    Permission.READ_ARTICLES,
    Permission.WRITE_ARTICLES,
    Permission.REVIEW_ARTICLES,
    Permission.PUBLISH_ARTICLES
  ],
  [Role.REVIEWER]: [
    Permission.READ_ARTICLES,
    Permission.REVIEW_ARTICLES
  ],
  [Role.AUTHOR]: [
    Permission.READ_ARTICLES,
    Permission.WRITE_ARTICLES
  ]
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}
```

#### Resource-Based Access Control

```typescript
// lib/auth/permissions.ts
export class PermissionService {
  static async canAccessArticle(userId: string, articleId: string, action: string): Promise<boolean> {
    const user = await getUserById(userId)
    const article = await getArticleById(articleId)
    
    if (!user || !article) return false
    
    // Admin can access everything
    if (user.role === Role.ADMIN) return true
    
    // Authors can access their own articles
    if (action === 'read' || action === 'write') {
      if (await isArticleAuthor(userId, articleId)) return true
    }
    
    // Reviewers can access assigned reviews
    if (action === 'review') {
      if (await isAssignedReviewer(userId, articleId)) return true
    }
    
    // Editors can access articles in their sections
    if (user.role === Role.EDITOR) {
      if (await isEditorForSection(userId, article.category)) return true
    }
    
    return false
  }
}
```

### Password Security

#### Password Hashing

```typescript
// lib/auth/password.ts
import bcrypt from "bcryptjs"
import { z } from "zod"

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character")

export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  passwordSchema.parse(password)
  
  // Use cost factor of 12 for bcrypt
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

#### Password Reset Security

```typescript
// lib/auth/password-reset.ts
export class PasswordResetService {
  static async generateResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    await db.update(users)
      .set({
        passwordResetToken: hashedToken,
        passwordResetExpires: expires
      })
      .where(eq(users.email, email))
    
    return token
  }

  static async validateResetToken(token: string): Promise<string | null> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.passwordResetToken, hashedToken),
        gt(users.passwordResetExpires, new Date())
      )
    })
    
    return user?.id || null
  }
}
```

## Data Protection

### Encryption

#### Data at Rest

```typescript
// lib/crypto/encryption.ts
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32 bytes key
const ALGORITHM = "aes-256-gcm"

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  cipher.setAAD(iv)
  
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":")
  
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAAD(iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}
```

#### Sensitive Data Fields

```typescript
// lib/db/schema.ts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // Encrypted fields
  orcid: varchar("orcid", { length: 255 }), // Encrypted if provided
  phone: varchar("phone", { length: 20 }), // Encrypted
  // Hashed field
  password: varchar("password", { length: 255 }).notNull(),
  // PII fields with access logging
  name: varchar("name", { length: 255 }).notNull(),
  affiliation: varchar("affiliation", { length: 255 }),
})
```

### Data Minimization

```typescript
// lib/data/sanitization.ts
export function sanitizeUserData(user: any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    affiliation: user.affiliation,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    // Exclude sensitive fields like password, tokens, etc.
  }
}

export function sanitizeForAPI(data: any, userRole: Role): any {
  // Remove sensitive fields based on user role
  const sanitized = { ...data }
  
  if (userRole !== Role.ADMIN) {
    delete sanitized.password
    delete sanitized.emailVerificationToken
    delete sanitized.passwordResetToken
  }
  
  return sanitized
}
```

## Input Validation & Sanitization

### Zod Validation Schemas

```typescript
// lib/validations/article.ts
import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

export const articleSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be less than 200 characters")
    .transform(title => DOMPurify.sanitize(title)),
    
  abstract: z.string()
    .min(100, "Abstract must be at least 100 characters")
    .max(3000, "Abstract must be less than 3000 characters")
    .transform(abstract => DOMPurify.sanitize(abstract)),
    
  keywords: z.array(z.string().min(2).max(50))
    .min(4, "At least 4 keywords required")
    .max(10, "Maximum 10 keywords allowed"),
    
  category: z.enum([
    "clinical-medicine",
    "public-health",
    "biomedical-sciences",
    "healthcare-technology"
  ]),
  
  content: z.string()
    .min(1000, "Content must be at least 1000 characters")
    .transform(content => DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    }))
})
```

### SQL Injection Prevention

```typescript
// lib/db/queries.ts
import { sql } from "drizzle-orm"

// ❌ Vulnerable to SQL injection
export async function searchArticlesBad(query: string) {
  return db.execute(sql`
    SELECT * FROM articles 
    WHERE title ILIKE '%${query}%'
  `)
}

// ✅ Safe parameterized query
export async function searchArticles(query: string) {
  return db.execute(sql`
    SELECT * FROM articles 
    WHERE title ILIKE ${`%${query}%`}
  `)
}

// ✅ Using Drizzle ORM (automatically parameterized)
export async function searchArticlesORM(query: string) {
  return db.select()
    .from(articles)
    .where(ilike(articles.title, `%${query}%`))
}
```

### XSS Prevention

```typescript
// lib/security/xss.ts
import DOMPurify from "isomorphic-dompurify"

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  })
}

export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

## Network Security

### HTTPS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
}
```

### Rate Limiting

```typescript
// lib/security/rate-limit.ts
import { Redis } from "ioredis"
import { NextRequest } from "next/server"

export class RateLimiter {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  async checkLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const window = Math.floor(Date.now() / windowMs)
    const key = `rate_limit:${identifier}:${window}`
    
    const current = await this.redis.incr(key)
    
    if (current === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000))
    }
    
    const remaining = Math.max(0, maxRequests - current)
    const resetTime = (window + 1) * windowMs
    
    return {
      allowed: current <= maxRequests,
      remaining,
      resetTime
    }
  }

  async checkAPILimit(request: NextRequest): Promise<boolean> {
    const ip = request.ip || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const identifier = `${ip}:${userAgent}`
    
    const result = await this.checkLimit(identifier, 60 * 1000, 100) // 100 requests per minute
    
    return result.allowed
  }

  async checkAuthLimit(email: string): Promise<boolean> {
    const result = await this.checkLimit(`auth:${email}`, 15 * 60 * 1000, 5) // 5 attempts per 15 minutes
    
    return result.allowed
  }
}
```

### CORS Configuration

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "production" 
              ? "https://your-domain.com" 
              : "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization"
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400"
          }
        ]
      }
    ]
  }
}
```

## File Upload Security

### File Validation

```typescript
// lib/security/file-validation.ts
export class FileValidator {
  private static readonly ALLOWED_TYPES = {
    manuscript: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    figure: [
      'image/jpeg',
      'image/png', 
      'image/tiff',
      'image/svg+xml'
    ],
    avatar: [
      'image/jpeg',
      'image/png'
    ]
  }

  private static readonly MAX_SIZES = {
    manuscript: 2 * 1024 * 1024, // 2MB
    figure: 10 * 1024 * 1024,     // 10MB
    avatar: 2 * 1024 * 1024       // 2MB
  }

  static async validateFile(file: File, type: keyof typeof FileValidator.ALLOWED_TYPES): Promise<void> {
    // Check file size
    if (file.size > this.MAX_SIZES[type]) {
      throw new Error(`File too large. Maximum size: ${this.MAX_SIZES[type]} bytes`)
    }

    // Check MIME type
    if (!this.ALLOWED_TYPES[type].includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${this.ALLOWED_TYPES[type].join(', ')}`)
    }

    // Check file signature (magic bytes)
    await this.validateFileSignature(file, type)
  }

  private static async validateFileSignature(file: File, type: string): Promise<void> {
    const buffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    const signatures: Record<string, Uint8Array[]> = {
      'application/pdf': [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF
      'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
      'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    }

    const expectedSignatures = signatures[file.type]
    if (!expectedSignatures) return

    const matches = expectedSignatures.some(signature => 
      signature.every((byte, index) => bytes[index] === byte)
    )

    if (!matches) {
      throw new Error('File signature does not match declared type')
    }
  }
}
```

### Virus Scanning

```typescript
// lib/security/virus-scan.ts
import { spawn } from "child_process"

export class VirusScanner {
  static async scanFile(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const clamav = spawn('clamscan', ['--no-summary', filePath])
      
      let output = ''
      clamav.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      clamav.on('close', (code) => {
        if (code === 0) {
          resolve(true) // Clean file
        } else if (code === 1) {
          resolve(false) // Virus found
        } else {
          reject(new Error('Virus scan failed'))
        }
      })
    })
  }
}
```

## Session Management

### Secure Session Configuration

```typescript
// lib/auth/session.ts
export const sessionConfig = {
  strategy: "jwt" as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // Update every 24 hours
  generateSessionToken: () => {
    return crypto.randomBytes(32).toString("hex")
  },
  encode: async ({ token, secret }) => {
    return jwt.sign(token, secret, {
      algorithm: "HS256",
      expiresIn: "30d"
    })
  },
  decode: async ({ token, secret }) => {
    try {
      return jwt.verify(token, secret) as JWT
    } catch {
      return null
    }
  }
}
```

### Session Invalidation

```typescript
// lib/auth/session-management.ts
export class SessionManager {
  static async invalidateUserSessions(userId: string): Promise<void> {
    // Add user to invalidation list
    await redis.sadd(`invalidated_users`, userId)
    await redis.expire(`invalidated_users`, 30 * 24 * 60 * 60) // 30 days
  }

  static async isSessionValid(userId: string, tokenIssued: number): Promise<boolean> {
    // Check if user is in invalidation list
    const isInvalidated = await redis.sismember(`invalidated_users`, userId)
    if (isInvalidated) {
      // Check if session was issued before invalidation
      const invalidationTime = await redis.get(`user_invalidation:${userId}`)
      if (invalidationTime && tokenIssued < parseInt(invalidationTime)) {
        return false
      }
    }
    
    return true
  }
}
```

## API Security

### API Authentication Middleware

```typescript
// lib/middleware/auth.ts
export function withAuth(handler: NextApiHandler, requiredRole?: Role) {
  return async (req: NextRequest, res: NextResponse) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if session is still valid
      const isValid = await SessionManager.isSessionValid(
        session.user.id,
        session.iat || 0
      )
      
      if (!isValid) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 })
      }

      // Check role requirements
      if (requiredRole && session.user.role !== requiredRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Add user to request context
      req.user = session.user
      
      return handler(req, res)
    } catch (error) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
  }
}
```

### Request Signing

```typescript
// lib/security/request-signing.ts
export class RequestSigner {
  static sign(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  static verify(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.sign(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }
}
```

## Database Security

### Connection Security

```typescript
// lib/db/secure-connection.ts
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./certs/ca.pem'),
    key: fs.readFileSync('./certs/client-key.pem'),
    cert: fs.readFileSync('./certs/client-cert.pem'),
  } : false,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  }
}
```

### Data Access Logging

```typescript
// lib/db/audit-logger.ts
export class AuditLogger {
  static async logDataAccess(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    metadata?: any
  ): Promise<void> {
    await db.insert(auditLogs).values({
      userId,
      action,
      resource,
      resourceId,
      metadata: JSON.stringify(metadata),
      timestamp: new Date(),
      ipAddress: getCurrentIP(),
      userAgent: getCurrentUserAgent()
    })
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const article = await getArticle(articleId)
  
  await AuditLogger.logDataAccess(
    session.user.id,
    'READ',
    'article',
    articleId,
    { title: article.title }
  )
  
  return NextResponse.json(article)
}
```

## Infrastructure Security

### Container Security

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Security updates
RUN apk update && apk upgrade
RUN apk add --no-cache dumb-init

# Remove unnecessary packages
RUN apk del npm

# Set security-conscious defaults
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Use non-root user
USER nextjs

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Environment Security

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/amhsj

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
NEXTAUTH_URL=https://your-domain.com

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# External Services
SMTP_PASSWORD=your-smtp-password
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key

# API Keys
CROSSREF_API_KEY=your-crossref-api-key
ORCID_CLIENT_SECRET=your-orcid-client-secret
```

### Secrets Management

```typescript
// lib/config/secrets.ts
export class SecretManager {
  private static cache = new Map<string, { value: string; expires: number }>()

  static async getSecret(key: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.value
    }

    let value: string

    if (process.env.NODE_ENV === 'production') {
      // In production, fetch from AWS Secrets Manager, Azure Key Vault, etc.
      value = await this.fetchFromSecretStore(key)
    } else {
      // In development, use environment variables
      value = process.env[key] || ""
    }

    // Cache for 5 minutes
    this.cache.set(key, {
      value,
      expires: Date.now() + 5 * 60 * 1000
    })

    return value
  }

  private static async fetchFromSecretStore(key: string): Promise<string> {
    // Implementation depends on your secret store
    // AWS Secrets Manager example:
    // const client = new SecretsManagerClient({ region: "us-east-1" })
    // const response = await client.send(new GetSecretValueCommand({ SecretId: key }))
    // return response.SecretString || ""
    
    return process.env[key] || ""
  }
}
```

## Monitoring & Auditing

### Security Event Logging

```typescript
// lib/security/security-logger.ts
export class SecurityLogger {
  static async logSecurityEvent(
    eventType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any,
    userId?: string
  ): Promise<void> {
    const event = {
      timestamp: new Date(),
      type: eventType,
      severity,
      userId,
      details,
      source: 'AMHSJ-API',
      environment: process.env.NODE_ENV
    }

    // Log to multiple destinations
    await Promise.all([
      this.logToDatabase(event),
      this.logToSIEM(event),
      this.alertIfCritical(event)
    ])
  }

  private static async logToDatabase(event: any): Promise<void> {
    await db.insert(securityEvents).values(event)
  }

  private static async logToSIEM(event: any): Promise<void> {
    // Send to SIEM system (Splunk, ELK, etc.)
    if (process.env.SIEM_ENDPOINT) {
      await fetch(process.env.SIEM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    }
  }

  private static async alertIfCritical(event: any): Promise<void> {
    if (event.severity === 'CRITICAL') {
      // Send immediate alert
      await this.sendAlert(event)
    }
  }
}
```

### Intrusion Detection

```typescript
// lib/security/intrusion-detection.ts
export class IntrusionDetector {
  static async detectSuspiciousActivity(
    userId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    const patterns = [
      this.detectBruteForce(userId, action),
      this.detectAnomalousAccess(userId, metadata),
      this.detectPrivilegeEscalation(userId, action),
      this.detectDataExfiltration(userId, metadata)
    ]

    const detections = await Promise.all(patterns)
    const suspiciousActivities = detections.filter(Boolean)

    if (suspiciousActivities.length > 0) {
      await SecurityLogger.logSecurityEvent(
        'INTRUSION_DETECTED',
        'HIGH',
        {
          userId,
          action,
          detections: suspiciousActivities,
          metadata
        },
        userId
      )
    }
  }

  private static async detectBruteForce(userId: string, action: string): Promise<string | null> {
    if (action === 'LOGIN_FAILED') {
      const key = `failed_logins:${userId}`
      const count = await redis.incr(key)
      await redis.expire(key, 900) // 15 minutes

      if (count > 5) {
        return 'BRUTE_FORCE_ATTACK'
      }
    }
    return null
  }
}
```

## Incident Response

### Security Incident Response Plan

```typescript
// lib/security/incident-response.ts
export class IncidentResponse {
  static async handleSecurityIncident(
    incidentType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any
  ): Promise<void> {
    const incident = {
      id: uuidv4(),
      type: incidentType,
      severity,
      details,
      timestamp: new Date(),
      status: 'OPEN'
    }

    // Log incident
    await db.insert(securityIncidents).values(incident)

    // Immediate response based on severity
    switch (severity) {
      case 'CRITICAL':
        await this.criticalIncidentResponse(incident)
        break
      case 'HIGH':
        await this.highIncidentResponse(incident)
        break
      case 'MEDIUM':
        await this.mediumIncidentResponse(incident)
        break
      case 'LOW':
        await this.lowIncidentResponse(incident)
        break
    }
  }

  private static async criticalIncidentResponse(incident: any): Promise<void> {
    // 1. Immediate notification to security team
    await this.notifySecurityTeam(incident)
    
    // 2. Activate incident response team
    await this.activateIncidentTeam(incident)
    
    // 3. Consider system lockdown
    await this.evaluateSystemLockdown(incident)
    
    // 4. Preserve evidence
    await this.preserveEvidence(incident)
  }

  private static async notifySecurityTeam(incident: any): Promise<void> {
    const message = `
      CRITICAL SECURITY INCIDENT DETECTED
      
      Incident ID: ${incident.id}
      Type: ${incident.type}
      Time: ${incident.timestamp}
      Details: ${JSON.stringify(incident.details, null, 2)}
      
      Immediate action required.
    `

    // Send to multiple channels
    await Promise.all([
      sendEmail({
        to: process.env.SECURITY_TEAM_EMAIL!,
        subject: `CRITICAL: Security Incident ${incident.id}`,
        text: message
      }),
      sendSlackAlert(process.env.SECURITY_SLACK_CHANNEL!, message),
      sendSMSAlert(process.env.SECURITY_PHONE!, message)
    ])
  }
}
```

### Breach Response

```typescript
// lib/security/breach-response.ts
export class BreachResponse {
  static async handleDataBreach(
    affectedUsers: string[],
    dataTypes: string[],
    severity: string
  ): Promise<void> {
    // 1. Immediate containment
    await this.containBreach()
    
    // 2. Impact assessment
    const impact = await this.assessImpact(affectedUsers, dataTypes)
    
    // 3. Legal notifications
    if (impact.requiresNotification) {
      await this.initiateBreachNotifications(affectedUsers, impact)
    }
    
    // 4. Remediation
    await this.initiateRemediation(impact)
  }

  private static async containBreach(): Promise<void> {
    // Revoke all active sessions
    await redis.flushdb() // Clear all sessions
    
    // Disable API access temporarily
    await redis.set('api_disabled', 'true', 'EX', 3600) // 1 hour
    
    // Alert operations team
    await this.alertOpsTeam('BREACH_CONTAINMENT_ACTIVATED')
  }
}
```

## Compliance

### GDPR Compliance

```typescript
// lib/compliance/gdpr.ts
export class GDPRCompliance {
  static async handleDataDeletionRequest(userId: string): Promise<void> {
    // 1. Verify user identity and request validity
    await this.verifyDeletionRequest(userId)
    
    // 2. Anonymize or delete personal data
    await this.anonymizeUserData(userId)
    
    // 3. Remove from marketing lists
    await this.removeFromMarketing(userId)
    
    // 4. Log compliance action
    await this.logComplianceAction('DATA_DELETION', userId)
  }

  static async handleDataPortabilityRequest(userId: string): Promise<any> {
    const userData = await this.exportUserData(userId)
    
    await this.logComplianceAction('DATA_EXPORT', userId)
    
    return userData
  }

  private static async anonymizeUserData(userId: string): Promise<void> {
    const anonymizedEmail = `deleted-${uuidv4()}@example.com`
    
    await db.transaction(async (trx) => {
      // Anonymize user record
      await trx.update(users)
        .set({
          email: anonymizedEmail,
          name: 'Deleted User',
          affiliation: null,
          bio: null,
          phone: null,
          orcid: null,
          deletedAt: new Date()
        })
        .where(eq(users.id, userId))
      
      // Keep essential data for audit/legal purposes
      // but anonymize personal identifiers
    })
  }
}
```

### HIPAA Compliance (if handling health data)

```typescript
// lib/compliance/hipaa.ts
export class HIPAACompliance {
  static async logHealthDataAccess(
    userId: string,
    patientId: string,
    action: string,
    purpose: string
  ): Promise<void> {
    await db.insert(hipaaAuditLogs).values({
      userId,
      patientId,
      action,
      purpose,
      timestamp: new Date(),
      ipAddress: getCurrentIP(),
      workstation: getCurrentWorkstation()
    })
  }

  static async encryptHealthData(data: any): Promise<string> {
    // Use FIPS 140-2 compliant encryption
    return await encrypt(JSON.stringify(data))
  }
}
```

## Security Testing

### Automated Security Testing

```typescript
// __tests__/security/auth.test.ts
import { testApi } from '../helpers/test-api'

describe('Authentication Security', () => {
  test('should reject requests without valid session', async () => {
    const response = await testApi.get('/api/admin/users')
    expect(response.status).toBe(401)
  })

  test('should reject weak passwords', async () => {
    const response = await testApi.post('/api/auth/register', {
      email: 'test@example.com',
      password: '123456', // Weak password
      name: 'Test User'
    })
    expect(response.status).toBe(400)
    expect(response.body.error).toContain('Password must')
  })

  test('should rate limit login attempts', async () => {
    const email = 'test@example.com'
    
    // Make 6 failed login attempts
    for (let i = 0; i < 6; i++) {
      await testApi.post('/api/auth/login', {
        email,
        password: 'wrongpassword'
      })
    }
    
    // 7th attempt should be rate limited
    const response = await testApi.post('/api/auth/login', {
      email,
      password: 'wrongpassword'
    })
    expect(response.status).toBe(429)
  })
})
```

### Penetration Testing Guidelines

```bash
#!/bin/bash
# security-tests.sh

echo "Running security tests..."

# 1. Check for common vulnerabilities
npm audit --audit-level high

# 2. Check for exposed secrets
git secrets --scan

# 3. Run OWASP dependency check
dependency-check --project "AMHSJ" --scan . --out reports/

# 4. Run static security analysis
semgrep --config=security rules/

# 5. Check Docker image for vulnerabilities
trivy image amhsj:latest

# 6. Test API endpoints
newman run security-tests.postman_collection.json

echo "Security tests completed. Check reports/ directory for results."
```

This security documentation provides a comprehensive overview of the security measures implemented in the AMHSJ platform. Regular security reviews and updates should be conducted to maintain the highest security standards.
