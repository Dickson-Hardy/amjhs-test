# Redis Setup Documentation

## Overview
This documentation covers the Redis integration for the Academic Journal Platform, including caching, rate limiting, and analytics.

## Installation & Configuration

### Local Development

1. **Install Redis** (Choose one option):
   ```bash
   # Option 1: Using Docker
   docker run --name redis-journal -p 6379:6379 -d redis:7-alpine
   
   # Option 2: Using Windows (via Chocolatey)
   choco install redis-64
   
   # Option 3: Using WSL/Linux
   sudo apt-get install redis-server
   ```

2. **Environment Variables**:
   Create a `.env.local` file with:
   ```env
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

3. **Test Connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Production Deployment

1. **Docker Compose** (Recommended):
   ```bash
   docker-compose up -d redis
   ```

2. **Cloud Redis Services**:
   - **AWS ElastiCache**: Set `REDIS_URL` to your ElastiCache endpoint
   - **Azure Cache for Redis**: Use connection string format
   - **Google Cloud Memorystore**: Configure with VPC settings
   - **Upstash Redis**: Serverless Redis option

## Features Implemented

### 1. Caching System (`lib/cache.ts`)
- **Dual-layer caching**: Redis primary, in-memory fallback
- **Automatic expiration**: TTL support for all cache operations
- **Pattern invalidation**: Wildcard key deletion
- **Article-specific caching**: Optimized for content delivery

**Usage Examples**:
```typescript
// Basic operations
await CacheManager.set('key', data, 3600) // 1 hour TTL
const data = await CacheManager.get('key')
await CacheManager.del('key')

// Article caching
await CacheManager.cacheArticle('article-123', articleData)
const article = await CacheManager.getCachedArticle('article-123')

// Pattern invalidation
await CacheManager.invalidatePattern('articles:*')
```

### 2. Rate Limiting (`lib/rate-limit.ts`)
- **Sliding window**: More accurate than fixed windows
- **Multiple endpoints**: Different limits for auth vs API
- **IP-based tracking**: Automatic IP extraction
- **Custom key generation**: User-based or custom logic

**Configuration**:
```typescript
// API rate limiting: 100 requests per 15 minutes
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100
})

// Auth rate limiting: 5 attempts per 15 minutes
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5
})
```

### 3. Analytics Caching (`lib/analytics.ts`)
- **Metrics caching**: Article view counts, user analytics
- **Performance optimization**: Reduces database load
- **Real-time data**: Cached for 1 hour, fresh data on cache miss

## Monitoring & Maintenance

### Health Checks
The system includes automatic health monitoring:
```typescript
import { redis } from '@/lib/redis'

// Check Redis connection
const isHealthy = await redis.ping() === 'PONG'
```

### Cache Statistics
Monitor cache performance:
```bash
# Redis CLI commands
redis-cli info memory
redis-cli info stats
redis-cli monitor  # Real-time command monitoring
```

### Memory Management
- **Automatic cleanup**: Expired keys are automatically removed
- **Memory limits**: Configure `maxmemory` and `maxmemory-policy`
- **Key patterns**: Use consistent naming for easy maintenance

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if Redis server is running: `redis-cli ping`
   - Verify environment variables
   - Check firewall settings

2. **High Memory Usage**:
   - Monitor key expiration settings
   - Use `redis-cli memory usage <key>` to debug
   - Consider shorter TTL values

3. **Slow Performance**:
   - Check Redis memory usage
   - Monitor network latency
   - Use Redis pipeline for bulk operations

### Fallback Behavior
The system automatically falls back to in-memory caching when Redis is unavailable:
- No service interruption
- Reduced performance (no persistence)
- Automatic recovery when Redis reconnects

## Security Best Practices

1. **Authentication**: Set `REDIS_PASSWORD` in production
2. **Network Security**: Use VPC/private networks
3. **Encryption**: Enable TLS for data in transit
4. **Access Control**: Limit Redis command access

## Performance Optimization

### Recommended Settings
```redis
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

### Key Naming Conventions
- `article:{id}` - Individual articles
- `metrics:{articleId}` - Article metrics
- `ratelimit:{ip}` - Rate limiting data
- `session:{sessionId}` - User sessions

## Testing
Run Redis integration tests:
```bash
pnpm test __tests__/redis.test.ts
pnpm test __tests__/rate-limit.test.ts
```

## Deployment Checklist

- [ ] Redis server running and accessible
- [ ] Environment variables configured
- [ ] Health checks passing
- [ ] Rate limiting functional
- [ ] Cache operations working
- [ ] Analytics caching enabled
- [ ] Security settings applied
- [ ] Monitoring configured

## Support
For issues or questions:
1. Check logs: `docker logs redis-journal`
2. Verify configuration: Review environment variables
3. Test connection: Use Redis CLI
4. Monitor metrics: Check application logs
