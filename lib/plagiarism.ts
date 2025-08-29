/**
 * Plagiarism Detection System
 * Integrates with external APIs and implements text similarity algorithms
 */

import { logError, logInfo } from './logger'
import { db } from './db'
import { articles } from './db/schema'
import { eq } from 'drizzle-orm'

// Configuration for plagiarism detection services
const TURNITIN_API_URL = process.env.TURNITIN_API_URL
const TURNITIN_API_KEY = process.env.TURNITIN_API_KEY
const CROSSREF_API_URL = 'https://api.crossref.org'
const SEMANTIC_SCHOLAR_API_URL = 'https://api.semanticscholar.org'

// Types for plagiarism detection
export interface PlagiarismReport {
  articleId: string
  overallSimilarity: number
  sources: PlagiarismSource[]
  textMatches: TextMatch[]
  status: 'pending' | 'completed' | 'failed'
  generatedAt: Date
  service: 'turnitin' | 'crossref' | 'internal' | 'combined'
}

export interface PlagiarismSource {
  sourceId: string
  title: string
  authors: string[]
  url?: string
  doi?: string
  similarity: number
  matchedWords: number
  totalWords: number
  matches: TextMatch[]
}

export interface TextMatch {
  originalText: string
  matchedText: string
  similarity: number
  startPosition: number
  endPosition: number
  sourceId?: string
  sourceTitle?: string
  sourceUrl?: string
}

export interface SimilarityAnalysis {
  similarity: number
  matchedPhrases: string[]
  suspiciousPatterns: string[]
  recommendations: string[]
}

/**
 * Plagiarism Detection Service
 */
export class PlagiarismDetectionService {

  /**
   * Run comprehensive plagiarism check on article
   */
  static async checkPlagiarism(articleId: string): Promise<PlagiarismReport> {
    try {
      logInfo(`Starting plagiarism check for article ${articleId}`)

      // Get article content
      const article = await this.getArticleContent(articleId)
      if (!article || !article.content) {
        throw new NotFoundError(`Article ${articleId} not found or has no content`)
      }

      // Initialize report
      const report: PlagiarismReport = {
        articleId,
        overallSimilarity: 0,
        sources: [],
        textMatches: [],
        status: 'pending',
        generatedAt: new Date(),
        service: 'combined'
      }

      // Run multiple detection methods in parallel
      const [
        turnitinResults,
        crossrefResults,
        internalResults
      ] = await Promise.allSettled([
        this.checkWithTurnitin(article.content, article.title),
        this.checkWithCrossRef(article.content, article.title),
        this.checkInternalDatabase(article.content, articleId)
      ])

      // Process results
      const allSources: PlagiarismSource[] = []
      const allMatches: TextMatch[] = []

      if (turnitinResults.status === 'fulfilled' && turnitinResults.value.sources) {
        allSources.push(...turnitinResults.value.sources)
      }
      if (turnitinResults.status === 'fulfilled' && turnitinResults.value.textMatches) {
        allMatches.push(...turnitinResults.value.textMatches)
      }

      if (crossrefResults.status === 'fulfilled' && crossrefResults.value.sources) {
        allSources.push(...crossrefResults.value.sources)
      }
      if (crossrefResults.status === 'fulfilled' && crossrefResults.value.textMatches) {
        allMatches.push(...crossrefResults.value.textMatches)
      }

      if (internalResults.status === 'fulfilled' && internalResults.value.sources) {
        allSources.push(...internalResults.value.sources)
      }
      if (internalResults.status === 'fulfilled' && internalResults.value.textMatches) {
        allMatches.push(...internalResults.value.textMatches)
      }

      // Merge and deduplicate sources
      const mergedSources = this.mergeSimilarSources(allSources)
      const mergedMatches = this.deduplicateMatches(allMatches)

      // Calculate overall similarity
      const overallSimilarity = this.calculateOverallSimilarity(mergedMatches, article.content)

      report.sources = mergedSources
      report.textMatches = mergedMatches
      report.overallSimilarity = overallSimilarity
      report.status = 'completed'

      // Store report in database
      await this.storePlagiarismReport(report)

      logInfo(`Plagiarism check completed for article ${articleId}`, {
        similarity: overallSimilarity,
        sourcesFound: mergedSources.length
      })

      return report

    } catch (error) {
      logError(error as Error, { context: 'checkPlagiarism', articleId })
      throw new AppError('Failed to complete plagiarism check')
    }
  }

  /**
   * Check with Turnitin API (mock implementation for production use)
   */
  private static async checkWithTurnitin(content: string, title: string): Promise<Partial<PlagiarismReport>> {
    try {
      // For demonstration - in production, integrate with actual Turnitin API
      if (!TURNITIN_API_KEY) {
        return { sources: [], textMatches: [] }
      }

      const response = await fetch(`${TURNITIN_API_URL}/similarity`, {
        method: 'POST',
        headers: {
          'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${TURNITIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          language: 'en'
        }),
      })

      if (!response.ok) {
        throw new AppError(`Turnitin API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform Turnitin response to our format
      return this.transformTurnitinResponse(data)

    } catch (error) {
      logError(error as Error, { context: 'checkWithTurnitin' })
      return { sources: [], textMatches: [] }
    }
  }

  /**
   * Check against CrossRef database
   */
  private static async checkWithCrossRef(content: string, title: string): Promise<Partial<PlagiarismReport>> {
    try {
      const sources: PlagiarismSource[] = []
      const textMatches: TextMatch[] = []

      // Extract sentences for checking
      const sentences = this.extractSentences(content)
      
      for (const sentence of sentences.slice(0, 10)) { // Limit to avoid rate limiting
        if (sentence.length < 50) continue // Skip short sentences

        const searchResults = await this.searchCrossRef(sentence)
        
        for (const result of searchResults) {
          const similarity = this.calculateTextSimilarity(sentence, result.abstract || '')
          
          if (similarity > 0.7) { // 70% similarity threshold
            const source: PlagiarismSource = {
              sourceId: result.DOI || result.URL || `crossref-${Date.now()}`,
              title: result.title?.[0] || 'Unknown Title',
              authors: result.author?.map((a: unknown) => `${a.given} ${a.family}`) || [],
              doi: result.DOI,
              url: result.URL,
              similarity,
              matchedWords: sentence.split(' ').length,
              totalWords: sentence.split(' ').length,
              matches: [{
                originalText: sentence,
                matchedText: result.abstract || sentence,
                similarity,
                startPosition: content.indexOf(sentence),
                endPosition: content.indexOf(sentence) + sentence.length,
                sourceId: result.DOI,
                sourceTitle: result.title?.[0],
                sourceUrl: result.URL
              }]
            }

            sources.push(source)
            textMatches.push(...source.matches)
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return { sources, textMatches }

    } catch (error) {
      logError(error as Error, { context: 'checkWithCrossRef' })
      return { sources: [], textMatches: [] }
    }
  }

  /**
   * Check against internal article database
   */
  private static async checkInternalDatabase(content: string, excludeArticleId: string): Promise<Partial<PlagiarismReport>> {
    try {
      const sources: PlagiarismSource[] = []
      const textMatches: TextMatch[] = []

      // Get all published articles except the current one
      const existingArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          abstract: articles.abstract,
          content: articles.content
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .limit(100) // Limit for performance

      const sentences = this.extractSentences(content)

      for (const article of existingArticles) {
        if (article.id === excludeArticleId) continue

        const articleContent = article.content || article.abstract
        if (!articleContent) continue

        // Check for similar sentences
        for (const sentence of sentences) {
          if (sentence.length < 30) continue

          const similarity = this.findSimilarText(sentence, articleContent)
          
          if (similarity.similarity > 0.8) { // 80% similarity threshold
            const source: PlagiarismSource = {
              sourceId: article.id,
              title: article.title,
              authors: ['Internal Article'],
              similarity: similarity.similarity,
              matchedWords: sentence.split(' ').length,
              totalWords: sentence.split(' ').length,
              matches: [{
                originalText: sentence,
                matchedText: similarity.matchedText,
                similarity: similarity.similarity,
                startPosition: content.indexOf(sentence),
                endPosition: content.indexOf(sentence) + sentence.length,
                sourceId: article.id,
                sourceTitle: article.title
              }]
            }

            sources.push(source)
            textMatches.push(...source.matches)
          }
        }
      }

      return { sources, textMatches }

    } catch (error) {
      logError(error as Error, { context: 'checkInternalDatabase' })
      return { sources: [], textMatches: [] }
    }
  }

  /**
   * Advanced text similarity analysis
   */
  static async analyzeSimilarity(text1: string, text2: string): Promise<SimilarityAnalysis> {
    try {
      const similarity = this.calculateTextSimilarity(text1, text2)
      const matchedPhrases = this.findMatchedPhrases(text1, text2)
      const suspiciousPatterns = this.detectSuspiciousPatterns(text1, text2)
      const recommendations = this.generateRecommendations(similarity, matchedPhrases, suspiciousPatterns)

      return {
        similarity,
        matchedPhrases,
        suspiciousPatterns,
        recommendations
      }

    } catch (error) {
      logError(error as Error, { context: 'analyzeSimilarity' })
      throw new AppError('Failed to analyze text similarity')
    }
  }

  /**
   * Get plagiarism report for article
   */
  static async getPlagiarismReport(articleId: string): Promise<PlagiarismReport | null> {
    try {
      // In production, this would query a plagiarism_reports table
      // For now, we'll return a mock report structure
      return null
    } catch (error) {
      logError(error as Error, { context: 'getPlagiarismReport', articleId })
      return null
    }
  }

  // Private helper methods

  private static async getArticleContent(articleId: string) {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        content: articles.content
      })
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1)

    return result[0] || null
  }

  private static async searchCrossRef(query: string): Promise<any[]> {
    try {
      const encodedQuery = encodeURIComponent(query.substring(0, 200)) // Limit query length
      const response = await fetch(
        `${CROSSREF_API_URL}/works?query=${encodedQuery}&rows=5&mailto=process.env.EMAIL_FROMyourjournal.com`
      )

      if (!response.ok) {
        throw new AppError(`CrossRef API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.message?.items || []

    } catch (error) {
      logError(error as Error, { context: 'searchCrossRef' })
      return []
    }
  }

  private static extractSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 50) // Limit sentences for performance
  }

  private static calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity implementation
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  private static findSimilarText(needle: string, haystack: string): { similarity: number; matchedText: string } {
    const sentences = haystack.split(/[.!?]+/).map(s => s.trim())
    let bestMatch = { similarity: 0, matchedText: '' }

    for (const sentence of sentences) {
      const similarity = this.calculateTextSimilarity(needle, sentence)
      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity, matchedText: sentence }
      }
    }

    return bestMatch
  }

  private static findMatchedPhrases(text1: string, text2: string): string[] {
    const phrases: string[] = []
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    // Find common phrases of 3+ words
    for (let i = 0; i < words1.length - 2; i++) {
      for (let j = 0; j < words2.length - 2; j++) {
        let matchLength = 0
        while (
          i + matchLength < words1.length &&
          j + matchLength < words2.length &&
          words1[i + matchLength] === words2[j + matchLength]
        ) {
          matchLength++
        }

        if (matchLength >= 3) {
          phrases.push(words1.slice(i, i + matchLength).join(' '))
        }
      }
    }

    return [...new Set(phrases)] // Remove duplicates
  }

  private static detectSuspiciousPatterns(text1: string, text2: string): string[] {
    const patterns: string[] = []

    // Check for exact phrase matches
    const sentences1 = this.extractSentences(text1)
    const sentences2 = this.extractSentences(text2)

    for (const sent1 of sentences1) {
      for (const sent2 of sentences2) {
        if (sent1.length > 30 && this.calculateTextSimilarity(sent1, sent2) > 0.9) {
          patterns.push(`High similarity sentence: "${sent1.substring(0, 100)}..."`)
        }
      }
    }

    return patterns
  }

  private static generateRecommendations(
    similarity: number,
    matchedPhrases: string[],
    suspiciousPatterns: string[]
  ): string[] {
    const recommendations: string[] = []

    if (similarity > 0.8) {
      recommendations.push('High similarity detected - thorough review required')
    } else if (similarity > 0.5) {
      recommendations.push('Moderate similarity - check for proper citations')
    }

    if (matchedPhrases.length > 5) {
      recommendations.push('Multiple phrase matches found - verify originality')
    }

    if (suspiciousPatterns.length > 0) {
      recommendations.push('Suspicious patterns detected - manual review recommended')
    }

    if (recommendations.length === 0) {
      recommendations.push('Low similarity - appears to be original content')
    }

    return recommendations
  }

  private static mergeSimilarSources(sources: PlagiarismSource[]): PlagiarismSource[] {
    // Simple deduplication by DOI or URL
    const seen = new Set()
    return sources.filter(source => {
      const key = source.doi || source.url || source.sourceId
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private static deduplicateMatches(matches: TextMatch[]): TextMatch[] {
    // Remove duplicate matches based on text and position
    const seen = new Set()
    return matches.filter(match => {
      const key = `${match.originalText}-${match.startPosition}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private static calculateOverallSimilarity(matches: TextMatch[], content: string): number {
    if (matches.length === 0) return 0

    const totalMatchedChars = matches.reduce((sum, match) => 
      sum + (match.endPosition - match.startPosition), 0
    )
    
    return Math.min(100, (totalMatchedChars / content.length) * 100)
  }

  private static transformTurnitinResponse(data: unknown): Partial<PlagiarismReport> {
    // Transform Turnitin API response to our format
    // This would depend on actual Turnitin API structure
    return {
      sources: data.sources?.map((source: unknown) => ({
        sourceId: source.id,
        title: source.title,
        authors: source.authors || [],
        url: source.url,
        similarity: source.similarity,
        matchedWords: source.matched_words,
        totalWords: source.total_words,
        matches: source.matches || []
      })) || [],
      textMatches: data.matches || []
    }
  }

  private static async storePlagiarismReport(report: PlagiarismReport): Promise<void> {
    // In production, store in plagiarism_reports table
    logInfo(`Storing plagiarism report for article ${report.articleId}`, {
      similarity: report.overallSimilarity,
      sources: report.sources.length
    })
  }
}

export default PlagiarismDetectionService
