# Redis Setup and Configuration Guide

## Overview

This guide covers the Redis integration for the Academic Journal Platform, including setup, configuration, and usage.

## Redis Features Implemented

### ✅ Completed Features
- **Cache Management**: Full Redis-based caching with memory fallback
- **Rate Limiting**: API and authentication rate limiting using Redis
- **Analytics Caching**: Cached article metrics and analytics data
- **Session Management**: Redis-based session storage
- **Search Caching**: Cached search results for improved performance

### 🔧 Redis Services

1. **CacheManager** (`lib/cache.ts`)
   - Article data caching
   - Search results caching
   - Pattern-based cache invalidation
   - Automatic fallback to memory cache

2. **Rate Limiting** (`lib/rate-limit.ts`)
   - API endpoint rate limiting
   - Authentication rate limiting
   - IP-based request tracking

3. **Analytics** (`lib/analytics.ts`)
   - Article metrics caching
   - Performance data storage
   - Real-time analytics

## Setup Instructions

### Local Development

1. **Install Redis**
   ```bash
   # Using Docker (Recommended)
   docker run -d --name redis -p 6379:6379 redis:7-alpine

   # Or using package manager
   # Windows (using Chocolatey)
   choco install redis-64

   # macOS (using Homebrew)
   brew install redis

   # Ubuntu/Debian
   sudo apt install redis-server
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Redis configuration:
   ```env
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

3. **Start Redis Server**
   ```bash
   # If using Docker
   docker start redis

   # If installed locally
   redis-server
   ```

4. **Verify Connection**
   ```bash
   # Test Redis connection
   redis-cli ping
   # Should return: PONG
   ```

### Production Deployment

1. **Using Docker Compose**
   ```bash
   docker-compose up -d redis
   ```

2. **Environment Variables for Production**
   ```env
   REDIS_URL=redis://username:password@your-redis-host:6379
   REDIS_PASSWORD=your_secure_password
   ```

3. **Redis Configuration Options**
   - **Memory Limit**: Set maxmemory policy
   - **Persistence**: Configure RDB/AOF
   - **Security**: Enable AUTH, configure firewall
   - **Clustering**: For high availability

## Usage Examples

### Cache Management

```typescript
import { CacheManager } from '@/lib/cache'

// Set cache with 1 hour expiration
await CacheManager.set('user:123', userData, 3600)

// Get cached data
const user = await CacheManager.get('user:123')

// Cache article data
await CacheManager.cacheArticle('article:456', articleData)

// Get cached article
const article = await CacheManager.getCachedArticle('article:456')

// Invalidate cache pattern
await CacheManager.invalidatePattern('user:*')
```

### Rate Limiting

```typescript
import { apiRateLimit } from '@/lib/rate-limit'

// Check rate limit
const { allowed, remaining, resetTime } = await apiRateLimit.isAllowed(request)

if (!allowed) {
  return new Response('Too Many Requests', { status: 429 })
}
```

### Analytics Caching

```typescript
import { getArticleMetrics } from '@/lib/analytics'

// Get cached metrics (automatically cached for 1 hour)
const metrics = await getArticleMetrics('article:123')
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check Redis status
redis-cli info server

# Monitor Redis performance
redis-cli monitor

# Check memory usage
redis-cli info memory
```

### Cache Statistics

```bash
# View cache hit/miss ratio
redis-cli info stats

# Check connected clients
redis-cli info clients

# View keyspace information
redis-cli info keyspace
```

### Maintenance Commands

```bash
# Flush all cache (use with caution)
redis-cli flushall

# Flush current database
redis-cli flushdb

# Check cache size
redis-cli dbsize
```

## Performance Optimization

### Cache TTL Guidelines
- **User Sessions**: 24 hours
- **Article Data**: 2 hours
- **Search Results**: 30 minutes
- **Analytics Metrics**: 1 hour
- **Static Content**: 7 days

### Memory Management
- Set appropriate `maxmemory` limit
- Use `allkeys-lru` eviction policy
- Monitor memory usage regularly

### Connection Pooling
- Use connection pooling for high-traffic applications
- Configure appropriate connection limits
- Monitor connection health

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Check Redis logs
   tail -f /var/log/redis/redis-server.log
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   redis-cli info memory
   
   # Clear cache if needed
   redis-cli flushdb
   ```

3. **Performance Issues**
   ```bash
   # Monitor slow queries
   redis-cli slowlog get 10
   
   # Check for long-running commands
   redis-cli client list
   ```

### Fallback Behavior

The application automatically falls back to in-memory caching when Redis is unavailable:
- Cache operations continue with memory fallback
- Rate limiting uses in-memory counters
- No data loss occurs during Redis outages

## Security Best Practices

1. **Authentication**
   - Always set a strong Redis password
   - Use AUTH command in production

2. **Network Security**
   - Bind Redis to specific interfaces
   - Use firewall rules to restrict access
   - Consider Redis over TLS

3. **Access Control**
   - Limit Redis commands if possible
   - Use Redis ACLs for fine-grained control

## Testing

Run Redis integration tests:
```bash
# Run all tests
npm test

# Run Redis-specific tests
npm test __tests__/redis.test.ts

# Run cache tests
npm test __tests__/cache.test.ts
```

## Migration and Backup

### Data Migration
```bash
# Export Redis data
redis-cli --rdb dump.rdb

# Import Redis data
redis-cli --pipe < dump.rdb
```

### Backup Strategy
- Regular RDB snapshots
- AOF for point-in-time recovery
- Automated backup scripts

## Next Steps

After Redis setup completion, the next priorities are:
1. Email service integration (Day 3-4)
2. Database implementation (Day 5-6)
3. Comprehensive testing (Day 7)

---

**Last Updated**: June 20, 2025  
**Status**: ✅ Redis Integration Complete
