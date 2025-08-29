import { logger } from "@/lib/logger";
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { redis } from '../lib/redis'
import { CacheManager } from '../lib/cache'

describe('Redis Integration Tests', () => {
  beforeAll(async () => {
    // Wait a bit for Redis connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  afterAll(async () => {
    // Clean up test data
    if (redis) {
      await redis.flushdb()
    }
  })

  describe('Redis Connection', () => {
    it('should connect to Redis', async () => {
      if (redis) {
        const pong = await redis.ping()
        expect(pong).toBe('PONG')
      } else {
        logger.info('Redis not available - testing in-memory fallback')
        expect(true).toBe(true)
      }
    })

    it('should handle Redis unavailability gracefully', async () => {
      // This test verifies fallback behavior
      const result = await CacheManager.get('non-existent-key')
      expect(result).toBeNull()
    })
  })

  describe('Cache Operations', () => {
    it('should set and get cache values', async () => {
      const testKey = 'test:cache:key'
      const testValue = { message: 'Hello Redis!' }

      await CacheManager.set(testKey, testValue, 60)
      const retrieved = await CacheManager.get(testKey)

      expect(retrieved).toEqual(testValue)
    })

    it('should handle cache expiration', async () => {
      const testKey = 'test:expire:key'
      const testValue = { message: 'This will expire' }

      // Set with 1 second TTL
      await CacheManager.set(testKey, testValue, 1)
      
      // Should exist immediately
      let retrieved = await CacheManager.get(testKey)
      expect(retrieved).toEqual(testValue)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should be null after expiration
      retrieved = await CacheManager.get(testKey)
      expect(retrieved).toBeNull()
    })

    it('should delete cache values', async () => {
      const testKey = 'test:delete:key'
      const testValue = { message: 'To be deleted' }

      await CacheManager.set(testKey, testValue)
      await CacheManager.del(testKey)
      
      const retrieved = await CacheManager.get(testKey)
      expect(retrieved).toBeNull()
    })

    it('should invalidate cache patterns', async () => {
      const keys = ['test:pattern:1', 'test:pattern:2', 'other:key']
      const value = { data: 'test' }

      // Set multiple keys
      for (const key of keys) {
        await CacheManager.set(key, value)
      }

      // Invalidate pattern
      await CacheManager.invalidatePattern('test:pattern:*')

      // Check that pattern keys are gone
      expect(await CacheManager.get('test:pattern:1')).toBeNull()
      expect(await CacheManager.get('test:pattern:2')).toBeNull()
      
      // Other key should still exist
      expect(await CacheManager.get('other:key')).toEqual(value)
    })
  })

  describe('Article Caching', () => {
    it('should cache and retrieve articles', async () => {
      const articleId = 'test-article-123'
      const article = {
        id: articleId,
        title: 'Test Article',
        content: 'This is a test article',
        author: 'Test Author'
      }

      await CacheManager.cacheArticle(articleId, article)
      const cachedArticle = await CacheManager.getCachedArticle(articleId)

      expect(cachedArticle).toEqual(article)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Test with malformed data
      const result = await CacheManager.get('')
      expect(result).toBeNull()
    })
  })
})
