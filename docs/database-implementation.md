# Database Implementation Documentation

## Overview

The Journal Application uses **PostgreSQL** with **Drizzle ORM** and **Neon** as the database provider. This implementation replaces all placeholder database functions with fully functional, production-ready database operations.

## ✅ Completed Features

### Database Infrastructure
- **PostgreSQL Database**: Production-ready relational database
- **Drizzle ORM**: Type-safe database operations
- **Neon Serverless**: Scalable database hosting
- **Connection Pooling**: Optimized database connections
- **Caching Integration**: Redis-backed database caching
- **Migration System**: Automated database migrations
- **Data Seeding**: Initial data setup scripts

### User Management System
- **User Authentication**: Complete signup, login, verification
- **Password Management**: Secure password reset and hashing
- **Profile Management**: Comprehensive user profiles
- **Role-Based Access**: Author, reviewer, editor, admin roles
- **Email Verification**: Automated email verification workflow
- **User Statistics**: Profile completeness and activity tracking

### Database Features
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive error management
- **Transaction Support**: Database transaction handling
- **Query Optimization**: Cached queries and optimized lookups
- **Data Validation**: Input validation and sanitization
- **Audit Trail**: User activity tracking

## Database Schema

### Core Tables

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'author',
  affiliation TEXT,
  orcid TEXT,
  bio TEXT,
  expertise JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  application_status TEXT DEFAULT 'pending',
  profile_completeness INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,
  specializations JSONB,
  languages_spoken JSONB,
  research_interests JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Articles Table
```sql
articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  content TEXT,
  keywords JSONB,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  doi TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  published_date TIMESTAMP,
  submitted_date TIMESTAMP DEFAULT NOW(),
  author_id UUID REFERENCES users(id),
  co_authors JSONB,
  reviewer_ids JSONB,
  editor_id UUID REFERENCES users(id),
  files JSONB,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Reviews Table
```sql
reviews (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  reviewer_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  recommendation TEXT,
  comments TEXT,
  confidential_comments TEXT,
  rating INTEGER,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Extended Tables
- `user_applications` - Role elevation requests
- `user_qualifications` - Academic credentials
- `user_publications` - Publication history
- `user_references` - Professional references
- `reviewer_profiles` - Reviewer-specific data
- `editor_profiles` - Editor-specific data
- `notifications` - System notifications
- `conversations` - Editorial communications
- `messages` - Conversation messages
- `comments` - Article comments/annotations
- `article_versions` - Version control
- `page_views` - Analytics tracking

## Implementation Details

### UserService Class

The `UserService` class provides all user-related database operations:

```typescript
import { UserService } from '@/lib/database'

// Get user by email
const user = await UserService.getUserByEmail('user@example.com')

// Create new user
const newUser = await UserService.createUser(
  'user@example.com',
  'hashedPassword',
  'User Name'
)

// Verify user email
const verified = await UserService.verifyUser('user@example.com', 'token')

// Update user profile
await UserService.updateUserProfile('userId', {
  name: 'Updated Name',
  affiliation: 'New University'
})
```

### Authentication Functions

Enhanced authentication functions in `lib/auth.ts`:

```typescript
import { signup, verifyEmail, requestPasswordReset } from '@/lib/auth'

// User registration
const result = await signup('email@example.com', 'password', 'Full Name')

// Email verification
const verified = await verifyEmail('email@example.com', 'token')

// Password reset request
await requestPasswordReset('email@example.com')
```

### Caching Integration

Database operations are integrated with Redis caching:

```typescript
// Users are cached for 30 minutes
const user = await UserService.getUserByEmail('user@example.com') // Cached

// Cache invalidation on updates
await UserService.updateUserProfile(userId, updates) // Auto-invalidates cache
```

## Database Setup and Migration

### Environment Configuration

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_USER=journal_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=journal_db

# Admin User (for seeding)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password
```

### Migration Commands

```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Database health check
npm run db:health

# Complete setup (migrate + seed + health check)
npm run db:setup
```

### Using Migration Scripts

```typescript
import { runMigrations, seedDatabase, healthCheck } from './scripts/migrate-database'

// Run migrations programmatically
await runMigrations()

// Seed database with admin user
await seedDatabase()

// Check database health
const isHealthy = await healthCheck()
```

## Connection Pooling

Optimized connection configuration:

```typescript
import { db, testConnection, getConnectionStatus } from '@/lib/db'

// Connection pooling settings
- Pool Size: 20 connections
- Idle Timeout: 30 seconds
- Connection Caching: Enabled
- Pipeline Connect: Disabled for stability

// Health monitoring
const status = await getConnectionStatus()
console.log(`Database latency: ${status.latency}ms`)
```

## Error Handling

Comprehensive error handling throughout:

```typescript
// Database operations return null on error
const user = await UserService.getUserByEmail('email@example.com')
if (!user) {
  // Handle user not found
}

// Auth functions return success/failure objects
const result = await signup('email', 'password', 'name')
if (!result.success) {
  console.error(result.message)
}
```

## Performance Optimizations

### Caching Strategy
- **User Lookups**: 30-minute cache
- **User Stats**: 1-hour cache
- **Query Results**: Selective caching
- **Cache Invalidation**: Automatic on updates

### Database Optimizations
- **Connection Pooling**: 20 concurrent connections
- **Query Optimization**: Indexed lookups
- **Lazy Loading**: On-demand data fetching
- **Batch Operations**: Bulk inserts where applicable

### Monitoring
- **Connection Health**: Real-time monitoring
- **Query Performance**: Latency tracking
- **Error Rates**: Automatic error logging
- **Cache Hit Rates**: Redis performance metrics

## Security Features

### Data Protection
- **Password Hashing**: bcrypt with salt rounds 12
- **Token Generation**: UUID-based verification tokens
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Comprehensive data sanitization

### Access Control
- **Role-Based Permissions**: User, reviewer, editor, admin
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based reset
- **Session Management**: Secure user sessions

## Testing

### Database Tests

```bash
# Run database tests
npm test __tests__/database.test.ts

# Run auth tests
npm test __tests__/auth.test.ts

# Run integration tests
npm test -- --grep "Database Integration"
```

### Test Coverage

The database implementation includes comprehensive tests for:
- ✅ User CRUD operations
- ✅ Authentication workflows
- ✅ Email verification
- ✅ Password reset
- ✅ Profile management
- ✅ Error handling
- ✅ Cache integration
- ✅ Data validation

## API Integration

### Database Functions in Auth API

```typescript
// Example: User registration endpoint
export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  
  const result = await signup(email, password, name)
  
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }
  
  return NextResponse.json({ message: result.message })
}
```

### User Profile API

```typescript
// Example: Get user profile endpoint
export async function GET(request: Request) {
  const userId = await getUserIdFromSession(request)
  
  const profile = await getUserProfile(userId)
  
  if (!profile.success) {
    return NextResponse.json({ error: profile.message }, { status: 404 })
  }
  
  return NextResponse.json({ user: profile.user })
}
```

## Monitoring and Maintenance

### Health Monitoring

```typescript
// Database health endpoint
export async function GET() {
  const status = await getConnectionStatus()
  
  return NextResponse.json({
    database: status.connected ? 'healthy' : 'unhealthy',
    latency: status.latency,
    timestamp: status.timestamp
  })
}
```

### Performance Metrics

Monitor these key metrics:
- **Connection Pool Usage**: Active/idle connections
- **Query Response Time**: Average and P95 latency
- **Cache Hit Rate**: Redis cache effectiveness
- **Error Rate**: Database operation failures

### Maintenance Tasks

Regular maintenance includes:
- **Connection Pool Monitoring**: Ensure optimal pool size
- **Cache Cleanup**: Remove expired cache entries
- **Performance Analysis**: Query optimization
- **Backup Verification**: Database backup integrity

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```
   Error: Connection timeout
   Solution: Check DATABASE_URL and network connectivity
   ```

2. **Cache Misses**
   ```
   Issue: High database load
   Solution: Verify Redis connection and cache TTL settings
   ```

3. **Migration Failures**
   ```
   Error: Migration failed
   Solution: Check database permissions and schema conflicts
   ```

### Debugging

```typescript
// Enable debug logging
process.env.NODE_ENV = 'development'

// Test database connection
const isConnected = await testConnection()
console.log(`Database connected: ${isConnected}`)

// Check cache status
import { getEmailQueueStatus } from '@/lib/email'
console.log('Queue status:', getEmailQueueStatus())
```

## Production Deployment

### Environment Setup
1. Configure PostgreSQL database
2. Set up connection pooling
3. Configure environment variables
4. Run migrations and seeding
5. Verify health checks

### Scaling Considerations
1. **Connection Pool Sizing**: Scale based on concurrent users
2. **Cache Strategy**: Implement distributed caching if needed
3. **Read Replicas**: For high-read workloads
4. **Database Sharding**: For massive scale (future consideration)

## Next Steps

After database implementation completion, proceed to:
1. **Testing & Integration** (Day 7)
2. **Workflow System Implementation** (Week 2)
3. **Advanced Features** (Search, Analytics)

---

**Status**: ✅ Database Implementation Complete  
**Last Updated**: June 20, 2025  
**Next Task**: Day 7 - Testing & Integration
