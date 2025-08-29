import { logger } from "./logger"
import { db } from "./db"
import { articles, journals } from "./db/schema"
import { eq } from "drizzle-orm"

export interface SEOMetadata {
  title: string
  description: string
  keywords: string[]
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  jsonLd?: Record<string, any>
  robots?: string
  hreflang?: Record<string, string>
}

export interface ArticleSEOData {
  id: string
  title: string
  abstract: string
  authors: string[]
  authorAffiliations: string[]
  keywords: string[]
  category: string
  publishedDate: string
  doi?: string
  url: string
  pdfUrl?: string
  citationCount: number
  viewCount: number
}

export interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

export class SEOManagementService {
  private readonly baseUrl: string
  private readonly journalName: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://journal.example.com'
    this.journalName = process.env.JOURNAL_NAME || 'Academic Journal'
  }

  /**
   * Generate comprehensive SEO metadata for an article
   */
  async generateArticleSEO(articleId: string): Promise<SEOMetadata> {
    try {
      const article = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1)

      if (!article.length) {
        throw new NotFoundError(`Article not found: ${articleId}`)
      }

      const articleData = article[0]
      const articleUrl = `${this.baseUrl}/article/${articleId}`

      // Generate optimized title (max 60 characters for search engines)
      const seoTitle = this.optimizeTitle(articleData.title)

      // Generate meta description (max 160 characters)
      const seoDescription = this.optimizeDescription(articleData.abstract)

      // Combine article keywords with inferred keywords
      const seoKeywords = [
        ...articleData.keywords,
        ...this.extractKeywordsFromContent(articleData.title, articleData.abstract),
        articleData.category,
        ...articleData.authors.slice(0, 3) // Include top 3 authors as keywords
      ].filter(Boolean).slice(0, 20) // Limit to 20 keywords

      // Generate structured data for the article
      const jsonLd = this.generateArticleStructuredData({
        id: articleData.id,
        title: articleData.title,
        abstract: articleData.abstract,
        authors: articleData.authors,
        authorAffiliations: articleData.authorAffiliations,
        keywords: articleData.keywords,
        category: articleData.category,
        publishedDate: articleData.publishedDate,
        doi: articleData.doi,
        url: articleUrl,
        pdfUrl: articleData.pdfUrl,
        citationCount: articleData.citationCount,
        viewCount: articleData.viewCount
      })

      return {
        title: seoTitle,
        description: seoDescription,
        keywords: seoKeywords,
        canonical: articleUrl,
        ogTitle: seoTitle,
        ogDescription: seoDescription,
        ogImage: this.generateOGImage(articleData),
        ogType: 'article',
        twitterCard: 'summary_large_image',
        twitterTitle: seoTitle,
        twitterDescription: seoDescription,
        twitterImage: this.generateOGImage(articleData),
        jsonLd,
        robots: 'index,follow',
        hreflang: this.generateHreflang(articleUrl)
      }
    } catch (error) {
      logger.error("Failed to generate article SEO", { error, articleId })
      throw error
    }
  }

  /**
   * Generate SEO metadata for the journal homepage
   */
  generateHomepageSEO(): SEOMetadata {
    const homeUrl = this.baseUrl

    return {
      title: `${this.journalName} - Peer-Reviewed Academic Research`,
      description: `${this.journalName} publishes high-quality peer-reviewed research articles across multiple disciplines. Access the latest academic publications and research findings.`,
      keywords: [
        'academic journal',
        'peer review',
        'research articles',
        'scientific publication',
        'academic research',
        this.journalName.toLowerCase()
      ],
      canonical: homeUrl,
      ogTitle: this.journalName,
      ogDescription: `Leading academic journal publishing peer-reviewed research`,
      ogImage: `${this.baseUrl}/og-image.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: this.journalName,
      twitterDescription: `Leading academic journal publishing peer-reviewed research`,
      twitterImage: `${this.baseUrl}/og-image.jpg`,
      jsonLd: this.generateJournalStructuredData(),
      robots: 'index,follow'
    }
  }

  /**
   * Generate SEO metadata for archive pages
   */
  generateArchiveSEO(filters?: { category?: string, year?: string, volume?: string }): SEOMetadata {
    let title = `Article Archive - ${this.journalName}`
    let description = `Browse our complete archive of peer-reviewed research articles`

    if (filters?.category) {
      title = `${filters.category} Articles - ${this.journalName}`
      description = `Browse ${filters.category} research articles published in ${this.journalName}`
    }

    if (filters?.year) {
      title = `${filters.year} Articles - ${this.journalName}`
      description = `Research articles published in ${filters.year} - ${this.journalName}`
    }

    if (filters?.volume) {
      title = `Volume ${filters.volume} - ${this.journalName}`
      description = `Articles from Volume ${filters.volume} of ${this.journalName}`
    }

    const archiveUrl = `${this.baseUrl}/archive`

    return {
      title: this.optimizeTitle(title),
      description: this.optimizeDescription(description),
      keywords: [
        'article archive',
        'research articles',
        'academic publications',
        filters?.category,
        filters?.year,
        this.journalName.toLowerCase()
      ].filter(Boolean),
      canonical: archiveUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      robots: 'index,follow'
    }
  }

  /**
   * Generate comprehensive sitemap for the journal
   */
  async generateSitemap(): Promise<SitemapEntry[]> {
    try {
      const sitemap: SitemapEntry[] = []

      // Add homepage
      sitemap.push({
        url: this.baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 1.0
      })

      // Add static pages
      const staticPages = [
        { path: '/about', priority: 0.8, changeFreq: 'monthly' as const },
        { path: '/archive', priority: 0.9, changeFreq: 'daily' as const },
        { path: '/submit', priority: 0.7, changeFreq: 'monthly' as const },
        { path: '/editorial-board', priority: 0.6, changeFreq: 'monthly' as const },
        { path: '/author-guidelines', priority: 0.7, changeFreq: 'monthly' as const },
        { path: '/peer-review', priority: 0.6, changeFreq: 'monthly' as const },
        { path: '/contact', priority: 0.5, changeFreq: 'yearly' as const }
      ]

      staticPages.forEach(page => {
        sitemap.push({
          url: `${this.baseUrl}${page.path}`,
          lastModified: new Date().toISOString(),
          changeFrequency: page.changeFreq,
          priority: page.priority
        })
      })

      // Add all published articles
      const publishedArticles = await db
        .select({
          id: articles.id,
          updatedAt: articles.updatedAt,
          publishedDate: articles.publishedDate
        })
        .from(articles)
        .where(eq(articles.status, 'published'))

      publishedArticles.forEach(article => {
        sitemap.push({
          url: `${this.baseUrl}/article/${article.id}`,
          lastModified: article.updatedAt || article.publishedDate,
          changeFrequency: 'monthly',
          priority: 0.8
        })
      })

      // Sort by priority (highest first)
      return sitemap.sort((a, b) => b.priority - a.priority)

    } catch (error) {
      logger.error("Failed to generate sitemap", { error })
      throw error
    }
  }

  /**
   * Generate XML sitemap string
   */
  async generateSitemapXML(): Promise<string> {
    const entries = await this.generateSitemap()

    const xmlEntries = entries.map(entry => `
  <url>
    <loc>${this.escapeXML(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /article/
Allow: /archive/
Allow: /about/`
  }

  private optimizeTitle(title: string): string {
    // Truncate to 60 characters for optimal SEO
    if (title.length <= 60) return title
    
    const truncated = title.substring(0, 57)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 40 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }

  private optimizeDescription(description: string): string {
    // Truncate to 160 characters for optimal SEO
    if (description.length <= 160) return description
    
    const truncated = description.substring(0, 157)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 140 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }

  private extractKeywordsFromContent(title: string, abstract: string): string[] {
    const text = `${title} ${abstract}`.toLowerCase()
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'this', 'that', 'these', 'those'])
    
    return text
      .match(/\b[a-z]{3,}\b/g) // Extract words 3+ characters
      ?.filter(word => !commonWords.has(word))
      .reduce((acc, word) => {
        // Count word frequency
        acc[word] = (acc[word] || 0) + 1
        return acc
      }, {} as Record<string, number>) 
      ? Object.entries(text.match(/\b[a-z]{3,}\b/g)?.filter(word => !commonWords.has(word)).reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word)
      : []
  }

  private generateArticleStructuredData(article: ArticleSEOData): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      "headline": article.title,
      "description": article.abstract,
      "author": article.authors.map((author, index) => ({
        "@type": "Person",
        "name": author,
        "affiliation": article.authorAffiliations[index] ? {
          "@type": "Organization",
          "name": article.authorAffiliations[index]
        } : undefined
      })),
      "datePublished": article.publishedDate,
      "publisher": {
        "@type": "Organization",
        "name": this.journalName,
        "url": this.baseUrl
      },
      "url": article.url,
      "identifier": article.doi ? {
        "@type": "PropertyValue",
        "propertyID": "DOI",
        "value": article.doi
      } : undefined,
      "keywords": article.keywords,
      "genre": article.category,
      "isPartOf": {
        "@type": "Periodical",
        "name": this.journalName,
        "url": this.baseUrl
      },
      "citation": article.citationCount,
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/ViewAction",
          "userInteractionCount": article.viewCount
        },
        {
          "@type": "InteractionCounter", 
          "interactionType": "https://schema.org/CiteAction",
          "userInteractionCount": article.citationCount
        }
      ]
    }
  }

  private generateJournalStructuredData(): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "Periodical",
      "name": this.journalName,
      "url": this.baseUrl,
      "description": `${this.journalName} is a peer-reviewed academic journal publishing high-quality research across multiple disciplines`,
      "publisher": {
        "@type": "Organization",
        "name": this.journalName,
        "url": this.baseUrl
      },
      "issn": process.env.JOURNAL_ISSN,
      "inLanguage": "en",
      "genre": "academic journal"
    }
  }

  private generateOGImage(article: unknown): string {
    // Generate dynamic OG image URL (would integrate with image generation service)
    const params = new URLSearchParams({
      title: article.title.substring(0, 100),
      authors: article.authors.slice(0, 3).join(', '),
      category: article.category
    })
    
    return `${this.baseUrl}/api/og-image?${params}`
  }

  private generateHreflang(url: string): Record<string, string> {
    // For multilingual support (placeholder)
    return {
      'en': url,
      'x-default': url
    }
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

// Export singleton instance
export const seoManagementService = new SEOManagementService()
