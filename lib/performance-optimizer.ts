/**
 * Performance Optimization Utilities
 * Advanced performance optimization for enterprise deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import { z } from 'zod'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { readFile, writeFile, stat, mkdir } from 'fs/promises'
import path from 'path'

// Performance configuration
const PERFORMANCE_CONFIG = {
  image: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    formats: ['webp', 'avif', 'jpeg'],
    cacheDir: path.join(process.cwd(), '.next/cache/images'),
  },
  compression: {
    threshold: 1024, // Compress responses larger than 1KB
    level: 6, // gzip compression level
  },
  cache: {
    maxAge: {
      static: 31536000, // 1 year for static assets
      api: 300, // 5 minutes for API responses
      pages: 3600, // 1 hour for pages
      images: 86400, // 1 day for images
    },
  },
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    baseUrl: process.env.CDN_BASE_URL,
    regions: process.env.CDN_REGIONS?.split(',') || ['global'],
  },
  preload: {
    enabled: true,
    criticalResources: [
      '/fonts/inter.woff2',
      '/api/auth/session',
      '/api/dashboard/stats',
    ],
  },
  bundleAnalysis: {
    enabled: process.env.ANALYZE_BUNDLE === 'true',
    threshold: 250000, // 250KB warning threshold
  },
}

// Performance metrics schema
const PerformanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  timestamp: z.number(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  connectionType: z.string().optional(),
  deviceType: z.string().optional(),
})

type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>

// Image optimization schema
const ImageOptimizationSchema = z.object({
  src: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  quality: z.number().min(1).max(100).optional(),
  format: z.enum(['webp', 'avif', 'jpeg', 'png']).optional(),
})

type ImageOptimization = z.infer<typeof ImageOptimizationSchema>

class PerformanceOptimizer {
  private redis: Redis | null = null
  private imageCache = new Map<string, string>()

  constructor() {
    this.initializeRedis()
    this.ensureCacheDirectories()
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_PERFORMANCE_DB || '3'),
      })
      
              // Performance optimization Redis connected
    } catch (error) {
      logger.warn('⚠️ Performance Redis unavailable:', error)
    }
  }

  private async ensureCacheDirectories(): Promise<void> {
    try {
      await mkdir(PERFORMANCE_CONFIG.image.cacheDir, { recursive: true })
    } catch (error) {
      logger.warn('Cache directory creation failed:', error)
    }
  }

  /**
   * Advanced image optimization with multiple format support
   */
  async optimizeImage(params: ImageOptimization): Promise<{
    data: Buffer
    format: string
    size: number
    originalSize?: number
  }> {
    try {
      const cacheKey = this.generateImageCacheKey(params)
      const cachedPath = path.join(PERFORMANCE_CONFIG.image.cacheDir, `${cacheKey}.${params.format || 'webp'}`)

      // Check if optimized image exists in cache
      try {
        const cachedData = await readFile(cachedPath)
        const stats = await stat(cachedPath)
        return {
          data: cachedData,
          format: params.format || 'webp',
          size: stats.size,
        }
      } catch {
        // Cache miss, continue with optimization
      }

      // Load original image
      let imageBuffer: Buffer
      if (params.src.startsWith('http')) {
        // Fetch remote image
        const response = await fetch(params.src)
        imageBuffer = Buffer.from(await response.arrayBuffer())
      } else {
        // Load local image
        imageBuffer = await readFile(path.join(process.cwd(), 'public', params.src))
      }

      const originalSize = imageBuffer.length

      // Optimize image with Sharp
      let sharpInstance = sharp(imageBuffer)

      // Resize if dimensions provided
      if (params.width || params.height) {
        sharpInstance = sharpInstance.resize(params.width, params.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      // Apply format-specific optimization
      const format = params.format || 'webp'
      const quality = params.quality || PERFORMANCE_CONFIG.image.quality

      switch (format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality })
          break
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality })
          break
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true })
          break
        case 'png':
          sharpInstance = sharpInstance.png({ quality })
          break
      }

      const optimizedBuffer = await sharpInstance.toBuffer()

      // Cache the optimized image
      await writeFile(cachedPath, optimizedBuffer)

      return {
        data: optimizedBuffer,
        format,
        size: optimizedBuffer.length,
        originalSize,
      }
    } catch (error) {
      logger.error('Image optimization error:', error)
      throw new AppError(`Image optimization failed: ${error}`)
    }
  }

  /**
   * Advanced response compression with smart algorithms
   */
  async compressResponse(data: string | Buffer, acceptEncoding: string): Promise<{
    data: Buffer
    encoding: string
    compressionRatio: number
  }> {
    try {
      const originalSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data)
      
      // Skip compression for small payloads
      if (originalSize < PERFORMANCE_CONFIG.compression.threshold) {
        return {
          data: Buffer.isBuffer(data) ? data : Buffer.from(data),
          encoding: 'identity',
          compressionRatio: 1,
        }
      }

      const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

      // Choose best compression algorithm based on accept-encoding header
      if (acceptEncoding.includes('br')) {
        // Brotli compression (best ratio, higher CPU)
        const { default: brotli } = await import('zlib')
        const compressed = await new Promise<Buffer>((resolve, reject) => {
          brotli.brotliCompress(inputBuffer, { 
            params: { [brotli.constants.BROTLI_PARAM_QUALITY]: 6 } 
          }, (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        return {
          data: compressed,
          encoding: 'br',
          compressionRatio: originalSize / compressed.length,
        }
      } else if (acceptEncoding.includes('gzip')) {
        // Gzip compression (good balance)
        const { default: zlib } = await import('zlib')
        const compressed = await new Promise<Buffer>((resolve, reject) => {
          zlib.gzip(inputBuffer, { level: PERFORMANCE_CONFIG.compression.level }, (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        return {
          data: compressed,
          encoding: 'gzip',
          compressionRatio: originalSize / compressed.length,
        }
      } else if (acceptEncoding.includes('deflate')) {
        // Deflate compression (fastest)
        const { default: zlib } = await import('zlib')
        const compressed = await new Promise<Buffer>((resolve, reject) => {
          zlib.deflate(inputBuffer, (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })

        return {
          data: compressed,
          encoding: 'deflate',
          compressionRatio: originalSize / compressed.length,
        }
      }

      // No compression support
      return {
        data: inputBuffer,
        encoding: 'identity',
        compressionRatio: 1,
      }
    } catch (error) {
      logger.error('Compression error:', error)
      return {
        data: Buffer.isBuffer(data) ? data : Buffer.from(data),
        encoding: 'identity',
        compressionRatio: 1,
      }
    }
  }

  /**
   * Smart caching middleware with cache invalidation
   */
  cachingMiddleware(cacheType: 'static' | 'api' | 'pages' | 'images' = 'api') {
    return async (req: NextRequest, handler: () => Promise<NextResponse>) => {
      const cacheKey = this.generateCacheKey(req)
      const maxAge = PERFORMANCE_CONFIG.cache.maxAge[cacheType]

      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return handler()
      }

      // Try to get from cache
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        const response = new NextResponse(cached.data, {
          status: cached.status,
          headers: cached.headers,
        })
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
        return response
      }

      // Execute handler
      const response = await handler()

      // Cache successful responses
      if (response.ok) {
        await this.setCache(cacheKey, {
          data: await response.clone().arrayBuffer(),
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: Date.now(),
        }, maxAge)
      }

      response.headers.set('X-Cache', 'MISS')
      response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
      
      return response
    }
  }

  /**
   * Critical resource preloading
   */
  generatePreloadHeaders(pathname: string): Record<string, string> {
    const preloadHeaders: Record<string, string> = {}
    const links: string[] = []

    // Always preload critical fonts
    links.push('</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin')

    // Page-specific preloading
    if (pathname === '/') {
      links.push('</api/dashboard/stats>; rel=preload; as=fetch')
      links.push('</api/auth/session>; rel=preload; as=fetch')
    } else if (pathname.startsWith('/article/')) {
      links.push('</api/articles/trending>; rel=preload; as=fetch')
    } else if (pathname.startsWith('/dashboard')) {
      links.push('</api/user/profile>; rel=preload; as=fetch')
      links.push('</api/dashboard/analytics>; rel=preload; as=fetch')
    }

    // Add CSS preloading for critical styles
    links.push('</styles/globals.css>; rel=preload; as=style')

    if (links.length > 0) {
      preloadHeaders['Link'] = links.join(', ')
    }

    return preloadHeaders
  }

  /**
   * Performance monitoring and reporting
   */
  async recordPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.lpush('performance:metrics', JSON.stringify(metric))
        await this.redis.ltrim('performance:metrics', 0, 9999) // Keep last 10k metrics
      }

      // Log performance warnings
      if (metric.name === 'page-load-time' && metric.value > 3000) {
        logger.warn(`⚠️ Slow page load: ${metric.url} took ${metric.value}ms`)
      }
    } catch (error) {
      logger.error('Performance metric recording error:', error)
    }
  }

  /**
   * Bundle size analysis and warnings
   */
  async analyzeBundleSize(): Promise<{
    totalSize: number
    chunks: Array<{ name: string; size: number }>
    warnings: string[]
  }> {
    try {
      const manifestPath = path.join(process.cwd(), '.next/static/chunks/_buildManifest.js')
      
      // This would require actual bundle analysis integration
      // For now, return mock data
      const mockData = {
        totalSize: 245000, // 245KB
        chunks: [
          { name: 'main', size: 120000 },
          { name: 'vendor', size: 85000 },
          { name: 'runtime', size: 40000 },
        ],
        warnings: [],
      }

      // Check for size warnings
      if (mockData.totalSize > PERFORMANCE_CONFIG.bundleAnalysis.threshold) {
        mockData.warnings.push(`Total bundle size (${mockData.totalSize}B) exceeds threshold`)
      }

      return mockData
    } catch (error) {
      logger.error('Bundle analysis error:', error)
      return {
        totalSize: 0,
        chunks: [],
        warnings: ['Bundle analysis failed'],
      }
    }
  }

  /**
   * CDN integration utilities
   */
  async purgeCache(urls: string[]): Promise<{ success: boolean; purged: number }> {
    try {
      if (!PERFORMANCE_CONFIG.cdn.enabled || !PERFORMANCE_CONFIG.cdn.baseUrl) {
        return { success: false, purged: 0 }
      }

      // Mock CDN purge - implement actual CDN API calls
      logger.api(`🔄 Purging CDN cache for ${urls.length} URLs:`, urls)
      
      // Example for Cloudflare API:
      // const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${apiToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ files: urls }),
      // })

      return { success: true, purged: urls.length }
    } catch (error) {
      logger.error('CDN purge error:', error)
      return { success: false, purged: 0 }
    }
  }

  /**
   * Performance report generation
   */
  async generatePerformanceReport(): Promise<unknown> {
    try {
      if (!this.redis) {
        return { error: 'Redis unavailable for performance metrics' }
      }

      const metrics = await this.redis.lrange('performance:metrics', 0, -1)
      const parsedMetrics = metrics.map(m => JSON.parse(m) as PerformanceMetric)

      // Calculate performance statistics
      const pageLoadTimes = parsedMetrics
        .filter(m => m.name === 'page-load-time')
        .map(m => m.value)

      const apiResponseTimes = parsedMetrics
        .filter(m => m.name === 'api-response-time')
        .map(m => m.value)

      const report = {
        timestamp: Date.now(),
        summary: {
          totalMetrics: parsedMetrics.length,
          avgPageLoadTime: this.calculateAverage(pageLoadTimes),
          avgApiResponseTime: this.calculateAverage(apiResponseTimes),
          p95PageLoadTime: this.calculatePercentile(pageLoadTimes, 95),
          p95ApiResponseTime: this.calculatePercentile(apiResponseTimes, 95),
        },
        bundleAnalysis: await this.analyzeBundleSize(),
        recommendations: this.generatePerformanceRecommendations(parsedMetrics),
        trends: this.calculatePerformanceTrends(parsedMetrics),
      }

      return report
    } catch (error) {
      logger.error('Performance report generation error:', error)
      return { error: 'Failed to generate performance report' }
    }
  }

  // Private helper methods
  private generateImageCacheKey(params: ImageOptimization): string {
    const keyData = JSON.stringify(params)
    return createHash('md5').update(keyData).digest('hex')
  }

  private generateCacheKey(req: NextRequest): string {
    const url = req.nextUrl
    const key = `${url.pathname}${url.search}`
    return createHash('md5').update(key).digest('hex')
  }

  private async getFromCache(key: string): Promise<unknown> {
    if (!this.redis) return null

    try {
      const data = await this.redis.get(`cache:${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  private async setCache(key: string, data: unknown, ttl: number): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.setex(`cache:${key}`, ttl, JSON.stringify(data))
    } catch (error) {
      logger.error('Cache set error:', error)
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private generatePerformanceRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []

    const pageLoadTimes = metrics
      .filter(m => m.name === 'page-load-time')
      .map(m => m.value)

    const avgPageLoad = this.calculateAverage(pageLoadTimes)

    if (avgPageLoad > 3000) {
      recommendations.push('Consider implementing code splitting and lazy loading')
      recommendations.push('Optimize images and use next-gen formats (WebP, AVIF)')
      recommendations.push('Enable compression and caching headers')
    }

    if (avgPageLoad > 5000) {
      recommendations.push('Critical: Page load times are severely impacting user experience')
      recommendations.push('Implement a CDN for static assets')
      recommendations.push('Consider preloading critical resources')
    }

    return recommendations
  }

  private calculatePerformanceTrends(metrics: PerformanceMetric[]): unknown {
    // Simple trend analysis - in production, implement more sophisticated analysis
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo)
    const dayMetrics = metrics.filter(m => m.timestamp > oneDayAgo)

    return {
      last1Hour: {
        avgPageLoad: this.calculateAverage(
          recentMetrics.filter(m => m.name === 'page-load-time').map(m => m.value)
        ),
        totalRequests: recentMetrics.length,
      },
      last24Hours: {
        avgPageLoad: this.calculateAverage(
          dayMetrics.filter(m => m.name === 'page-load-time').map(m => m.value)
        ),
        totalRequests: dayMetrics.length,
      },
    }
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// Performance decorators
export function OptimizeResponse(cacheType: 'static' | 'api' | 'pages' | 'images' = 'api') {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (req: NextRequest, ...args: unknown[]) {
      const startTime = Date.now()

      try {
        const response = await originalMethod.apply(this, [req, ...args])
        const duration = Date.now() - startTime

        // Record performance metric
        await performanceOptimizer.recordPerformanceMetric({
          name: 'api-response-time',
          value: duration,
          timestamp: Date.now(),
          url: req.nextUrl.pathname,
          userAgent: req.headers.get('user-agent') || undefined,
        })

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        
        await performanceOptimizer.recordPerformanceMetric({
          name: 'api-error-response-time',
          value: duration,
          timestamp: Date.now(),
          url: req.nextUrl.pathname,
          userAgent: req.headers.get('user-agent') || undefined,
        })

        throw error
      }
    }

    return descriptor
  }
}

// Export performance optimizer
export default performanceOptimizer
