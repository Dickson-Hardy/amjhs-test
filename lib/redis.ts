import { Redis } from '@upstash/redis'

// Test Redis connection function
async function testRedisConnection(redis: Redis): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    logger.error('Redis connection test failed:', error)
    return false
  }
}

// Lazy Redis client initialization to avoid static generation issues
let redis: Redis | null = null
let redisConnected = false
let redisInitialized = false

// Initialize Redis client only when needed
async function initRedis(): Promise<Redis | null> {
  if (redisInitialized) {
    return redis
  }

  redisInitialized = true

  // Only initialize Redis in runtime environment
  if (typeof window === 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      // Test connection only in runtime
      redisConnected = await testRedisConnection(redis)
      
      if (redisConnected) {
        logger.error('✅ Redis client initialized and connected successfully')
      } else {
        logger.error('❌ Redis client initialized but connection failed - using memory fallback')
        redis = null
      }
    } catch (error) {
      logger.error('❌ Redis initialization failed - using memory fallback:', error)
      redis = null
    }
  } else {
    logger.info('⚠️  Redis not available - using memory fallback')
  }

  return redis
}

// Export lazy getter for Redis client
export { redis }

// In-memory cache fallback for development
const memoryCache = new Map<string, { value: unknown; expires?: number }>()

// Clean up expired items from memory cache
const cleanMemoryCache = () => {
  const now = Date.now()
  for (const [key, item] of memoryCache.entries()) {
    if (item.expires && item.expires < now) {
      memoryCache.delete(key)
    }
  }
}

// Clean memory cache every 5 minutes
setInterval(cleanMemoryCache, 5 * 60 * 1000)

// Cache utility functions
export const cache = {
  // Set a value with optional expiration (in seconds)
  async set(key: string, value: unknown, expiration?: number): Promise<void> {
    // Always try memory cache first
    const expires = expiration ? Date.now() + (expiration * 1000) : undefined
    memoryCache.set(key, { value, expires })
    
    // Try Redis as secondary storage (best effort)
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const serialized = JSON.stringify(value)
        if (expiration) {
          await redisClient.setex(key, expiration, serialized)
        } else {
          await redisClient.set(key, serialized)
        }
      } catch (error) {
        // Silent fail for Redis - we already have memory cache
        // Redis set failed, using memory cache
      }
    }
  },

  // Get a value from cache
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const item = memoryCache.get(key)
    if (item) {
      if (item.expires && item.expires < Date.now()) {
        memoryCache.delete(key)
      } else {
        return item.value
      }
    }
    
    // If not in memory cache, try Redis
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const value = await redisClient.get(key)
        if (value) {
          const parsed = JSON.parse(value as string)
          // Store in memory cache for next time
          memoryCache.set(key, { value: parsed })
          return parsed
        }
      } catch (error) {
        // Redis get failed
      }
    }
    
    return null
  },
  
  // Delete a key from cache
  async del(key: string): Promise<void> {
    memoryCache.delete(key)
    
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        await redisClient.del(key)
      } catch (error) {
        logger.debug('Redis delete failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    // Check memory cache first
    const item = memoryCache.get(key)
    if (item) {
      if (item.expires && item.expires < Date.now()) {
        memoryCache.delete(key)
        return false
      }
      return true
    }

    // Check Redis if not in memory
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const result = await redisClient.exists(key)
        return result === 1
      } catch (error) {
        logger.debug('Redis exists failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    return false
  },

  // Set expiration for existing key
  async expire(key: string, seconds: number): Promise<void> {
    // Update memory cache expiration
    const item = memoryCache.get(key)
    if (item) {
      item.expires = Date.now() + (seconds * 1000)
      memoryCache.set(key, item)
    }

    // Update Redis expiration
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        await redisClient.expire(key, seconds)
      } catch (error) {
        logger.debug('Redis expire failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  },

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = []
    const missingKeys: string[] = []
    const missingIndexes: number[] = []

    // Check memory cache first
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const item = memoryCache.get(key)
      if (item && (!item.expires || item.expires >= Date.now())) {
        results[i] = item.value
      } else {
        results[i] = null
        missingKeys.push(key)
        missingIndexes.push(i)
      }
    }

    // Try Redis for missing keys
    if (missingKeys.length > 0) {
      const redisClient = await initRedis()
      if (redisClient) {
        try {
          const values = await redisClient.mget(...missingKeys)
          for (let i = 0; i < values.length; i++) {
            const value = values[i]
            const resultIndex = missingIndexes[i]
            if (value) {
              const parsed = JSON.parse(value as string)
              results[resultIndex] = parsed
              // Cache in memory for next time
              memoryCache.set(missingKeys[i], { value: parsed })
            }
          }
        } catch (error) {
          logger.debug('Redis mget failed:', error instanceof Error ? error.message : 'Unknown error')
        }
      }
    }

    return results
  },

  // Set multiple key-value pairs
  async mset(keyValues: Record<string, any>): Promise<void> {
    // Set in memory cache
    for (const [key, value] of Object.entries(keyValues)) {
      memoryCache.set(key, { value })
    }

    // Set in Redis
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const serializedPairs: Record<string, string> = {}
        for (const [key, value] of Object.entries(keyValues)) {
          serializedPairs[key] = JSON.stringify(value)
        }
        await redisClient.mset(serializedPairs)
      } catch (error) {
        logger.debug('Redis mset failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  },

  // Increment a numeric value
  async incr(key: string): Promise<number> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const result = await redisClient.incr(key)
        // Update memory cache too
        memoryCache.set(key, { value: result })
        return result
      } catch (error) {
        logger.debug('Redis incr failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory cache
    const item = memoryCache.get(key)
    const currentValue = item ? (typeof item.value === 'number' ? item.value : 0) : 0
    const newValue = currentValue + 1
    memoryCache.set(key, { value: newValue, expires: item?.expires })
    return newValue
  },

  // Add to a set (simplified for memory fallback)
  async sadd(key: string, ...members: string[]): Promise<number> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        return await redisClient.sadd(key, members)
      } catch (error) {
        logger.debug('Redis sadd failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory cache
    const item = memoryCache.get(key)
    const currentSet = new Set(item?.value || [])
    let added = 0
    for (const member of members) {
      if (!currentSet.has(member)) {
        currentSet.add(member)
        added++
      }
    }
    memoryCache.set(key, { value: Array.from(currentSet), expires: item?.expires })
    return added
  },

  // Get all members of a set
  async smembers(key: string): Promise<string[]> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        return await redisClient.smembers(key)
      } catch (error) {
        logger.debug('Redis smembers failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory cache
    const item = memoryCache.get(key)
    return item?.value || []
  },

  // Remove from a set
  async srem(key: string, ...members: string[]): Promise<number> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        return await redisClient.srem(key, ...members)
      } catch (error) {
        logger.debug('Redis srem failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory cache
    const item = memoryCache.get(key)
    const currentSet = new Set(item?.value || [])
    let removed = 0
    for (const member of members) {
      if (currentSet.has(member)) {
        currentSet.delete(member)
        removed++
      }
    }
    memoryCache.set(key, { value: Array.from(currentSet), expires: item?.expires })
    return removed
  },

  // Check if member exists in set
  async sismember(key: string, member: string): Promise<boolean> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const result = await redisClient.sismember(key, member)
        return result === 1
      } catch (error) {
        logger.debug('Redis sismember failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory cache
    const item = memoryCache.get(key)
    const currentSet = new Set(item?.value || [])
    return currentSet.has(member)
  }
}

// Session management utilities
export const session = {
  // Store session data
  async create(sessionId: string, data: unknown, expiration: number = 3600): Promise<void> {
    await cache.set(`session:${sessionId}`, data, expiration)
  },

  // Get session data
  async get<T>(sessionId: string): Promise<T | null> {
    return await cache.get<T>(`session:${sessionId}`)
  },

  // Update session data
  async update(sessionId: string, data: unknown, expiration?: number): Promise<void> {
    const key = `session:${sessionId}`
    await cache.set(key, data, expiration)
  },

  // Delete session
  async destroy(sessionId: string): Promise<void> {
    await cache.del(`session:${sessionId}`)
  },

  // Extend session expiration
  async extend(sessionId: string, seconds: number): Promise<void> {
    await cache.expire(`session:${sessionId}`, seconds)
  }
}

// Rate limiting utilities
export const rateLimit = {
  // Check and increment rate limit counter
  async check(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisClient = await initRedis()
    if (redisClient) {
      try {
        const current = await redisClient.incr(key)
        
        if (current === 1) {
          await redisClient.expire(key, window)
        }
        
        const ttl = await redisClient.ttl(key)
        const resetTime = Date.now() + (ttl * 1000)
        
        return {
          allowed: current <= limit,
          remaining: Math.max(0, limit - current),
          resetTime
        }
      } catch (error) {
        logger.debug('Redis rate limit failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Fallback to memory-based rate limiting
    const item = memoryCache.get(key)
    const now = Date.now()
    
    if (!item || (item.expires && item.expires < now)) {
      // First request or expired window
      const resetTime = now + (window * 1000)
      memoryCache.set(key, { value: 1, expires: resetTime })
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime
      }
    } else {
      // Increment counter
      const current = item.value + 1
      memoryCache.set(key, { value: current, expires: item.expires })
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime: item.expires || now + (window * 1000)
      }
    }
  },

  // Reset rate limit for a key
  async reset(key: string): Promise<void> {
    await cache.del(key)
  }
}

// Export the lazy initialization function for external use
export { initRedis }

// Export a getter function for Redis client
export const getRedis = () => redis

export default initRedis
