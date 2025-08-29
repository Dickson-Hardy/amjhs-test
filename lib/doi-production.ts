/**
 * Production DOI Service - Real CrossRef Integration
 * Handles DOI generation, registration, and verification with CrossRef API
 */

import { logError, logInfo } from './logger'

// CrossRef API configuration
const CROSSREF_API_URL = process.env.CROSSREF_API_URL || 'https://api.crossref.org'
const CROSSREF_DEPOSIT_URL = process.env.CROSSREF_DEPOSIT_URL || 'https://test.crossref.org/servlet/deposit'
const DOI_PREFIX = process.env.DOI_PREFIX || '10.1234'
const JOURNAL_CODE = 'amhsj'

export interface DOIMetadata {
  articleId: string
  title: string
  authors: Array<{
    given: string
    family: string
    orcid?: string
    affiliation: string
    email?: string
  }>
  abstract: string
  publicationDate: string
  volume: string
  issue: string
  pages?: string
  keywords: string[]
  category: string
  url?: string
  language?: string
}

export interface DOIRegistrationResult {
  success: boolean
  doi?: string
  registrationId?: string
  status?: 'submitted' | 'accepted' | 'failed'
  error?: string
  timestamp: Date
  batchId?: string
}

export interface DOIVerificationResult {
  exists: boolean
  metadata?: unknown
  registeredAt?: string
  citationCount?: number
  error?: string
}

/**
 * Production DOI Service with Real CrossRef Integration
 */
export class ProductionDOIService {
  
  /**
   * Generate a unique DOI for an article
   */
  static generateDOI(articleData: {
    year: number
    volume: string
    issue: string
    articleNumber: number
  }): string {
    const { year, volume, issue, articleNumber } = articleData
    return `${DOI_PREFIX}/${JOURNAL_CODE}.${year}.${volume}.${issue}.${articleNumber.toString().padStart(3, "0")}`
  }

  /**
   * Register DOI with CrossRef - Production Implementation
   */
  static async registerWithCrossRef(
    doi: string, 
    metadata: DOIMetadata
  ): Promise<DOIRegistrationResult> {
    try {
      logInfo(`Starting DOI registration for ${doi}`)

      // Validate required fields
      const validationError = this.validateMetadata(metadata)
      if (validationError) {
        return {
          success: false,
          error: validationError,
          timestamp: new Date()
        }
      }

      // Generate CrossRef XML
      const crossRefXML = this.generateCrossRefXML(doi, metadata)

      // Submit to CrossRef
      const response = await this.submitToCrossRef(crossRefXML)

      if (response.success) {
        logInfo(`DOI ${doi} successfully registered with CrossRef`, {
          batchId: response.batchId,
          submissionId: response.submissionId
        })

        return {
          success: true,
          doi,
          registrationId: response.submissionId,
          status: 'submitted',
          timestamp: new Date(),
          batchId: response.batchId
        }
      } else {
        logError(new Error(`CrossRef registration failed: ${response.error}`), {
          doi,
          response
        })

        return {
          success: false,
          error: response.error,
          timestamp: new Date()
        }
      }
    } catch (error: unknown) {
      logError(error, { doi, context: 'registerWithCrossRef' })
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date()
      }
    }
  }

  /**
   * Verify DOI exists and get metadata
   */
  static async verifyDOI(doi: string): Promise<DOIVerificationResult> {
    try {
      const response = await fetch(`${CROSSREF_API_URL}/works/${doi}`, {
        headers: {
          'User-Agent': 'AMHSJ/1.0 (https://amhsj.org; process.env.EMAIL_FROMprocess.env.EMAIL_FROMamhsj.org)',
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const work = data.message

        return {
          exists: true,
          metadata: {
            title: work.title?.[0] || '',
            authors: work.author?.map((author: unknown) => ({
              given: author.given || '',
              family: author.family || '',
              orcid: author.ORCID || undefined
            })) || [],
            journal: work['container-title']?.[0] || '',
            volume: work.volume || '',
            issue: work.issue || '',
            pages: work.page || '',
            publicationDate: work['published-print']?.['date-parts']?.[0] || work['published-online']?.['date-parts']?.[0],
            doi: work.DOI,
            url: work.URL,
            abstract: work.abstract,
            citationCount: work['is-referenced-by-count'] || 0
          },
          registeredAt: work.indexed?.['date-time'],
          citationCount: work['is-referenced-by-count'] || 0
        }
      } else if (response.status === 404) {
        return {
          exists: false,
          error: 'DOI not found in CrossRef database'
        }
      } else {
        return {
          exists: false,
          error: `CrossRef API error: ${response.statusText}`
        }
      }
    } catch (error: unknown) {
      logError(error, { doi, context: 'verifyDOI' })
      return {
        exists: false,
        error: `Verification failed: ${error.message}`
      }
    }
  }

  /**
   * Check DOI registration status
   */
  static async checkRegistrationStatus(batchId: string): Promise<{
    status: 'submitted' | 'completed' | 'failed' | 'processing'
    message?: string
    errors?: string[]
  }> {
    try {
      // This would typically involve checking with CrossRef's status API
      // For now, we'll return a placeholder implementation
      const response = await fetch(`${CROSSREF_DEPOSIT_URL}/status/${batchId}`, {
        headers: {
          'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${Buffer.from(`${process.env.CROSSREF_USERNAME}:${process.env.CROSSREF_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          status: data.status || 'processing',
          message: data.message,
          errors: data.errors
        }
      } else {
        return {
          status: 'failed',
          message: `Status check failed: ${response.statusText}`
        }
      }
    } catch (error: unknown) {
      logError(error, { batchId, context: 'checkRegistrationStatus' })
      return {
        status: 'failed',
        message: `Status check error: ${error.message}`
      }
    }
  }

  /**
   * Search for existing DOIs
   */
  static async searchDOIs(query: {
    title?: string
    author?: string
    journal?: string
    year?: number
    limit?: number
  }): Promise<{
    total: number
    results: Array<{
      doi: string
      title: string
      authors: string[]
      journal: string
      year: number
      citationCount: number
    }>
  }> {
    try {
      const searchParams = new URLSearchParams()
      
      if (query.title) searchParams.append('query.title', query.title)
      if (query.author) searchParams.append('query.author', query.author)
      if (query.journal) searchParams.append('query.container-title', query.journal)
      if (query.year) searchParams.append('filter', `from-pub-date:${query.year},until-pub-date:${query.year}`)
      
      searchParams.append('rows', (query.limit || 20).toString())

      const response = await fetch(`${CROSSREF_API_URL}/works?${searchParams.toString()}`, {
        headers: {
          'User-Agent': 'AMHSJ/1.0 (https://amhsj.org; process.env.EMAIL_FROMprocess.env.EMAIL_FROMamhsj.org)',
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        return {
          total: data.message['total-results'] || 0,
          results: data.message.items?.map((work: unknown) => ({
            doi: work.DOI,
            title: work.title?.[0] || '',
            authors: work.author?.map((author: unknown) => 
              `${author.given || ''} ${author.family || ''}`.trim()
            ) || [],
            journal: work['container-title']?.[0] || '',
            year: work['published-print']?.['date-parts']?.[0]?.[0] || 
                  work['published-online']?.['date-parts']?.[0]?.[0] || 0,
            citationCount: work['is-referenced-by-count'] || 0
          })) || []
        }
      } else {
        throw new AppError(`Search failed: ${response.statusText}`)
      }
    } catch (error: unknown) {
      logError(error, { query, context: 'searchDOIs' })
      return { total: 0, results: [] }
    }
  }

  // Private helper methods

  /**
   * Validate metadata before registration
   */
  private static validateMetadata(metadata: DOIMetadata): string | null {
    if (!metadata.title?.trim()) return 'Title is required'
    if (!metadata.authors?.length) return 'At least one author is required'
    if (!metadata.publicationDate) return 'Publication date is required'
    if (!metadata.volume) return 'Volume is required'
    if (!metadata.issue) return 'Issue is required'

    // Validate authors
    for (const author of metadata.authors) {
      if (!author.family?.trim()) return 'Author family name is required'
      if (!author.given?.trim()) return 'Author given name is required'
    }

    return null
  }

  /**
   * Generate CrossRef XML for registration
   */
  private static generateCrossRefXML(doi: string, metadata: DOIMetadata): string {
    const timestamp = Date.now()
    const batchId = `amhsj_${timestamp}`
    
    const authorsXML = metadata.authors.map((author, index) => `
      <person_name sequence="${index === 0 ? 'first' : 'additional'}" contributor_role="author">
        <given_name>${this.escapeXML(author.given)}</given_name>
        <surname>${this.escapeXML(author.family)}</surname>
        ${author.orcid ? `<ORCID authenticated="true">${author.orcid}</ORCID>` : ''}
        ${author.affiliation ? `<affiliation>${this.escapeXML(author.affiliation)}</affiliation>` : ''}
      </person_name>
    `).join('')

    const publicationDate = new Date(metadata.publicationDate)
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="5.3.1" xmlns="http://www.crossref.org/schema/5.3.1" 
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 
           http://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>${batchId}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>AMHSJ Editorial Team</depositor_name>
      <email_address>process.env.EMAIL_FROMamhsj.org</email_address>
    </depositor>
    <registrant>Advancing Modern Hardware & Software Journal</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata>
        <full_title>Advancing Modern Hardware & Software Journal</full_title>
        <abbrev_title>AMHSJ</abbrev_title>
        <issn media_type="electronic">2999-9999</issn>
      </journal_metadata>
      <journal_issue>
        <publication_date media_type="online">
          <month>${publicationDate.getMonth() + 1}</month>
          <day>${publicationDate.getDate()}</day>
          <year>${publicationDate.getFullYear()}</year>
        </publication_date>
        <journal_volume>
          <volume>${metadata.volume}</volume>
        </journal_volume>
        <issue>${metadata.issue}</issue>
      </journal_issue>
      <journal_article publication_type="full_text" language="${metadata.language || 'en'}">
        <titles>
          <title>${this.escapeXML(metadata.title)}</title>
        </titles>
        <contributors>
          ${authorsXML}
        </contributors>
        <abstract xmlns="http://www.ncbi.nlm.nih.gov/JATS1">
          <p>${this.escapeXML(metadata.abstract)}</p>
        </abstract>
        <publication_date media_type="online">
          <month>${publicationDate.getMonth() + 1}</month>
          <day>${publicationDate.getDate()}</day>
          <year>${publicationDate.getFullYear()}</year>
        </publication_date>
        ${metadata.pages ? `<pages><first_page>${metadata.pages.split('-')[0]}</first_page><last_page>${metadata.pages.split('-')[1] || metadata.pages.split('-')[0]}</last_page></pages>` : ''}
        <doi_data>
          <doi>${doi}</doi>
          <resource>${metadata.url || `${process.env.NEXT_PUBLIC_BASE_URL}/article/${metadata.articleId}`}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`
  }

  /**
   * Submit XML to CrossRef
   */
  private static async submitToCrossRef(xml: string): Promise<{
    success: boolean
    submissionId?: string
    batchId?: string
    error?: string
  }> {
    try {
      const formData = new FormData()
      formData.append('operation', 'doMDUpload')
      formData.append('login_id', process.env.CROSSREF_USERNAME!)
      formData.append('login_passwd', process.env.CROSSREF_PASSWORD!)
      formData.append('fname', new Blob([xml], { type: 'application/xml' }), 'crossref_deposit.xml')

      const response = await fetch(CROSSREF_DEPOSIT_URL, {
        method: 'POST',
        body: formData
      })

      const responseText = await response.text()

      if (response.ok && responseText.includes('SUCCESS')) {
        // Extract batch ID from response
        const batchIdMatch = responseText.match(/batch_id="([^"]+)"/)
        const submissionIdMatch = responseText.match(/submission_id="([^"]+)"/)

        return {
          success: true,
          batchId: batchIdMatch?.[1],
          submissionId: submissionIdMatch?.[1]
        }
      } else {
        return {
          success: false,
          error: responseText || 'Unknown CrossRef error'
        }
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

// Legacy compatibility
export const DOIGenerator = ProductionDOIService

export default ProductionDOIService
