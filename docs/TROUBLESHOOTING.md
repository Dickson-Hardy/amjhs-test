# Troubleshooting Guide

This guide covers common issues and their solutions for the AMHSJ platform.

## Table of Contents

- [Application Issues](#application-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Integration Issues](#integration-issues)
- [Development Issues](#development-issues)
- [Monitoring & Debugging](#monitoring--debugging)

## Application Issues

### Server Won't Start

**Symptoms:**
- Application fails to start
- Port binding errors
- Module not found errors

**Diagnosis:**
```bash
# Check if port is in use
netstat -tulpn | grep :3000
lsof -i :3000

# Check Node.js version
node --version

# Check dependencies
npm ls --depth=0
```

**Solutions:**

1. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   kill -9 $(lsof -t -i:3000)
   
   # Or use different port
   PORT=3001 npm run dev
   ```

2. **Missing Dependencies**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Node Version Mismatch**
   ```bash
   # Use Node Version Manager
   nvm install 18
   nvm use 18
   ```

### Build Failures

**Symptoms:**
- TypeScript compilation errors
- Missing module errors
- Build process hangs

**Diagnosis:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Verbose build output
npm run build -- --verbose

# Check memory usage during build
node --max_old_space_size=4096 node_modules/.bin/next build
```

**Solutions:**

1. **TypeScript Errors**
   ```bash
   # Generate missing types
   npm run generate-types
   
   # Skip type checking (temporary)
   SKIP_TYPE_CHECK=true npm run build
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max_old_space_size=4096" npm run build
   ```

3. **Dependency Issues**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Update dependencies
   npm update
   ```

### Runtime Errors

**Symptoms:**
- 500 Internal Server Error
- Component rendering errors
- API endpoint failures

**Diagnosis:**
```bash
# Check application logs
docker-compose logs -f app

# Check error details in browser console
# Check network tab for failed requests

# Enable debug mode
DEBUG=* npm run dev
```

**Solutions:**

1. **Check Environment Variables**
   ```bash
   # Verify all required env vars are set
   node -e "console.log(process.env)" | grep -i database
   
   # Test database connection
   node -e "
   const { db } = require('./lib/db');
   db.select().from(users).limit(1).then(console.log).catch(console.error);
   "
   ```

2. **Component Errors**
   ```typescript
   // Add error boundary
   class ErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       console.error('Component error:', error, errorInfo)
     }
     
     render() {
       if (this.state.hasError) {
         return <div>Something went wrong.</div>
       }
       return this.props.children
     }
   }
   ```

## Database Issues

### Connection Failures

**Symptoms:**
- "Connection refused" errors
- Timeout errors
- Authentication failures

**Diagnosis:**
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d amhsj -c "SELECT 1;"

# Check PostgreSQL status
systemctl status postgresql
docker-compose exec postgres pg_isready

# Check connection string
echo $DATABASE_URL
```

**Solutions:**

1. **PostgreSQL Not Running**
   ```bash
   # Start PostgreSQL service
   sudo systemctl start postgresql
   
   # Or with Docker
   docker-compose up -d postgres
   ```

2. **Wrong Connection Parameters**
   ```bash
   # Verify connection string format
   # postgresql://username:password@host:port/database
   
   # Test with psql
   psql "postgresql://user:pass@localhost:5432/amhsj"
   ```

3. **Authentication Issues**
   ```bash
   # Check pg_hba.conf
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   
   # Ensure md5 or trust authentication for local connections
   local   all             all                                     md5
   ```

### Migration Failures

**Symptoms:**
- Migration scripts fail
- Schema version conflicts
- Data integrity errors

**Diagnosis:**
```bash
# Check migration status
npm run db:status

# Check current schema version
psql -d amhsj -c "SELECT * FROM drizzle.__drizzle_migrations;"

# Check for conflicting changes
git diff HEAD~1 lib/db/schema.ts
```

**Solutions:**

1. **Reset Migrations**
   ```bash
   # Rollback to previous migration
   npm run db:rollback
   
   # Generate new migration
   npm run db:generate
   
   # Apply migration
   npm run db:migrate
   ```

2. **Manual Schema Fix**
   ```sql
   -- Connect to database
   psql -d amhsj
   
   -- Check table structure
   \d articles
   
   -- Fix missing columns manually
   ALTER TABLE articles ADD COLUMN IF NOT EXISTS doi VARCHAR(255);
   ```

### Performance Issues

**Symptoms:**
- Slow query execution
- High CPU usage
- Connection pool exhaustion

**Diagnosis:**
```sql
-- Check running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check table sizes
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename = 'articles';

-- Check index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public';
```

**Solutions:**

1. **Add Missing Indexes**
   ```sql
   -- Create missing indexes
   CREATE INDEX CONCURRENTLY idx_articles_status ON articles(status);
   CREATE INDEX CONCURRENTLY idx_articles_category ON articles(category);
   ```

2. **Optimize Queries**
   ```sql
   -- Use EXPLAIN ANALYZE to check query plans
   EXPLAIN ANALYZE SELECT * FROM articles WHERE status = 'published';
   
   -- Optimize with proper WHERE clauses and JOINs
   ```

3. **Connection Pool Tuning**
   ```typescript
   // lib/db/index.ts
   const client = postgres(connectionString, {
     max: 20,                    // Increase pool size
     idle_timeout: 20,
     connect_timeout: 10,
   })
   ```

## Authentication Issues

### Login Failures

**Symptoms:**
- Invalid credentials errors
- Session not persisting
- Redirect loops

**Diagnosis:**
```bash
# Check NextAuth configuration
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Check database for user
psql -d amhsj -c "SELECT id, email, password FROM users WHERE email = 'user@example.com';"

# Check browser cookies
# Open Developer Tools > Application > Cookies
```

**Solutions:**

1. **Missing NextAuth Secret**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Add to .env.local
   NEXTAUTH_SECRET=your-generated-secret
   ```

2. **Password Hash Issues**
   ```javascript
   // Test password hashing
   const bcrypt = require('bcryptjs')
   const password = 'testpassword'
   const hash = bcrypt.hashSync(password, 12)
   console.log('Hash:', hash)
   console.log('Verify:', bcrypt.compareSync(password, hash))
   ```

3. **Session Issues**
   ```typescript
   // Check session configuration
   // lib/auth.ts
   export const authOptions: NextAuthOptions = {
     session: {
       strategy: "jwt",
       maxAge: 30 * 24 * 60 * 60, // 30 days
     },
     // ...
   }
   ```

### Email Verification Issues

**Symptoms:**
- Verification emails not sent
- Invalid token errors
- Expired token errors

**Diagnosis:**
```bash
# Check email configuration
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER

# Test email sending
node -e "
const { sendEmail } = require('./lib/email');
sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test email</p>'
}).then(console.log).catch(console.error);
"
```

**Solutions:**

1. **SMTP Configuration**
   ```env
   # Gmail example
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password  # Not your regular password
   ```

2. **Token Expiration**
   ```sql
   -- Check token expiration
   SELECT email, email_verification_token, created_at 
   FROM users 
   WHERE email_verification_token IS NOT NULL;
   
   -- Extend token validity or regenerate
   UPDATE users 
   SET email_verification_token = 'new-token', 
       updated_at = NOW() 
   WHERE email = 'user@example.com';
   ```

## Performance Issues

### Slow Page Loading

**Symptoms:**
- High Time to First Byte (TTFB)
- Large bundle sizes
- Slow API responses

**Diagnosis:**
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/articles"

# Monitor resource usage
htop
iostat 1
```

**Solutions:**

1. **Bundle Optimization**
   ```javascript
   // next.config.mjs
   const nextConfig = {
     experimental: {
       optimizeCss: true,
     },
     compiler: {
       removeConsole: process.env.NODE_ENV === 'production',
     },
   }
   ```

2. **Image Optimization**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image'
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority={false}
   />
   ```

3. **API Optimization**
   ```typescript
   // Add caching to API routes
   import { CacheManager } from '@/lib/cache'
   
   export async function GET() {
     const cacheKey = 'articles:published'
     const cached = await CacheManager.get(cacheKey)
     
     if (cached) {
       return NextResponse.json(cached)
     }
     
     const articles = await getPublishedArticles()
     await CacheManager.set(cacheKey, articles, 300) // 5 minutes
     
     return NextResponse.json(articles)
   }
   ```

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Out of memory errors
- Application crashes

**Diagnosis:**
```bash
# Monitor memory usage
node --inspect app.js
# Open chrome://inspect in Chrome

# Check for memory leaks
npm install -g clinic
clinic doctor -- npm start

# Monitor with PM2
pm2 monit
```

**Solutions:**

1. **Fix Event Listener Leaks**
   ```typescript
   // Remove event listeners in cleanup
   useEffect(() => {
     const handleResize = () => { /* ... */ }
     window.addEventListener('resize', handleResize)
     
     return () => {
       window.removeEventListener('resize', handleResize)
     }
   }, [])
   ```

2. **Database Connection Management**
   ```typescript
   // Properly close database connections
   process.on('SIGINT', async () => {
     await db.destroy()
     process.exit(0)
   })
   ```

### Redis Connection Issues

**Symptoms:**
- Cache misses
- Connection timeouts
- Redis server errors

**Diagnosis:**
```bash
# Test Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Monitor Redis operations
redis-cli monitor
```

**Solutions:**

1. **Connection Configuration**
   ```typescript
   // lib/redis.ts
   import Redis from 'ioredis'
   
   export const redis = new Redis(process.env.REDIS_URL!, {
     retryDelayOnFailover: 100,
     maxRetriesPerRequest: 3,
     lazyConnect: true,
   })
   ```

2. **Memory Management**
   ```bash
   # Configure Redis memory limit
   redis-cli config set maxmemory 512mb
   redis-cli config set maxmemory-policy allkeys-lru
   ```

## Deployment Issues

### Docker Build Failures

**Symptoms:**
- Docker build hangs
- Out of space errors
- Dependency installation failures

**Diagnosis:**
```bash
# Check Docker disk usage
docker system df

# Check build logs
docker build -t amhsj . --no-cache --progress=plain

# Check available space
df -h
```

**Solutions:**

1. **Clean Docker System**
   ```bash
   # Remove unused containers and images
   docker system prune -a
   
   # Remove unused volumes
   docker volume prune
   ```

2. **Multi-stage Build Optimization**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

### SSL Certificate Issues

**Symptoms:**
- HTTPS not working
- Certificate validation errors
- Mixed content warnings

**Diagnosis:**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check certificate chain
curl -I https://your-domain.com
```

**Solutions:**

1. **Renew Let's Encrypt Certificate**
   ```bash
   # Manual renewal
   sudo certbot renew
   
   # Automatic renewal (crontab)
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

2. **Update Nginx Configuration**
   ```nginx
   # nginx.conf
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
   }
   ```

## Integration Issues

### Email Service Failures

**Symptoms:**
- Emails not being sent
- SMTP authentication errors
- Rate limiting errors

**Diagnosis:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check email queue
redis-cli llen "bull:email processing:waiting"

# Check email service logs
docker-compose logs -f app | grep email
```

**Solutions:**

1. **Gmail App Password**
   ```env
   # Use app-specific password for Gmail
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

2. **Email Queue Configuration**
   ```typescript
   // lib/jobs/email.ts
   import Queue from 'bull'
   
   const emailQueue = new Queue('email processing', process.env.REDIS_URL!, {
     defaultJobOptions: {
       removeOnComplete: 10,
       removeOnFail: 5,
       attempts: 3,
       backoff: {
         type: 'exponential',
         delay: 2000,
       },
     },
   })
   ```

### File Upload Issues

**Symptoms:**
- Upload failures
- File size errors
- ImageKit integration errors

**Diagnosis:**
```bash
# Check ImageKit configuration
curl -X GET "https://api.imagekit.io/v1/files" \
  -H "Authorization: Basic $(echo -n 'your_private_key:' | base64)"

# Check file upload limits
grep -r "maxFileSize" .
grep -r "client_max_body_size" nginx.conf
```

**Solutions:**

1. **Increase Upload Limits**
   ```nginx
   # nginx.conf
   client_max_body_size 25M;
   ```
   
   ```javascript
   // next.config.mjs
   const nextConfig = {
     experimental: {
       serverComponentsExternalPackages: ['sharp'],
     },
     api: {
       bodyParser: {
         sizeLimit: '25mb',
       },
     },
   }
   ```

2. **ImageKit Configuration**
   ```typescript
   // lib/imagekit.ts
   import ImageKit from 'imagekit'
   
   const imagekit = new ImageKit({
     publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
     privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
     urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
   })
   ```

## Development Issues

### Hot Reload Not Working

**Symptoms:**
- Changes not reflected in browser
- Development server not restarting
- TypeScript errors not updating

**Solutions:**

1. **Clear Next.js Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check File Watchers**
   ```bash
   # Increase file watcher limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart Development Server**
   ```bash
   # Kill any running processes
   pkill -f "next dev"
   npm run dev
   ```

### TypeScript Errors

**Symptoms:**
- Type checking failures
- Import errors
- Missing type definitions

**Solutions:**

1. **Update TypeScript Configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true
     },
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
     "exclude": ["node_modules"]
   }
   ```

2. **Install Missing Types**
   ```bash
   npm install @types/node @types/react @types/react-dom
   ```

## Monitoring & Debugging

### Enable Debug Logging

```bash
# Enable all debug logs
DEBUG=* npm run dev

# Enable specific debug logs
DEBUG=drizzle:query npm run dev
DEBUG=next:* npm run dev
```

### Application Metrics

```typescript
// lib/monitoring/metrics.ts
export class Metrics {
  static async collectMetrics() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: await getActiveConnections(),
      queueStats: await getQueueStats(),
      cacheHitRate: await getCacheHitRate(),
    }
  }
}
```

### Health Check Endpoints

```typescript
// api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      email: await checkEmailService(),
    }
  }
  
  const isHealthy = Object.values(health.services).every(
    service => service === 'healthy'
  )
  
  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503
  })
}
```

### Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function initErrorTracking() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  })
}

export function captureError(error: Error, context?: any) {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('additional', context)
    }
    Sentry.captureException(error)
  })
}
```

### Log Analysis

```bash
# Real-time log monitoring
tail -f logs/app.log | grep ERROR

# Search for specific errors
grep -r "Database connection failed" logs/

# Analyze error patterns
awk '/ERROR/ {print $1, $2, $5}' logs/app.log | sort | uniq -c
```

### Performance Profiling

```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect app.js
# Open Chrome DevTools > Memory tab
```

## Getting Help

### Collect Debug Information

Before seeking help, collect the following information:

```bash
#!/bin/bash
# debug-info.sh

echo "=== System Information ==="
uname -a
node --version
npm --version
docker --version

echo "=== Application Status ==="
docker-compose ps
pm2 status

echo "=== Recent Logs ==="
tail -n 50 logs/app.log

echo "=== Environment Check ==="
env | grep -E "(DATABASE|REDIS|NEXTAUTH)" | sed 's/=.*/=***/'

echo "=== Disk Usage ==="
df -h

echo "=== Memory Usage ==="
free -h
```

### Common Log Patterns

Search for these patterns in your logs:

```bash
# Database issues
grep -i "connection.*failed\|timeout\|deadlock" logs/app.log

# Authentication issues
grep -i "unauthorized\|forbidden\|invalid.*token" logs/app.log

# Performance issues
grep -i "slow.*query\|timeout\|memory" logs/app.log

# Integration issues
grep -i "api.*error\|external.*service" logs/app.log
```

### Contact Support

For issues not covered in this guide:

1. **Check GitHub Issues**: Search existing issues and discussions
2. **Create Detailed Issue**: Include debug information, logs, and steps to reproduce
3. **Emergency Support**: For critical production issues, contact emergency support

Remember to never share sensitive information like passwords, tokens, or personal data in support requests.
