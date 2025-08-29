/**
 * Advanced Caching System
 * Enterprise-grade caching with Redis, memory cache, and CDN integration
 */

import { Redis } from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { createHash } from 'crypto'
import { z } from 'zod'

// Cache configuration
const CACHE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    lazyConnect: true,
  },
  memory: {
    max: 500, // Maximum number of items
    ttl: 1000 * 60 * 15, // 15 minutes
    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  },
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    baseUrl: process.env.CDN_BASE_URL,
    purgeKey: process.env.CDN_PURGE_KEY,
  }
}

// Cache levels enum
export enum CacheLevel {
  MEMORY = 'memory',
  REDIS = 'redis',
  CDN = 'cdn',
  ALL = 'all'
}

// Cache TTL presets
export const CacheTTL = {
  VERY_SHORT: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
  MONTH: 2592000, // 30 days
} as const

// Cache key patterns
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  ARTICLE_CONTENT: (articleId: string) => `article:content:${articleId}`,
  ARTICLE_METADATA: (articleId: string) => `article:metadata:${articleId}`,
  SEARCH_RESULTS: (query: string, filters: string) => 
    `search:${createHash('md5').update(`${query}:${filters}`).digest('hex')}`,
  AUTHOR_WORKS: (authorId: string) => `author:works:${authorId}`,
  JOURNAL_STATS: () => 'journal:stats',
  SUBMISSION_COUNT: (period: string) => `submissions:count:${period}`,
  REVIEWER_ASSIGNMENTS: (reviewerId: string) => `reviewer:assignments:${reviewerId}`,
  CITATION_DATA: (doi: string) => `citation:${doi}`,
  AI_ASSESSMENT: (manuscriptId: string) => `ai:assessment:${manuscriptId}`,
  EXTERNAL_PROFILE: (provider: string, id: string) => `external:${provider}:${id}`,
  COLLABORATION_SESSION: (sessionId: string) => `collab:session:${sessionId}`,
} as const

// Cache value schema
const CacheValueSchema = z.object({
  data: z.any(),
  timestamp: z.number(),
  ttl: z.number(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type CacheValue = z.infer<typeof CacheValueSchema>

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  memory: {
    used: number
    max: number
    itemCount: number
  }
  redis: {
    connected: boolean
    memory: number
    keyCount: number
  }
}

class AdvancedCacheSystem {
  private redis: Redis | null = null
  private memoryCache: LRUCache<string, CacheValue>
  private stats: CacheStats
  private initialized = false

  constructor() {
    this.memoryCache = new LRUCache({
      max: CACHE_CONFIG.memory.max,
      ttl: CACHE_CONFIG.memory.ttl,
      allowStale: CACHE_CONFIG.memory.allowStale,
      updateAgeOnGet: CACHE_CONFIG.memory.updateAgeOnGet,
      updateAgeOnHas: CACHE_CONFIG.memory.updateAgeOnHas,
    })
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      memory: { used: 0, max: CACHE_CONFIG.memory.max, itemCount: 0 },
      redis: { connected: false, memory: 0, keyCount: 0 }
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize Redis connection
      this.redis = new Redis(CACHE_CONFIG.redis)
      
      this.redis.on('connect', () => {
        logger.info('✅ Redis cache connected')
        this.stats.redis.connected = true
      })

      this.redis.on('error', (err) => {
        logger.warn('⚠️ Redis cache error:', err.message)
        this.stats.redis.connected = false
        this.stats.errors++
      })

      // Test Redis connection
      await this.redis.ping()
      this.initialized = true
      
      logger.error('🚀 Advanced cache system initialized')
    } catch (error) {
      logger.warn('⚠️ Redis unavailable, using memory cache only:', error)
      this.initialized = true
    }
  }

  /**
   * Get value from cache with fallback through cache levels
   */
  async get<T = any>(
    key: string, 
    level: CacheLevel = CacheLevel.ALL
  ): Promise<T | null> {
    try {
      // Try memory cache first (fastest)
      if (level === CacheLevel.MEMORY || level === CacheLevel.ALL) {
        const memoryValue = this.memoryCache.get(key)
        if (memoryValue && this.isValid(memoryValue)) {
          this.stats.hits++
          return memoryValue.data as T
        }
      }

      // Try Redis cache
      if ((level === CacheLevel.REDIS || level === CacheLevel.ALL) && this.redis) {
        const redisValue = await this.redis.get(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue) as CacheValue
          if (this.isValid(parsed)) {
            // Populate memory cache for faster access
            this.memoryCache.set(key, parsed)
            this.stats.hits++
            return parsed.data as T
          }
        }
      }

      this.stats.misses++
      return null
    } catch (error) {
      logger.error('Cache get error:', error)
      this.stats.errors++
      return null
    }
  }

  /**
   * Set value in cache with automatic distribution across levels
   */
  async set(
    key: string,
    value: unknown,
    ttl: number = CacheTTL.MEDIUM,
    level: CacheLevel = CacheLevel.ALL,
    tags?: string[]
  ): Promise<boolean> {
    try {
      const cacheValue: CacheValue = {
        data: value,
        timestamp: Date.now(),
        ttl,
        version: '1.0',
        tags
      }

      // Set in memory cache
      if (level === CacheLevel.MEMORY || level === CacheLevel.ALL) {
        this.memoryCache.set(key, cacheValue)
      }

      // Set in Redis cache
      if ((level === CacheLevel.REDIS || level === CacheLevel.ALL) && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(cacheValue))
      }

      this.stats.sets++
      this.updateMemoryStats()
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Delete from cache across all levels
   */
  async delete(key: string, level: CacheLevel = CacheLevel.ALL): Promise<boolean> {
    try {
      let deleted = false

      // Delete from memory cache
      if (level === CacheLevel.MEMORY || level === CacheLevel.ALL) {
        deleted = this.memoryCache.delete(key) || deleted
      }

      // Delete from Redis cache
      if ((level === CacheLevel.REDIS || level === CacheLevel.ALL) && this.redis) {
        const result = await this.redis.del(key)
        deleted = result > 0 || deleted
      }

      if (deleted) {
        this.stats.deletes++
        this.updateMemoryStats()
      }

      return deleted
    } catch (error) {
      logger.error('Cache delete error:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Clear cache by tags or patterns
   */
  async clear(pattern?: string, tags?: string[]): Promise<number> {
    try {
      let cleared = 0

      if (pattern) {
        // Clear by pattern (Redis only for efficiency)
        if (this.redis) {
          const keys = await this.redis.keys(pattern)
          if (keys.length > 0) {
            cleared = await this.redis.del(...keys)
          }
        }

        // Clear memory cache entries matching pattern
        for (const key of this.memoryCache.keys()) {
          if (this.matchesPattern(key, pattern)) {
            this.memoryCache.delete(key)
            cleared++
          }
        }
      } else if (tags) {
        // Clear by tags (requires scanning all entries)
        await this.clearByTags(tags)
      } else {
        // Clear all
        this.memoryCache.clear()
        if (this.redis) {
          await this.redis.flushdb()
        }
        cleared = -1 // Indicate full clear
      }

      this.updateMemoryStats()
      return cleared
    } catch (error) {
      logger.error('Cache clear error:', error)
      this.stats.errors++
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      // Update Redis stats
      if (this.redis && this.stats.redis.connected) {
        const info = await this.redis.info('memory')
        const keyspace = await this.redis.info('keyspace')
        
        this.stats.redis.memory = this.parseRedisMemory(info)
        this.stats.redis.keyCount = this.parseRedisKeyCount(keyspace)
      }

      this.updateMemoryStats()
      return { ...this.stats }
    } catch (error) {
      logger.error('Cache stats error:', error)
      return this.stats
    }
  }

  /**
   * Warm up cache with commonly accessed data
   */
  async warmup(patterns: Array<{ key: string; fetcher: () => Promise<unknown>; ttl?: number }>): Promise<void> {
    logger.info('🔄 Warming up cache...')
    
    const warmupPromises = patterns.map(async ({ key, fetcher, ttl = CacheTTL.LONG }) => {
      try {
        const existing = await this.get(key)
        if (!existing) {
          const data = await fetcher()
          if (data) {
            await this.set(key, data, ttl)
          }
        }
      } catch (error) {
        logger.warn(`Cache warmup failed for ${key}:`, error)
      }
    })

    await Promise.allSettled(warmupPromises)
    logger.info('✅ Cache warmup completed')
  }

  /**
   * Cache middleware for API routes
   */
  middleware(ttl: number = CacheTTL.MEDIUM, keyGenerator?: (req: NextRequest) => string) {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      if (req.method !== 'GET') {
        return next()
      }

      const cacheKey = keyGenerator ? keyGenerator(req) : this.generateRequestKey(req)
      
      // Try to get from cache
      const cached = await this.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${ttl}`,
          }
        })
      }

      // Execute request
      const response = await next()
      
      // Cache successful responses
      if (response.ok) {
        const data = await response.clone().json()
        await this.set(cacheKey, data, ttl)
      }

      return response
    }
  }

  // Private helper methods
  private isValid(cacheValue: CacheValue): boolean {
    const now = Date.now()
    const expired = now > (cacheValue.timestamp + (cacheValue.ttl * 1000))
    return !expired
  }

  private updateMemoryStats(): void {
    this.stats.memory.itemCount = this.memoryCache.size
    this.stats.memory.used = this.memoryCache.size
  }

  private async clearByTags(tags: string[]): Promise<void> {
    // This would require scanning all cache entries
    // Implementation depends on specific tagging requirements
    logger.warn('Clear by tags not fully implemented')
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return regex.test(key)
  }

  private parseRedisMemory(info: string): number {
    const match = info.match(/used_memory:(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private parseRedisKeyCount(info: string): number {
    const match = info.match(/keys=(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private generateRequestKey(req: NextRequest): string {
    const url = new URL(req.url)
    const key = `${url.pathname}${url.search}`
    return createHash('md5').update(key).digest('hex')
  }
}

// Singleton instance
export const cacheSystem = new AdvancedCacheSystem()

// Cache decorators for common use cases
export function Cacheable(ttl: number = CacheTTL.MEDIUM, keyPrefix?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${keyPrefix || target.constructor.name}:${propertyKey}:${createHash('md5').update(JSON.stringify(args)).digest('hex')}`
      
      // Try cache first
      const cached = await cacheSystem.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Cache the result
      if (result !== null && result !== undefined) {
        await cacheSystem.set(cacheKey, result, ttl)
      }

      return result
    }

    return descriptor
  }
}

// Cache invalidation utilities
export class CacheInvalidator {
  static async invalidateUser(userId: string): Promise<void> {
    await cacheSystem.clear(`user:*:${userId}`)
    await cacheSystem.clear(`author:works:${userId}`)
    await cacheSystem.clear(`reviewer:assignments:${userId}`)
  }

  static async invalidateArticle(articleId: string): Promise<void> {
    await cacheSystem.delete(CacheKeys.ARTICLE_CONTENT(articleId))
    await cacheSystem.delete(CacheKeys.ARTICLE_METADATA(articleId))
    await cacheSystem.clear('search:*') // Invalidate search results
  }

  static async invalidateSearch(): Promise<void> {
    await cacheSystem.clear('search:*')
  }

  static async invalidateStats(): Promise<void> {
    await cacheSystem.delete(CacheKeys.JOURNAL_STATS())
    await cacheSystem.clear('submissions:count:*')
  }
}

// Export cache system for global use
export default cacheSystem
