# Architecture Documentation

## System Overview

The AMHSJ (Advances in Medicine and Health Sciences Journal) platform is a modern, scalable academic journal publishing system built using a microservices-inspired architecture with Next.js at its core. The system is designed to handle the complete editorial workflow from manuscript submission to publication.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CDN Layer                             │
│                     (CloudFlare/AWS CloudFront)                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Load Balancer                               │
│                      (Nginx/AWS ALB)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                  Application Layer                              │
│                   Next.js App Router                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Frontend   │ │ API Routes  │ │ Background  │               │
│  │ Components  │ │   & Auth    │ │   Workers   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                  Service Layer                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Email       │ │ File        │ │ Analytics   │ │ External    │ │
│ │ Service     │ │ Management  │ │ Service     │ │ APIs        │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                   Data Layer                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ PostgreSQL  │ │    Redis    │ │  ImageKit   │ │   Search    │ │
│ │ (Primary)   │ │   (Cache)   │ │  (Files)    │ │  Engine     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 15 with App Router
- **UI Components**: React 19 + shadcn/ui + Radix UI
- **Styling**: Tailwind CSS with CSS modules
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.io client

### Backend Layer
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Authentication**: NextAuth.js with JWT
- **ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas
- **File Upload**: Multipart form handling

### Data Layer
- **Primary Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: PostgreSQL Full-text + Elasticsearch (optional)
- **File Storage**: ImageKit CDN
- **Session Store**: Redis-based sessions

### Infrastructure Layer
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Process Management**: PM2 (production)
- **Monitoring**: Sentry + Winston + Custom analytics
- **CI/CD**: GitHub Actions

## Detailed Component Architecture

### 1. Frontend Architecture

```
app/
├── (auth)/              # Authentication routes
├── (dashboard)/         # User dashboard routes  
├── (public)/           # Public routes
├── admin/              # Admin panel
├── api/                # API routes
├── globals.css         # Global styles
├── layout.tsx          # Root layout
└── page.tsx           # Homepage

components/
├── ui/                 # Base UI components
├── forms/             # Form components
├── layouts/           # Layout components
├── features/          # Feature-specific components
└── providers/         # Context providers

lib/
├── auth.ts            # Authentication logic
├── db/                # Database schema & queries
├── email.ts           # Email service
├── utils.ts           # Utility functions
└── validations.ts     # Zod schemas
```

#### Component Hierarchy

```
App Layout
├── Header
│   ├── Navigation
│   ├── User Menu
│   └── Notifications
├── Main Content
│   ├── Sidebar (conditional)
│   └── Page Content
│       ├── Dashboard
│       ├── Article Management
│       ├── Review System
│       └── Admin Panel
└── Footer
    ├── Links
    └── Contact Info
```

### 2. API Architecture

#### Route Structure

```
api/
├── auth/
│   ├── [...nextauth]/     # NextAuth routes
│   ├── register/          # User registration
│   ├── verify-email/      # Email verification
│   └── reset-password/    # Password reset
├── articles/
│   ├── route.ts          # CRUD operations
│   ├── [id]/             # Individual article
│   └── search/           # Search functionality
├── reviews/
│   ├── route.ts          # Review management
│   ├── [id]/             # Individual review
│   └── assignments/      # Review assignments
├── users/
│   ├── route.ts          # User management
│   ├── [id]/             # User profiles
│   └── stats/            # User statistics
├── admin/
│   ├── stats/            # Platform statistics
│   ├── users/            # User administration
│   └── settings/         # System settings
├── integrations/
│   ├── crossref/         # DOI integration
│   ├── orcid/            # ORCID integration
│   └── plagiarism/       # Plagiarism check
└── health/               # Health monitoring
```

#### API Design Patterns

**Controller Pattern:**
```typescript
// api/articles/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const articles = await ArticleService.getArticles({
      userId: session.user.id,
      filters: getFiltersFromRequest(request)
    })

    return NextResponse.json({ success: true, data: articles })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Service Layer Pattern:**
```typescript
// lib/services/article.service.ts
export class ArticleService {
  static async getArticles(params: GetArticlesParams) {
    const cacheKey = `articles:${JSON.stringify(params)}`
    
    // Try cache first
    const cached = await CacheManager.get(cacheKey)
    if (cached) return cached

    // Query database
    const articles = await db.query.articles.findMany({
      where: buildWhereClause(params.filters),
      with: { authors: true, reviews: true }
    })

    // Cache result
    await CacheManager.set(cacheKey, articles, 300) // 5 minutes
    
    return articles
  }
}
```

### 3. Database Architecture

#### Schema Design

```sql
-- Core Entity Relationships
Users 1:N Articles (author_id)
Users 1:N Reviews (reviewer_id)
Articles 1:N Reviews (article_id)
Users 1:1 UserProfiles (user_id)
Articles N:M Users (article_authors junction table)

-- Workflow Relationships
Articles 1:N WorkflowSteps
WorkflowSteps N:1 Users (assigned_to)
Reviews 1:N ReviewComments
Users 1:N Notifications

-- Supporting Relationships
Articles 1:N ArticleFiles
Users 1:N UserQualifications
Users 1:N UserPublications
```

#### Indexing Strategy

```sql
-- Performance Critical Indexes
CREATE INDEX CONCURRENTLY idx_articles_status_category ON articles(status, category);
CREATE INDEX CONCURRENTLY idx_articles_published_date ON articles(published_date DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_reviews_article_reviewer ON reviews(article_id, reviewer_id);
CREATE INDEX CONCURRENTLY idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Full-text Search Indexes
CREATE INDEX CONCURRENTLY idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || abstract || ' ' || keywords));
CREATE INDEX CONCURRENTLY idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || affiliation || ' ' || COALESCE(bio, '')));
```

#### Database Connection Architecture

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connection pool configuration
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, {
  max: 20,                    // Maximum pool size
  idle_timeout: 20,          // Close idle connections after 20s
  connect_timeout: 10,       // Connection timeout
  max_lifetime: 60 * 30,     // 30 minutes max connection lifetime
})

export const db = drizzle(client, { schema })

// Query builder with logging
export class QueryBuilder {
  static withLogging<T>(query: Promise<T>, operation: string): Promise<T> {
    const start = Date.now()
    return query
      .then(result => {
        const duration = Date.now() - start
        logger.info(`DB Query: ${operation} completed in ${duration}ms`)
        return result
      })
      .catch(error => {
        const duration = Date.now() - start
        logger.error(`DB Query: ${operation} failed after ${duration}ms`, error)
        throw error
      })
  }
}
```

### 4. Caching Architecture

#### Multi-Layer Caching Strategy

```typescript
// lib/cache/index.ts
export class CacheManager {
  // Level 1: In-Memory Cache (Node.js process)
  private static memoryCache = new Map<string, { data: any, expires: number }>()
  
  // Level 2: Redis Cache (shared across instances)
  private static redis = new Redis(process.env.REDIS_URL!)

  static async get(key: string): Promise<any> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult && memoryResult.expires > Date.now()) {
      return memoryResult.data
    }

    // Try Redis cache
    const redisResult = await this.redis.get(key)
    if (redisResult) {
      const data = JSON.parse(redisResult)
      // Populate memory cache
      this.memoryCache.set(key, { data, expires: Date.now() + 60000 }) // 1 minute
      return data
    }

    return null
  }

  static async set(key: string, data: any, ttl: number): Promise<void> {
    // Set in Redis with TTL
    await this.redis.setex(key, ttl, JSON.stringify(data))
    
    // Set in memory cache with shorter TTL
    this.memoryCache.set(key, { 
      data, 
      expires: Date.now() + Math.min(ttl * 1000, 300000) // Max 5 minutes
    })
  }
}
```

#### Cache Invalidation Strategy

```typescript
// lib/cache/invalidation.ts
export class CacheInvalidator {
  static async invalidateArticle(articleId: string) {
    const patterns = [
      `article:${articleId}`,
      `articles:*`,
      `user:articles:*`,
      `search:*`
    ]
    
    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)))
  }

  static async invalidateUser(userId: string) {
    const patterns = [
      `user:${userId}`,
      `user:stats:${userId}`,
      `articles:author:${userId}`,
      `reviews:reviewer:${userId}`
    ]
    
    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)))
  }

  private static async invalidatePattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
```

### 5. Security Architecture

#### Authentication Flow

```
User Login Request
    ↓
Credentials Validation
    ↓
JWT Token Generation (NextAuth)
    ↓
Session Storage (Redis)
    ↓
Client Cookie (httpOnly, secure)
    ↓
Request Authentication Middleware
    ↓
Route Authorization Check
    ↓
Resource Access
```

#### Security Middleware Stack

```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    // Rate limiting
    if (!rateLimiter.check(req.ip)) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }

    // CSRF protection
    if (!csrfProtection.validate(req)) {
      return new NextResponse("CSRF Token Invalid", { status: 403 })
    }

    // Role-based access control
    if (!hasRequiredRole(req.nextauth.token, req.nextUrl.pathname)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        return token?.role !== undefined
      }
    }
  }
)
```

#### Input Validation Architecture

```typescript
// lib/validations/index.ts
export const createArticleSchema = z.object({
  title: z.string().min(10).max(200),
  abstract: z.string().min(100).max(3000),
  keywords: z.array(z.string()).min(3).max(10),
  category: z.enum(medicalCategories),
  content: z.string().min(1000),
  authors: z.array(authorSchema).min(1)
})

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest, context: any, next: any) => {
    try {
      const body = await req.json()
      const validated = schema.parse(body)
      req.validatedData = validated
      return next()
    } catch (error) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

### 6. File Management Architecture

#### Upload Strategy

```typescript
// lib/file-management/index.ts
export class FileManager {
  static async uploadFile(file: File, type: FileType, userId: string) {
    // Validate file
    this.validateFile(file, type)
    
    // Generate unique filename
    const filename = this.generateFilename(file, userId)
    
    // Upload to ImageKit
    const uploadResult = await imagekit.upload({
      file: await file.arrayBuffer(),
      fileName: filename,
      folder: `/uploads/${type}s/`,
      useUniqueFileName: false,
      tags: [type, userId]
    })

    // Store metadata in database
    await db.insert(files).values({
      id: uuidv4(),
      originalName: file.name,
      storedName: filename,
      url: uploadResult.url,
      size: file.size,
      mimeType: file.type,
      type,
      userId,
      uploadedAt: new Date()
    })

    return uploadResult
  }

  private static validateFile(file: File, type: FileType) {
    const maxSizes = {
      manuscript: 25 * 1024 * 1024,  // 25MB
      figure: 10 * 1024 * 1024,      // 10MB
      avatar: 2 * 1024 * 1024        // 2MB
    }

    const allowedTypes = {
      manuscript: ['application/pdf', 'application/msword'],
      figure: ['image/jpeg', 'image/png', 'image/tiff'],
      avatar: ['image/jpeg', 'image/png']
    }

    if (file.size > maxSizes[type]) {
      throw new Error(`File too large. Maximum size: ${maxSizes[type]} bytes`)
    }

    if (!allowedTypes[type].includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes[type].join(', ')}`)
    }
  }
}
```

### 7. Background Job Architecture

#### Job Queue System

```typescript
// lib/jobs/index.ts
import Queue from 'bull'

const emailQueue = new Queue('email processing', process.env.REDIS_URL!)
const notificationQueue = new Queue('notifications', process.env.REDIS_URL!)
const analyticsQueue = new Queue('analytics', process.env.REDIS_URL!)

// Email job processor
emailQueue.process('send-email', async (job) => {
  const { to, subject, html, template, data } = job.data
  
  try {
    await EmailService.send({
      to,
      subject,
      html: template ? await renderTemplate(template, data) : html
    })
    
    await AnalyticsService.track('email_sent', {
      to,
      template,
      success: true
    })
  } catch (error) {
    await AnalyticsService.track('email_failed', {
      to,
      template,
      error: error.message
    })
    throw error
  }
})

// Notification job processor
notificationQueue.process('send-notification', async (job) => {
  const { userId, title, message, type } = job.data
  
  // Create database notification
  await NotificationService.create({ userId, title, message, type })
  
  // Send real-time notification via WebSocket
  await WebSocketService.sendToUser(userId, {
    type: 'notification',
    data: { title, message, type }
  })
})

export { emailQueue, notificationQueue, analyticsQueue }
```

### 8. Real-time Architecture

#### WebSocket Implementation

```typescript
// lib/websocket/index.ts
import { Server as SocketIOServer } from 'socket.io'
import { getSession } from 'next-auth/react'

export class WebSocketManager {
  private static io: SocketIOServer
  private static userSockets = new Map<string, Set<string>>()

  static initialize(server: any) {
    this.io = new SocketIOServer(server, {
      path: '/api/socket',
      cors: { origin: "*" }
    })

    this.io.on('connection', async (socket) => {
      // Authenticate socket connection
      const session = await this.authenticateSocket(socket)
      if (!session) {
        socket.disconnect()
        return
      }

      const userId = session.user.id
      
      // Track user connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)!.add(socket.id)

      // Handle disconnection
      socket.on('disconnect', () => {
        const userSocketSet = this.userSockets.get(userId)
        if (userSocketSet) {
          userSocketSet.delete(socket.id)
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId)
          }
        }
      })

      // Handle real-time collaboration
      socket.on('join-document', (documentId) => {
        socket.join(`document-${documentId}`)
      })

      socket.on('document-update', (data) => {
        socket.to(`document-${data.documentId}`).emit('document-update', data)
      })
    })
  }

  static sendToUser(userId: string, data: any) {
    const userSockets = this.userSockets.get(userId)
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('message', data)
      })
    }
  }
}
```

### 9. Monitoring & Analytics Architecture

#### Application Monitoring

```typescript
// lib/monitoring/index.ts
export class MonitoringService {
  static async trackPerformance(operation: string, fn: () => Promise<any>) {
    const start = process.hrtime.bigint()
    let success = true
    let error: any = null

    try {
      const result = await fn()
      return result
    } catch (err) {
      success = false
      error = err
      throw err
    } finally {
      const end = process.hrtime.bigint()
      const duration = Number(end - start) / 1000000 // Convert to milliseconds

      // Log performance metrics
      logger.info('Performance metric', {
        operation,
        duration,
        success,
        error: error?.message
      })

      // Send to analytics
      await AnalyticsService.track('performance', {
        operation,
        duration,
        success,
        timestamp: new Date()
      })
    }
  }

  static async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices()
    ])

    return {
      status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'degraded',
      timestamp: new Date(),
      services: {
        database: checks[0].status,
        redis: checks[1].status,
        external: checks[2].status
      }
    }
  }
}
```

### 10. Scalability Considerations

#### Horizontal Scaling Strategy

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amhsj-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: app
        image: amhsj/app:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
```

#### Database Scaling

```sql
-- Read replica configuration
-- Primary database handles writes
-- Read replicas handle read queries

-- Query routing in application
class DatabaseRouter {
  static async read(query: string) {
    return readReplica.query(query)
  }
  
  static async write(query: string) {
    return primaryDatabase.query(query)
  }
}
```

#### CDN Integration

```typescript
// lib/cdn/index.ts
export class CDNManager {
  static getAssetUrl(path: string): string {
    if (process.env.NODE_ENV === 'production') {
      return `${process.env.CDN_URL}${path}`
    }
    return path
  }

  static async invalidateCache(paths: string[]) {
    // Invalidate CDN cache for updated assets
    await fetch(`${process.env.CDN_API}/purge`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CDN_TOKEN}` },
      body: JSON.stringify({ files: paths })
    })
  }
}
```

## Performance Optimization

### Database Optimization

1. **Query Optimization**
   - Use appropriate indexes
   - Implement query result caching
   - Use connection pooling
   - Optimize N+1 queries

2. **Connection Management**
   - Pool size tuning
   - Connection timeout configuration
   - Query timeout limits

### Caching Strategy

1. **Application-level Caching**
   - Redis for session storage
   - Query result caching
   - Computed data caching

2. **CDN Caching**
   - Static asset caching
   - API response caching
   - Image optimization

### Code Optimization

1. **Bundle Optimization**
   - Code splitting
   - Tree shaking
   - Minification

2. **Runtime Optimization**
   - Lazy loading
   - Image optimization
   - Font optimization

This architecture documentation provides a comprehensive overview of the AMHSJ platform's technical design, showing how all components work together to create a robust, scalable academic journal management system.
