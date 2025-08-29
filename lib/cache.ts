import { initRedis } from "./redis"

// Enhanced in-memory cache with cleanup and size limits
const memoryCache = new Map<string, { value: unknown; expires: number; size: number }>()
const MAX_MEMORY_CACHE_SIZE = 1000 // Maximum number of items
const MAX_MEMORY_CACHE_BYTES = 50 * 1024 * 1024 // 50MB max

// Cleanup function for memory cache
function cleanupMemoryCache() {
  const now = Date.now()
  let totalSize = 0
  const entries = Array.from(memoryCache.entries())
  
  // Remove expired entries
  for (const [key, item] of entries) {
    if (item.expires < now) {
      memoryCache.delete(key)
    } else {
      totalSize += item.size
    }
  }
  
  // If still over limits, remove oldest entries
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE || totalSize > MAX_MEMORY_CACHE_BYTES) {
    const sortedEntries = entries
      .filter(([_, item]) => item.expires >= now)
      .sort(([_, a], [__, b]) => a.expires - b.expires)
    
    for (const [key] of sortedEntries) {
      if (memoryCache.size <= MAX_MEMORY_CACHE_SIZE * 0.8 && totalSize <= MAX_MEMORY_CACHE_BYTES * 0.8) {
        break
      }
      const item = memoryCache.get(key)
      if (item) {
        totalSize -= item.size
        memoryCache.delete(key)
      }
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupMemoryCache, 5 * 60 * 1000)

// Utility to estimate object size
function estimateSize(obj: unknown): number {
  return JSON.stringify(obj).length * 2 // Rough estimate (2 bytes per character)
}

export class CacheManager {
  private static redisAvailable = true
  
  static async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (it's faster)
    const memoryCached = memoryCache.get(key)
    if (memoryCached && memoryCached.expires > Date.now()) {
      return memoryCached.value
    }
    if (memoryCached) {
      memoryCache.delete(key) // Remove expired entry
    }
    
    // Try Redis if available and we think it's working
    const redis = await initRedis()
    if (redis && this.redisAvailable) {
      try {
        const cached = await redis.get(key)
        if (cached) {
          const parsed = JSON.parse(cached as string)
          // Store in memory cache for next time
          memoryCache.set(key, {
            value: parsed,
            expires: Date.now() + (30 * 60 * 1000), // 30 minutes in memory
            size: estimateSize(parsed)
          })
          return parsed
        }
      } catch (error) {
        logger.debug("Redis get failed, using memory cache only:", error instanceof Error ? error.message : 'Unknown error')
        this.redisAvailable = false
        // Reset Redis availability after 5 minutes
        setTimeout(() => { this.redisAvailable = true }, 5 * 60 * 1000)
      }
    }
    
    return null
  }

  static async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    const size = estimateSize(value)
    
    // Always store in memory cache first
    memoryCache.set(key, {
      value,
      expires: Date.now() + Math.min(ttl * 1000, 30 * 60 * 1000), // Max 30 minutes in memory
      size
    })
    
    // Try Redis if available and we think it's working
    const redis = await initRedis()
    if (redis && this.redisAvailable) {
      try {
        await redis.setex(key, ttl, JSON.stringify(value))
      } catch (error) {
        logger.debug("Redis set failed, using memory cache only:", error instanceof Error ? error.message : 'Unknown error')
        this.redisAvailable = false
        // Reset Redis availability after 5 minutes
        setTimeout(() => { this.redisAvailable = true }, 5 * 60 * 1000)
      }
    }
  }

  static async del(key: string): Promise<void> {
    // Delete from memory cache first
    memoryCache.delete(key)
    
    // Try Redis if available and we think it's working
    const redis = await initRedis()
    if (redis && this.redisAvailable) {
      try {
        await redis.del(key)
      } catch (error) {
        logger.debug("Redis delete failed:", error instanceof Error ? error.message : 'Unknown error')
        this.redisAvailable = false
        setTimeout(() => { this.redisAvailable = true }, 5 * 60 * 1000)
      }
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      // For memory cache, do a simple pattern match
      const searchPattern = pattern.replace('*', '')
      const keys = Array.from(memoryCache.keys()).filter(key => 
        key.includes(searchPattern)
      )
      keys.forEach(key => memoryCache.delete(key))
      
      // For Redis, we'll skip pattern invalidation since it's not well supported in Upstash
      // In production, consider using Redis SCAN or tag-based invalidation
      logger.debug(`Invalidated ${keys.length} keys from memory cache for pattern: ${pattern}`)
      
    } catch (error) {
      logger.debug("Cache invalidation error:", error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Cache article data
  static async cacheArticle(articleId: string, article: unknown): Promise<void> {
    await this.set(`article:${articleId}`, article, 7200) // 2 hours
  }

  static async getCachedArticle(articleId: string): Promise<unknown> {
    return this.get(`article:${articleId}`)
  }

  // Cache search results
  static async cacheSearchResults(query: string, results: unknown): Promise<void> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    await this.set(key, results, 1800) // 30 minutes
  }

  static async getCachedSearchResults(query: string): Promise<unknown> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    return this.get(key)
  }

  // Cache user data
  static async cacheUser(userId: string, user: unknown): Promise<void> {
    await this.set(`user:${userId}`, user, 3600) // 1 hour
  }

  static async getCachedUser(userId: string): Promise<unknown> {
    return this.get(`user:${userId}`)
  }

  // Cache statistics
  static async cacheStats(type: string, stats: unknown): Promise<void> {
    await this.set(`stats:${type}`, stats, 900) // 15 minutes
  }

  static async getCachedStats(type: string): Promise<unknown> {
    return this.get(`stats:${type}`)
  }

  // Get cache status for debugging
  static getStatus(): { memorySize: number; redisAvailable: boolean } {
    return {
      memorySize: memoryCache.size,
      redisAvailable: this.redisAvailable
    }
  }

  // Clear all memory cache (for testing/debugging)
  static clearMemoryCache(): void {
    memoryCache.clear()
  }
}
