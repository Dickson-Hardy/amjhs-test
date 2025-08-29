/**
 * Advanced Performance Optimization System
 * Provides comprehensive caching, CDN integration, and performance monitoring
 */

import { sql } from '@vercel/postgres'
import { logger } from './logger'
import { CacheManager } from './cache'

// Types for performance optimization
export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  interactionToNextPaint: number
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
}

export interface CacheStrategy {
  type: 'memory' | 'redis' | 'cdn' | 'database'
  ttl: number
  tags: string[]
  compression: boolean
  minify: boolean
}

export interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'vercel'
  zones: string[]
  purgeUrls: string[]
  cacheRules: CacheRule[]
}

export interface CacheRule {
  pattern: string
  ttl: number
  compress: boolean
  headers: Record<string, string>
}

export interface OptimizationResult {
  cacheHitRate: number
  avgResponseTime: number
  bandwidthSaved: number
  compressionRatio: number
  performance: {
    score: number
    metrics: PerformanceMetrics
    recommendations: string[]
  }
}

/**
 * Performance Optimization Service
 */
export class PerformanceService {
  private static cdnConfig: CDNConfig
  private static cacheStrategies = new Map<string, CacheStrategy>()

  /**
   * Initialize performance optimization
   */
  static initialize(config: CDNConfig): void {
    this.cdnConfig = config
    this.setupDefaultCacheStrategies()
    logger.info('Performance optimization service initialized')
  }

  /**
   * Set up default caching strategies
   */
  private static setupDefaultCacheStrategies(): void {
    // API responses
    this.cacheStrategies.set('api', {
      type: 'redis',
      ttl: 300, // 5 minutes
      tags: ['api', 'dynamic'],
      compression: true,
      minify: false
    })

    // Static assets
    this.cacheStrategies.set('static', {
      type: 'cdn',
      ttl: 31536000, // 1 year
      tags: ['static', 'assets'],
      compression: true,
      minify: true
    })

    // Database queries
    this.cacheStrategies.set('database', {
      type: 'memory',
      ttl: 600, // 10 minutes
      tags: ['database', 'queries'],
      compression: false,
      minify: false
    })

    // Page content
    this.cacheStrategies.set('pages', {
      type: 'redis',
      ttl: 1800, // 30 minutes
      tags: ['pages', 'content'],
      compression: true,
      minify: true
    })

    // User data
    this.cacheStrategies.set('user', {
      type: 'memory',
      ttl: 900, // 15 minutes
      tags: ['user', 'session'],
      compression: false,
      minify: false
    })
  }

  /**
   * Record performance metrics
   */
  static async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await sql`
        INSERT INTO performance_metrics (
          page_load_time, time_to_first_byte, first_contentful_paint,
          largest_contentful_paint, cumulative_layout_shift, first_input_delay,
          interaction_to_next_paint, timestamp, user_agent, url, user_id
        ) VALUES (
          ${metrics.pageLoadTime}, ${metrics.timeToFirstByte}, ${metrics.firstContentfulPaint},
          ${metrics.largestContentfulPaint}, ${metrics.cumulativeLayoutShift}, ${metrics.firstInputDelay},
          ${metrics.interactionToNextPaint}, ${metrics.timestamp}, ${metrics.userAgent},
          ${metrics.url}, ${metrics.userId || null}
        )
      `

      // Trigger performance analysis if metrics are poor
      const performanceScore = this.calculatePerformanceScore(metrics)
      if (performanceScore < 50) {
        await this.triggerOptimization(metrics.url, performanceScore)
      }

      logger.info(`Performance metrics recorded for ${metrics.url}`)
    } catch (error) {
      logger.error('Error recording performance metrics:', error)
    }
  }

  /**
   * Calculate performance score based on Core Web Vitals
   */
  private static calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100

    // Largest Contentful Paint (LCP) - Good: < 2.5s
    if (metrics.largestContentfulPaint > 4000) score -= 30
    else if (metrics.largestContentfulPaint > 2500) score -= 15

    // First Input Delay (FID) - Good: < 100ms
    if (metrics.firstInputDelay > 300) score -= 25
    else if (metrics.firstInputDelay > 100) score -= 10

    // Cumulative Layout Shift (CLS) - Good: < 0.1
    if (metrics.cumulativeLayoutShift > 0.25) score -= 25
    else if (metrics.cumulativeLayoutShift > 0.1) score -= 10

    // Time to First Byte (TTFB) - Good: < 600ms
    if (metrics.timeToFirstByte > 1800) score -= 20
    else if (metrics.timeToFirstByte > 600) score -= 10

    return Math.max(0, score)
  }

  /**
   * Trigger automatic optimization for poor-performing URLs
   */
  private static async triggerOptimization(url: string, score: number): Promise<void> {
    logger.warn(`Poor performance detected for ${url} (score: ${score})`)

    try {
      // Preload critical resources
      await this.preloadCriticalResources(url)

      // Optimize images
      await this.optimizeImages(url)

      // Update cache strategy
      await this.updateCacheStrategy(url, 'aggressive')

      // Purge CDN cache
      await this.purgeCDNCache([url])

    } catch (error) {
      logger.error('Error in automatic optimization:', error)
    }
  }

  /**
   * Get performance analytics
   */
  static async getPerformanceAnalytics(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<OptimizationResult> {
    try {
      const timeCondition = this.getTimeCondition(timeframe)

      // Get performance metrics
      const { rows: metricsRows } = await sql`
        SELECT 
          AVG(page_load_time) as avg_page_load,
          AVG(time_to_first_byte) as avg_ttfb,
          AVG(first_contentful_paint) as avg_fcp,
          AVG(largest_contentful_paint) as avg_lcp,
          AVG(cumulative_layout_shift) as avg_cls,
          AVG(first_input_delay) as avg_fid,
          COUNT(*) as total_requests
        FROM performance_metrics
        WHERE timestamp > ${timeCondition}
      `

      // Get cache metrics
      const cacheMetrics = await this.getCacheMetrics(timeframe)

      // Calculate performance score
      const avgMetrics: PerformanceMetrics = {
        pageLoadTime: metricsRows[0].avg_page_load || 0,
        timeToFirstByte: metricsRows[0].avg_ttfb || 0,
        firstContentfulPaint: metricsRows[0].avg_fcp || 0,
        largestContentfulPaint: metricsRows[0].avg_lcp || 0,
        cumulativeLayoutShift: metricsRows[0].avg_cls || 0,
        firstInputDelay: metricsRows[0].avg_fid || 0,
        interactionToNextPaint: 0,
        timestamp: new Date(),
        userAgent: '',
        url: ''
      }

      const performanceScore = this.calculatePerformanceScore(avgMetrics)
      const recommendations = this.generateRecommendations(avgMetrics, cacheMetrics)

      return {
        cacheHitRate: cacheMetrics.hitRate,
        avgResponseTime: avgMetrics.timeToFirstByte,
        bandwidthSaved: cacheMetrics.bandwidthSaved,
        compressionRatio: cacheMetrics.compressionRatio,
        performance: {
          score: performanceScore,
          metrics: avgMetrics,
          recommendations
        }
      }
    } catch (error) {
      logger.error('Error getting performance analytics:', error)
      throw new AppError('Failed to get performance analytics')
    }
  }

  /**
   * Get cache performance metrics
   */
  private static async getCacheMetrics(timeframe: string) {
    const timeCondition = this.getTimeCondition(timeframe)

    const { rows } = await sql`
      SELECT 
        COUNT(CASE WHEN cache_hit = true THEN 1 END) as cache_hits,
        COUNT(*) as total_requests,
        AVG(response_size_original) as avg_original_size,
        AVG(response_size_compressed) as avg_compressed_size,
        SUM(response_size_original - response_size_compressed) as bandwidth_saved
      FROM cache_metrics
      WHERE timestamp > ${timeCondition}
    `

    const hitRate = (rows[0].cache_hits / rows[0].total_requests) * 100 || 0
    const compressionRatio = rows[0].avg_original_size > 0 
      ? (rows[0].avg_compressed_size / rows[0].avg_original_size) 
      : 1

    return {
      hitRate,
      compressionRatio,
      bandwidthSaved: rows[0].bandwidth_saved || 0
    }
  }

  /**
   * Generate performance recommendations
   */
  private static generateRecommendations(
    metrics: PerformanceMetrics,
    cacheMetrics: unknown
  ): string[] {
    const recommendations: string[] = []

    // LCP recommendations
    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push('Optimize largest contentful paint by compressing images and using WebP format')
      recommendations.push('Implement image lazy loading and preload critical resources')
    }

    // FID recommendations
    if (metrics.firstInputDelay > 100) {
      recommendations.push('Reduce JavaScript execution time and bundle size')
      recommendations.push('Use code splitting and defer non-critical JavaScript')
    }

    // CLS recommendations
    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Set explicit dimensions for images and video elements')
      recommendations.push('Avoid inserting content above existing content dynamically')
    }

    // TTFB recommendations
    if (metrics.timeToFirstByte > 600) {
      recommendations.push('Optimize server response time and database queries')
      recommendations.push('Implement edge caching and CDN distribution')
    }

    // Cache recommendations
    if (cacheMetrics.hitRate < 80) {
      recommendations.push('Improve cache hit rate by extending TTL for static resources')
      recommendations.push('Implement more aggressive caching strategies')
    }

    return recommendations
  }

  /**
   * Optimize images for better performance
   */
  static async optimizeImages(url: string): Promise<void> {
    try {
      // Get images from the page
      const images = await this.extractImagesFromUrl(url)

      for (const image of images) {
        // Convert to WebP if supported
        await this.convertToWebP(image)

        // Generate responsive images
        await this.generateResponsiveImages(image)

        // Implement lazy loading
        await this.implementLazyLoading(image)
      }

      logger.info(`Images optimized for ${url}`)
    } catch (error) {
      logger.error('Error optimizing images:', error)
    }
  }

  /**
   * Preload critical resources
   */
  static async preloadCriticalResources(url: string): Promise<void> {
    try {
      const criticalResources = await this.identifyCriticalResources(url)

      // Generate preload headers
      const preloadHeaders = criticalResources.map(resource => 
        `<${resource.url}>; rel=preload; as=${resource.type}`
      ).join(', ')

      // Store preload configuration
      await sql`
        INSERT INTO preload_configs (url, resources, created_at)
        VALUES (${url}, ${JSON.stringify(criticalResources)}, NOW())
        ON CONFLICT (url) DO UPDATE SET
        resources = EXCLUDED.resources,
        updated_at = NOW()
      `

      logger.info(`Critical resources preload configured for ${url}`)
    } catch (error) {
      logger.error('Error configuring preload:', error)
    }
  }

  /**
   * Update cache strategy for specific URL pattern
   */
  static async updateCacheStrategy(
    urlPattern: string,
    strategy: 'conservative' | 'aggressive' | 'custom'
  ): Promise<void> {
    try {
      let cacheConfig: CacheStrategy

      switch (strategy) {
        case 'aggressive':
          cacheConfig = {
            type: 'cdn',
            ttl: 3600, // 1 hour
            tags: ['aggressive', 'performance'],
            compression: true,
            minify: true
          }
          break
        case 'conservative':
          cacheConfig = {
            type: 'redis',
            ttl: 300, // 5 minutes
            tags: ['conservative', 'safe'],
            compression: false,
            minify: false
          }
          break
        default:
          cacheConfig = this.cacheStrategies.get('api') || {
            type: 'redis',
            ttl: 300,
            tags: ['default'],
            compression: true,
            minify: false
          }
      }

      // Store cache strategy
      await sql`
        INSERT INTO cache_strategies (url_pattern, strategy, config, created_at)
        VALUES (${urlPattern}, ${strategy}, ${JSON.stringify(cacheConfig)}, NOW())
        ON CONFLICT (url_pattern) DO UPDATE SET
        strategy = EXCLUDED.strategy,
        config = EXCLUDED.config,
        updated_at = NOW()
      `

      this.cacheStrategies.set(urlPattern, cacheConfig)
      logger.info(`Cache strategy updated for ${urlPattern}: ${strategy}`)
    } catch (error) {
      logger.error('Error updating cache strategy:', error)
    }
  }

  /**
   * Purge CDN cache
   */
  static async purgeCDNCache(urls: string[]): Promise<void> {
    try {
      if (!this.cdnConfig) {
        logger.warn('CDN not configured, skipping cache purge')
        return
      }

      switch (this.cdnConfig.provider) {
        case 'cloudflare':
          await this.purgeCloudflareCache(urls)
          break
        case 'aws':
          await this.purgeAWSCache(urls)
          break
        case 'vercel':
          await this.purgeVercelCache(urls)
          break
      }

      logger.info(`CDN cache purged for ${urls.length} URLs`)
    } catch (error) {
      logger.error('Error purging CDN cache:', error)
    }
  }

  /**
   * Get performance report
   */
  static async getPerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<unknown> {
    try {
      const { rows } = await sql`
        SELECT 
          DATE(timestamp) as date,
          AVG(page_load_time) as avg_page_load,
          AVG(time_to_first_byte) as avg_ttfb,
          AVG(largest_contentful_paint) as avg_lcp,
          AVG(first_input_delay) as avg_fid,
          AVG(cumulative_layout_shift) as avg_cls,
          COUNT(*) as total_requests,
          COUNT(DISTINCT user_id) as unique_users
        FROM performance_metrics
        WHERE timestamp BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `

      return {
        dailyMetrics: rows,
        summary: {
          totalRequests: rows.reduce((sum, row) => sum + row.total_requests, 0),
          avgPerformanceScore: rows.reduce((sum, row) => {
            const metrics = {
              largestContentfulPaint: row.avg_lcp,
              firstInputDelay: row.avg_fid,
              cumulativeLayoutShift: row.avg_cls,
              timeToFirstByte: row.avg_ttfb
            } as PerformanceMetrics
            return sum + this.calculatePerformanceScore(metrics)
          }, 0) / rows.length
        }
      }
    } catch (error) {
      logger.error('Error generating performance report:', error)
      throw new AppError('Failed to generate performance report')
    }
  }

  // Helper methods
  private static getTimeCondition(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  private static async extractImagesFromUrl(url: string): Promise<any[]> {
    // Mock implementation - in production, would analyze page content
    return []
  }

  private static async convertToWebP(image: unknown): Promise<void> {
    // Mock implementation - would convert images to WebP format
  }

  private static async generateResponsiveImages(image: unknown): Promise<void> {
    // Mock implementation - would generate different sizes
  }

  private static async implementLazyLoading(image: unknown): Promise<void> {
    // Mock implementation - would add lazy loading attributes
  }

  private static async identifyCriticalResources(url: string): Promise<any[]> {
    // Mock implementation - would analyze critical rendering path
    return []
  }

  private static async purgeCloudflareCache(urls: string[]): Promise<void> {
    // Mock implementation - would call Cloudflare API
  }

  private static async purgeAWSCache(urls: string[]): Promise<void> {
    // Mock implementation - would call AWS CloudFront API
  }

  private static async purgeVercelCache(urls: string[]): Promise<void> {
    // Mock implementation - would call Vercel API
  }

  /**
   * Enable performance monitoring
   */
  static enableMonitoring(): string {
    return `
      // Performance monitoring script
      (function() {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              // Send navigation timing
              fetch('/api/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'navigation',
                  metrics: {
                    pageLoadTime: entry.loadEventEnd - entry.loadEventStart,
                    timeToFirstByte: entry.responseStart - entry.requestStart,
                    domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                  }
                })
              });
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              // Track LCP
              fetch('/api/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'lcp',
                  metrics: {
                    largestContentfulPaint: entry.startTime,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                  }
                })
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
        
        // Track CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Send CLS on page unload
        window.addEventListener('beforeunload', () => {
          fetch('/api/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'cls',
              metrics: {
                cumulativeLayoutShift: clsValue,
                url: window.location.href,
                timestamp: new Date().toISOString()
              }
            })
          });
        });
      })();
    `
  }
}

export default PerformanceService
