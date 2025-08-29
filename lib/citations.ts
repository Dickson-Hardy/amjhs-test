/**
 * Citation Management System
 * Handles reference formatting, validation, and automated citation checking
 */

import { logError, logInfo } from './logger'
import { db } from './db'
import { articles } from './db/schema'
import { eq } from 'drizzle-orm'

// Citation styles and formats
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'vancouver' | 'ieee'

// Types for citation management
export interface Citation {
  id: string
  type: 'journal' | 'book' | 'website' | 'conference' | 'thesis' | 'other'
  title: string
  authors: Author[]
  year?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  doi?: string
  url?: string
  accessDate?: Date
  isbn?: string
  location?: string
  rawText?: string
}

export interface Author {
  firstName: string
  lastName: string
  middleName?: string
  suffix?: string
}

export interface CitationValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  metadata?: unknown
}

export interface BibliographyEntry {
  citation: Citation
  formattedText: string
  inTextCitation: string
  style: CitationStyle
}

export interface ReferenceAnalysis {
  totalReferences: number
  validReferences: number
  invalidReferences: number
  duplicateReferences: number
  missingFields: string[]
  qualityScore: number
  recommendations: string[]
}

/**
 * Citation Management Service
 */
export class CitationService {

  /**
   * Parse and extract citations from article text
   */
  static async extractCitations(articleText: string): Promise<Citation[]> {
    try {
      const citations: Citation[] = []

      // Extract DOI-based citations
      const doiCitations = this.extractDOICitations(articleText)
      citations.push(...doiCitations)

      // Extract URL-based citations
      const urlCitations = this.extractURLCitations(articleText)
      citations.push(...urlCitations)

      // Extract formatted citations (APA, MLA, etc.)
      const formattedCitations = this.extractFormattedCitations(articleText)
      citations.push(...formattedCitations)

      // Deduplicate citations
      const uniqueCitations = this.deduplicateCitations(citations)

      logInfo(`Extracted ${uniqueCitations.length} citations from article`, {
        doiCount: doiCitations.length,
        urlCount: urlCitations.length,
        formattedCount: formattedCitations.length
      })

      return uniqueCitations

    } catch (error) {
      logError(error as Error, { context: 'extractCitations' })
      throw new AppError('Failed to extract citations')
    }
  }

  /**
   * Validate citations and check accessibility
   */
  static async validateCitations(citations: Citation[]): Promise<CitationValidation[]> {
    try {
      const validations: CitationValidation[] = []

      for (const citation of citations) {
        const validation = await this.validateSingleCitation(citation)
        validations.push(validation)

        // Rate limiting for external API calls
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return validations

    } catch (error) {
      logError(error as Error, { context: 'validateCitations' })
      throw new AppError('Failed to validate citations')
    }
  }

  /**
   * Format citations in specified style
   */
  static formatCitation(citation: Citation, style: CitationStyle): BibliographyEntry {
    try {
      let formattedText = ''
      let inTextCitation = ''

      switch (style) {
        case 'apa':
          formattedText = this.formatAPA(citation)
          inTextCitation = this.formatAPAInText(citation)
          break
        case 'mla':
          formattedText = this.formatMLA(citation)
          inTextCitation = this.formatMLAInText(citation)
          break
        case 'chicago':
          formattedText = this.formatChicago(citation)
          inTextCitation = this.formatChicagoInText(citation)
          break
        case 'harvard':
          formattedText = this.formatHarvard(citation)
          inTextCitation = this.formatHarvardInText(citation)
          break
        case 'vancouver':
          formattedText = this.formatVancouver(citation)
          inTextCitation = this.formatVancouverInText(citation)
          break
        case 'ieee':
          formattedText = this.formatIEEE(citation)
          inTextCitation = this.formatIEEEInText(citation)
          break
        default:
          throw new AppError(`Unsupported citation style: ${style}`)
      }

      return {
        citation,
        formattedText,
        inTextCitation,
        style
      }

    } catch (error) {
      logError(error as Error, { context: 'formatCitation', style })
      throw new AppError(`Failed to format citation in ${style} style`)
    }
  }

  /**
   * Generate complete bibliography
   */
  static generateBibliography(citations: Citation[], style: CitationStyle): BibliographyEntry[] {
    try {
      const bibliography = citations.map(citation => this.formatCitation(citation, style))

      // Sort bibliography alphabetically by first author's last name
      bibliography.sort((a, b) => {
        const aAuthor = a.citation.authors[0]?.lastName || ''
        const bAuthor = b.citation.authors[0]?.lastName || ''
        return aAuthor.localeCompare(bAuthor)
      })

      return bibliography

    } catch (error) {
      logError(error as Error, { context: 'generateBibliography', style })
      throw new AppError('Failed to generate bibliography')
    }
  }

  /**
   * Analyze reference quality and completeness
   */
  static async analyzeReferences(citations: Citation[]): Promise<ReferenceAnalysis> {
    try {
      const validations = await this.validateCitations(citations)
      
      const totalReferences = citations.length
      const validReferences = validations.filter(v => v.isValid).length
      const invalidReferences = totalReferences - validReferences

      // Find duplicates
      const duplicateReferences = this.findDuplicateCitations(citations).length

      // Analyze missing fields
      const missingFields = this.analyzeMissingFields(citations)

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(citations, validations)

      // Generate recommendations
      const recommendations = this.generateQualityRecommendations(citations, validations)

      const analysis: ReferenceAnalysis = {
        totalReferences,
        validReferences,
        invalidReferences,
        duplicateReferences,
        missingFields,
        qualityScore,
        recommendations
      }

      logInfo('Reference analysis completed', analysis)

      return analysis

    } catch (error) {
      logError(error as Error, { context: 'analyzeReferences' })
      throw new AppError('Failed to analyze references')
    }
  }

  /**
   * Search for citation metadata using DOI or title
   */
  static async searchCitationMetadata(query: string): Promise<Citation[]> {
    try {
      const results: Citation[] = []

      // Try DOI lookup first
      if (this.isDOI(query)) {
        const doiResult = await this.lookupDOI(query)
        if (doiResult) results.push(doiResult)
      }

      // Search CrossRef
      const crossrefResults = await this.searchCrossRef(query)
      results.push(...crossrefResults)

      // Search Semantic Scholar
      const semanticResults = await this.searchSemanticScholar(query)
      results.push(...semanticResults)

      return this.deduplicateCitations(results)

    } catch (error) {
      logError(error as Error, { context: 'searchCitationMetadata', query })
      throw new AppError('Failed to search citation metadata')
    }
  }

  // Private helper methods

  private static extractDOICitations(text: string): Citation[] {
    const doiRegex = /10\.\d{4,}\/[^\s]+/g
    const dois = text.match(doiRegex) || []

    return dois.map(doi => ({
      id: `doi-${doi}`,
      type: 'journal' as const,
      title: 'Unknown Title',
      authors: [],
      doi: doi.trim(),
      rawText: doi
    }))
  }

  private static extractURLCitations(text: string): Citation[] {
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex) || []

    return urls.map(url => ({
      id: `url-${Date.now()}-${Math.random()}`,
      type: 'website' as const,
      title: 'Unknown Title',
      authors: [],
      url: url.trim(),
      rawText: url
    }))
  }

  private static extractFormattedCitations(text: string): Citation[] {
    // Simple pattern matching for common citation formats
    // This would be much more sophisticated in production
    const citationPatterns = [
      // APA-style: Author, A. A. (Year). Title. Journal, Volume(Issue), pages.
      /([A-Z][a-z]+,\s+[A-Z]\.\s*(?:[A-Z]\.)?\s*\(\d{4}\)\..*?\.)/g,
      // IEEE-style: [1] A. Author, "Title," Journal, vol. X, no. Y, pp. Z-W, Year.
      /\[\d+\]\s+[A-Z]\.?\s*[A-Z][a-z]+.*?"/g
    ]

    const citations: Citation[] = []
    
    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      matches.forEach(match => {
        citations.push({
          id: `formatted-${Date.now()}-${Math.random()}`,
          type: 'journal',
          title: 'Parsed Title',
          authors: [],
          rawText: match.trim()
        })
      })
    })

    return citations
  }

  private static async validateSingleCitation(citation: Citation): Promise<CitationValidation> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check required fields
    if (!citation.title || citation.title === 'Unknown Title') {
      errors.push('Title is missing or unknown')
    }

    if (!citation.authors || citation.authors.length === 0) {
      errors.push('No authors specified')
    }

    if (!citation.year) {
      warnings.push('Publication year is missing')
    }

    // Type-specific validation
    switch (citation.type) {
      case 'journal':
        if (!citation.journal) {
          warnings.push('Journal name is missing')
        }
        if (!citation.doi && !citation.url) {
          suggestions.push('Consider adding DOI or URL for accessibility')
        }
        break
      case 'book':
        if (!citation.publisher) {
          warnings.push('Publisher is missing')
        }
        if (!citation.isbn) {
          suggestions.push('Consider adding ISBN')
        }
        break
      case 'website':
        if (!citation.url) {
          errors.push('URL is required for website citations')
        }
        if (!citation.accessDate) {
          warnings.push('Access date is recommended for website citations')
        }
        break
    }

    // Check DOI validity
    if (citation.doi && !this.isDOI(citation.doi)) {
      errors.push('Invalid DOI format')
    }

    // Check URL accessibility (simplified)
    if (citation.url) {
      try {
        const response = await fetch(citation.url, { method: 'HEAD' })
        if (!response.ok) {
          warnings.push('URL may not be accessible')
        }
      } catch {
        warnings.push('Could not verify URL accessibility')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  private static isDOI(text: string): boolean {
    return /^10\.\d{4,}\/[^\s]+$/.test(text.trim())
  }

  private static async lookupDOI(doi: string): Promise<Citation | null> {
    try {
      const response = await fetch(`https://api.crossref.org/works/${doi}`)
      if (!response.ok) return null

      const data = await response.json()
      const work = data.message

      return {
        id: `crossref-${doi}`,
        type: 'journal',
        title: work.title?.[0] || 'Unknown Title',
        authors: work.author?.map((a: unknown) => ({
          firstName: a.given || '',
          lastName: a.family || ''
        })) || [],
        year: work.published?.['date-parts']?.[0]?.[0],
        journal: work['container-title']?.[0],
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        doi: work.DOI,
        url: work.URL
      }
    } catch {
      return null
    }
  }

  private static async searchCrossRef(query: string): Promise<Citation[]> {
    try {
      const encodedQuery = encodeURIComponent(query.substring(0, 200))
      const response = await fetch(
        `https://api.crossref.org/works?query=${encodedQuery}&rows=5&mailto=process.env.EMAIL_FROMyourjournal.com`
      )

      if (!response.ok) return []

      const data = await response.json()
      return data.message?.items?.map((work: unknown) => ({
        id: `crossref-${work.DOI || Date.now()}`,
        type: 'journal' as const,
        title: work.title?.[0] || 'Unknown Title',
        authors: work.author?.map((a: unknown) => ({
          firstName: a.given || '',
          lastName: a.family || ''
        })) || [],
        year: work.published?.['date-parts']?.[0]?.[0],
        journal: work['container-title']?.[0],
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        doi: work.DOI,
        url: work.URL
      })) || []

    } catch {
      return []
    }
  }

  private static async searchSemanticScholar(query: string): Promise<Citation[]> {
    try {
      const encodedQuery = encodeURIComponent(query.substring(0, 200))
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=5&fields=title,authors,year,journal,doi,url`
      )

      if (!response.ok) return []

      const data = await response.json()
      return data.data?.map((paper: unknown) => ({
        id: `semantic-${paper.paperId || Date.now()}`,
        type: 'journal' as const,
        title: paper.title || 'Unknown Title',
        authors: paper.authors?.map((a: unknown) => ({
          firstName: a.name?.split(' ').slice(0, -1).join(' ') || '',
          lastName: a.name?.split(' ').slice(-1)[0] || ''
        })) || [],
        year: paper.year,
        journal: paper.journal?.name,
        doi: paper.doi,
        url: paper.url
      })) || []

    } catch {
      return []
    }
  }

  private static deduplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Set()
    return citations.filter(citation => {
      const key = citation.doi || citation.url || citation.title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private static findDuplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Map()
    const duplicates: Citation[] = []

    citations.forEach(citation => {
      const key = citation.doi || citation.title.toLowerCase()
      if (seen.has(key)) {
        duplicates.push(citation)
      } else {
        seen.set(key, citation)
      }
    })

    return duplicates
  }

  private static analyzeMissingFields(citations: Citation[]): string[] {
    const fieldCounts = new Map()
    const totalCitations = citations.length

    citations.forEach(citation => {
      Object.entries(citation).forEach(([field, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1)
        }
      })
    })

    const missingFields: string[] = []
    fieldCounts.forEach((count, field) => {
      if (count / totalCitations > 0.5) { // More than 50% missing
        missingFields.push(field)
      }
    })

    return missingFields
  }

  private static calculateQualityScore(citations: Citation[], validations: CitationValidation[]): number {
    if (citations.length === 0) return 0

    let score = 0
    const maxScore = citations.length * 100

    validations.forEach((validation, index) => {
      const citation = citations[index]
      let citationScore = 0

      // process.env.AUTH_TOKEN_PREFIX + ' 'validity (40 points)
      if (validation.isValid) citationScore += 40

      // Completeness (30 points)
      const requiredFields = ['title', 'authors', 'year']
      const completedRequired = requiredFields.filter(field => 
        citation[field as keyof Citation] && 
        (!Array.isArray(citation[field as keyof Citation]) || 
         (citation[field as keyof Citation] as any[]).length > 0)
      ).length
      citationScore += (completedRequired / requiredFields.length) * 30

      // Additional metadata (20 points)
      const optionalFields = ['doi', 'journal', 'volume', 'pages']
      const completedOptional = optionalFields.filter(field => 
        citation[field as keyof Citation]
      ).length
      citationScore += (completedOptional / optionalFields.length) * 20

      // No warnings/errors bonus (10 points)
      if (validation.warnings.length === 0 && validation.errors.length === 0) {
        citationScore += 10
      }

      score += citationScore
    })

    return Math.round((score / maxScore) * 100)
  }

  private static generateQualityRecommendations(
    citations: Citation[], 
    validations: CitationValidation[]
  ): string[] {
    const recommendations: string[] = []

    const invalidCount = validations.filter(v => !v.isValid).length
    if (invalidCount > 0) {
      recommendations.push(`Fix ${invalidCount} invalid citation(s)`)
    }

    const missingDOIs = citations.filter(c => c.type === 'journal' && !c.doi).length
    if (missingDOIs > 0) {
      recommendations.push(`Add DOIs to ${missingDOIs} journal citation(s)`)
    }

    const missingYears = citations.filter(c => !c.year).length
    if (missingYears > 0) {
      recommendations.push(`Add publication years to ${missingYears} citation(s)`)
    }

    const duplicates = this.findDuplicateCitations(citations)
    if (duplicates.length > 0) {
      recommendations.push(`Remove ${duplicates.length} duplicate citation(s)`)
    }

    if (recommendations.length === 0) {
      recommendations.push('Citations are well-formatted and complete')
    }

    return recommendations
  }

  // Citation formatting methods for different styles

  private static formatAPA(citation: Citation): string {
    const authors = this.formatAuthorsAPA(citation.authors)
    const year = citation.year ? `(${citation.year})` : '(n.d.)'
    const title = citation.title
    
    let formatted = `${authors} ${year}. ${title}.`
    
    if (citation.journal) {
      formatted += ` ${citation.journal}`
      if (citation.volume) {
        formatted += `, ${citation.volume}`
        if (citation.issue) formatted += `(${citation.issue})`
      }
      if (citation.pages) formatted += `, ${citation.pages}`
    }
    
    if (citation.doi) {
      formatted += ` https://doi.org/${citation.doi}`
    }
    
    return formatted
  }

  private static formatAPAInText(citation: Citation): string {
    const firstAuthor = citation.authors[0]
    if (!firstAuthor) return '(Unknown, n.d.)'
    
    const year = citation.year || 'n.d.'
    
    if (citation.authors.length === 1) {
      return `(${firstAuthor.lastName}, ${year})`
    } else if (citation.authors.length === 2) {
      return `(${firstAuthor.lastName} & ${citation.authors[1].lastName}, ${year})`
    } else {
      return `(${firstAuthor.lastName} et al., ${year})`
    }
  }

  private static formatMLA(citation: Citation): string {
    const authors = this.formatAuthorsMLA(citation.authors)
    const title = `"${citation.title}"`
    
    let formatted = `${authors}. ${title}.`
    
    if (citation.journal) {
      formatted += ` ${citation.journal}`
      if (citation.volume) formatted += `, vol. ${citation.volume}`
      if (citation.issue) formatted += `, no. ${citation.issue}`
      if (citation.year) formatted += `, ${citation.year}`
      if (citation.pages) formatted += `, pp. ${citation.pages}`
    }
    
    return formatted
  }

  private static formatMLAInText(citation: Citation): string {
    const firstAuthor = citation.authors[0]
    if (!firstAuthor) return '(Unknown)'
    
    if (citation.authors.length === 1) {
      return `(${firstAuthor.lastName})`
    } else if (citation.authors.length === 2) {
      return `(${firstAuthor.lastName} and ${citation.authors[1].lastName})`
    } else {
      return `(${firstAuthor.lastName} et al.)`
    }
  }

  private static formatChicago(citation: Citation): string {
    // Chicago format implementation
    return this.formatAPA(citation) // Simplified - use APA as base
  }

  private static formatChicagoInText(citation: Citation): string {
    return this.formatAPAInText(citation) // Simplified
  }

  private static formatHarvard(citation: Citation): string {
    // Harvard format implementation
    return this.formatAPA(citation) // Simplified
  }

  private static formatHarvardInText(citation: Citation): string {
    return this.formatAPAInText(citation) // Simplified
  }

  private static formatVancouver(citation: Citation): string {
    const authors = this.formatAuthorsVancouver(citation.authors)
    const title = citation.title
    
    let formatted = `${authors}. ${title}.`
    
    if (citation.journal) {
      formatted += ` ${citation.journal}`
      if (citation.year) formatted += `. ${citation.year}`
      if (citation.volume) formatted += `;${citation.volume}`
      if (citation.issue) formatted += `(${citation.issue})`
      if (citation.pages) formatted += `:${citation.pages}`
    }
    
    return formatted
  }

  private static formatVancouverInText(citation: Citation): string {
    return '[1]' // Vancouver uses numbered citations
  }

  private static formatIEEE(citation: Citation): string {
    const authors = this.formatAuthorsIEEE(citation.authors)
    const title = `"${citation.title}"`
    
    let formatted = `${authors}, ${title}`
    
    if (citation.journal) {
      formatted += `, ${citation.journal}`
      if (citation.volume) formatted += `, vol. ${citation.volume}`
      if (citation.issue) formatted += `, no. ${citation.issue}`
      if (citation.pages) formatted += `, pp. ${citation.pages}`
      if (citation.year) formatted += `, ${citation.year}`
    }
    
    return formatted + '.'
  }

  private static formatIEEEInText(citation: Citation): string {
    return '[1]' // IEEE uses numbered citations
  }

  // Author formatting helpers

  private static formatAuthorsAPA(authors: Author[]): string {
    if (authors.length === 0) return 'Unknown Author'
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}.`
    }
    
    const formattedAuthors = authors.map((author, index) => {
      if (index === authors.length - 1 && authors.length > 1) {
        return `& ${author.lastName}, ${author.firstName.charAt(0)}.`
      }
      return `${author.lastName}, ${author.firstName.charAt(0)}.`
    })
    
    return formattedAuthors.join(', ')
  }

  private static formatAuthorsMLA(authors: Author[]): string {
    if (authors.length === 0) return 'Unknown Author'
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}`
    }
    
    const first = `${authors[0].lastName}, ${authors[0].firstName}`
    const rest = authors.slice(1).map(a => `${a.firstName} ${a.lastName}`)
    
    return [first, ...rest].join(', ')
  }

  private static formatAuthorsVancouver(authors: Author[]): string {
    if (authors.length === 0) return 'Unknown Author'
    
    return authors.map(author => 
      `${author.lastName} ${author.firstName.charAt(0)}`
    ).join(', ')
  }

  private static formatAuthorsIEEE(authors: Author[]): string {
    if (authors.length === 0) return 'Unknown Author'
    
    return authors.map(author => 
      `${author.firstName.charAt(0)}. ${author.lastName}`
    ).join(', ')
  }
}

export default CitationService
