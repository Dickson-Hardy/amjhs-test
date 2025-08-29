import { z } from "zod"
import { DatabaseService } from "./database"
import { logger } from "./logger"
import { CacheManager } from "./cache"

// ORCID Integration interfaces
export interface ORCIDProfile {
  orcidId: string
  givenName: string
  familyName: string
  creditName?: string
  biography?: string
  affiliations: Affiliation[]
  employments: Employment[]
  educations: Education[]
  works: ORCIDWork[]
  researcherUrls: ResearcherUrl[]
  emails: EmailAddress[]
  verified: boolean
  lastModified: string
}

export interface Affiliation {
  organization: string
  department?: string
  role?: string
  startDate?: string
  endDate?: string
  city?: string
  country?: string
}

export interface Employment {
  organization: string
  department?: string
  role: string
  startDate: string
  endDate?: string
  city?: string
  country?: string
}

export interface Education {
  organization: string
  degree?: string
  startDate?: string
  endDate?: string
  city?: string
  country?: string
}

export interface ORCIDWork {
  putCode: string
  title: string
  subtitle?: string
  journal?: string
  type: string
  publicationDate?: string
  doi?: string
  url?: string
  citation?: string
  contributors: string[]
}

export interface ResearcherUrl {
  name: string
  url: string
}

export interface EmailAddress {
  email: string
  verified: boolean
  primary: boolean
}

// CrossRef interfaces
export interface CrossRefWork {
  doi: string
  title: string[]
  subtitle?: string[]
  author: CrossRefAuthor[]
  publisher: string
  journalTitle?: string
  volume?: string
  issue?: string
  page?: string
  published: CrossRefDate
  type: string
  isReferencedByCount: number
  referencesCount: number
  subject: string[]
  url?: string
  abstract?: string
}

export interface CrossRefAuthor {
  given?: string
  family: string
  orcid?: string
  affiliation: Array<{
    name: string
  }>
}

export interface CrossRefDate {
  dateParts: number[][]
  dateTime?: string
  timestamp?: number
}

// DOI Registration interface
export interface DOIMetadata {
  doi: string
  url: string
  title: string
  authors: Array<{
    given: string
    family: string
    orcid?: string
    affiliation?: string
  }>
  publisher: string
  publicationYear: number
  resourceType: string
  version?: string
  description?: string
  subjects?: string[]
  contributors?: Array<{
    name: string
    type: string
  }>
  fundingReferences?: Array<{
    funderName: string
    awardNumber?: string
  }>
}

// PubMed interfaces
export interface PubMedArticle {
  pmid: string
  doi?: string
  title: string
  authors: PubMedAuthor[]
  journal: string
  volume?: string
  issue?: string
  pages?: string
  publicationDate: string
  abstract?: string
  keywords?: string[]
  meshTerms?: string[]
  publicationTypes: string[]
  citedByCount?: number
}

export interface PubMedAuthor {
  lastName: string
  foreName?: string
  initials?: string
  affiliation?: string
}

// Validation schemas
const ORCIDIdSchema = z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)
const DOISchema = z.string().regex(/^10\.\d+\/.+$/)

export class ExternalIntegrationsService {
  private static instance: ExternalIntegrationsService
  private orcidApiUrl = "https://pub.orcid.org/v3.0"
  private crossrefApiUrl = "https://api.crossref.org"
  private pubmedApiUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
  private dataciteApiUrl = "https://api.datacite.org"

  private constructor() {}

  public static getInstance(): ExternalIntegrationsService {
    if (!ExternalIntegrationsService.instance) {
      ExternalIntegrationsService.instance = new ExternalIntegrationsService()
    }
    return ExternalIntegrationsService.instance
  }

  /**
   * ORCID Integration Methods
   */

  /**
   * Fetch comprehensive ORCID profile
   */
  async fetchORCIDProfile(orcidId: string): Promise<ORCIDProfile | null> {
    try {
      const validatedId = ORCIDIdSchema.parse(orcidId)
      
      // Check cache first
      const cacheKey = `orcid_profile:${validatedId}`
      const cachedProfile = await CacheManager.get<ORCIDProfile>(cacheKey)
      if (cachedProfile) {
        return cachedProfile
      }

      logger.info("Fetching ORCID profile", { orcidId: validatedId })

      // Fetch profile data from ORCID API
      const [
        personData,
        worksData,
        employmentsData,
        educationsData
      ] = await Promise.all([
        this.fetchORCIDPerson(validatedId),
        this.fetchORCIDWorks(validatedId),
        this.fetchORCIDEmployments(validatedId),
        this.fetchORCIDEducations(validatedId)
      ])

      if (!personData) {
        logger.warn("ORCID profile not found", { orcidId: validatedId })
        return null
      }

      const profile: ORCIDProfile = {
        orcidId: validatedId,
        givenName: personData.name?.givenNames?.value || '',
        familyName: personData.name?.familyName?.value || '',
        creditName: personData.name?.creditName?.value,
        biography: personData.biography?.content,
        affiliations: this.extractAffiliations(employmentsData),
        employments: this.parseEmployments(employmentsData),
        educations: this.parseEducations(educationsData),
        works: this.parseORCIDWorks(worksData),
        researcherUrls: this.parseResearcherUrls(personData.researcherUrls),
        emails: this.parseEmails(personData.emails),
        verified: true,
        lastModified: new Date().toISOString()
      }

      // Cache for 24 hours
      await CacheManager.set(cacheKey, profile, 86400)

      logger.info("ORCID profile fetched successfully", { 
        orcidId: validatedId,
        worksCount: profile.works.length 
      })

      return profile
    } catch (error) {
      logger.error("Failed to fetch ORCID profile", { error, orcidId })
      return null
    }
  }

  /**
   * Authenticate user with ORCID OAuth
   */
  async authenticateWithORCID(
    authorizationCode: string,
    redirectUri: string
  ): Promise<{
    accessToken: string
    orcidId: string
    tokenType: string
    scope: string
  } | null> {
    try {
      const tokenResponse = await fetch(`${this.orcidApiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.ORCID_CLIENT_ID!,
          client_secret: process.env.ORCID_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: redirectUri
        })
      })

      if (!tokenResponse.ok) {
        throw new AuthenticationError(`ORCID authentication failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()

      logger.info("ORCID authentication successful", { 
        orcidId: tokenData.orcid,
        scope: tokenData.scope 
      })

      return {
        accessToken: tokenData.access_token,
        orcidId: tokenData.orcid,
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      }
    } catch (error) {
      logger.error("ORCID authentication failed", { error })
      return null
    }
  }

  /**
   * Sync user profile with ORCID data
   */
  async syncUserWithORCID(userId: string, orcidId: string): Promise<boolean> {
    try {
      const profile = await this.fetchORCIDProfile(orcidId)
      if (!profile) {
        return false
      }

      // Update user profile in database
      await DatabaseService.query(`
        UPDATE users 
        SET 
          orcid_id = ?,
          name = ?,
          orcid_profile = ?,
          profile_updated_at = NOW()
        WHERE id = ?
      `, [
        orcidId,
        `${profile.givenName} ${profile.familyName}`,
        JSON.stringify(profile),
        userId
      ])

      // Update or create author profile
      await this.updateAuthorProfile(userId, profile)

      logger.info("User synced with ORCID", { userId, orcidId })
      return true
    } catch (error) {
      logger.error("Failed to sync user with ORCID", { error, userId, orcidId })
      return false
    }
  }

  /**
   * CrossRef Integration Methods
   */

  /**
   * Search CrossRef for academic works
   */
  async searchCrossRef(
    query: string,
    filters?: {
      author?: string
      title?: string
      publisher?: string
      fromYear?: number
      toYear?: number
      type?: string
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    works: CrossRefWork[]
    total: number
    hasMore: boolean
  }> {
    try {
      const params = new URLSearchParams({
        query: query,
        rows: limit.toString(),
        offset: offset.toString()
      })

      // Add filters
      if (filters?.author) params.set('query.author', filters.author)
      if (filters?.title) params.set('query.title', filters.title)
      if (filters?.publisher) params.set('query.publisher', filters.publisher)
      if (filters?.fromYear) params.set('filter', `from-pub-date:${filters.fromYear}`)
      if (filters?.toYear) params.set('filter', `until-pub-date:${filters.toYear}`)
      if (filters?.type) params.set('filter', `type:${filters.type}`)

      const response = await fetch(`${this.crossrefApiUrl}/works?${params}`, {
        headers: {
          'User-Agent': 'Academic Journal Platform (process.env.EMAIL_FROMprocess.env.EMAIL_FROMjournal.com)'
        }
      })

      if (!response.ok) {
        throw new AppError(`CrossRef API error: ${response.status}`)
      }

      const data = await response.json()
      const works = data.message.items.map(this.parseCrossRefWork)

      return {
        works,
        total: data.message['total-results'],
        hasMore: offset + limit < data.message['total-results']
      }
    } catch (error) {
      logger.error("CrossRef search failed", { error, query })
      return { works: [], total: 0, hasMore: false }
    }
  }

  /**
   * Get work details by DOI from CrossRef
   */
  async getCrossRefWorkByDOI(doi: string): Promise<CrossRefWork | null> {
    try {
      const validatedDOI = DOISchema.parse(doi)
      
      const cacheKey = `crossref_work:${validatedDOI}`
      const cachedWork = await CacheManager.get<CrossRefWork>(cacheKey)
      if (cachedWork) {
        return cachedWork
      }

      const response = await fetch(`${this.crossrefApiUrl}/works/${validatedDOI}`, {
        headers: {
          'User-Agent': 'Academic Journal Platform (process.env.EMAIL_FROMprocess.env.EMAIL_FROMjournal.com)'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new AppError(`CrossRef API error: ${response.status}`)
      }

      const data = await response.json()
      const work = this.parseCrossRefWork(data.message)

      // Cache for 6 hours
      await CacheManager.set(cacheKey, work, 21600)

      return work
    } catch (error) {
      logger.error("Failed to fetch CrossRef work", { error, doi })
      return null
    }
  }

  /**
   * Check for similar works in CrossRef
   */
  async findSimilarWorks(
    title: string,
    authors: string[],
    threshold: number = 0.8
  ): Promise<CrossRefWork[]> {
    try {
      // Search by title first
      const titleResults = await this.searchCrossRef(title, {}, 10)
      
      // Filter by similarity and author match
      const similarWorks = titleResults.works.filter(work => {
        const titleSimilarity = this.calculateStringSimilarity(
          title.toLowerCase(),
          work.title[0]?.toLowerCase() || ''
        )
        
        const authorMatch = authors.some(author => 
          work.author.some(workAuthor => 
            this.calculateStringSimilarity(
              author.toLowerCase(),
              `${workAuthor.given || ''} ${workAuthor.family}`.toLowerCase()
            ) > 0.7
          )
        )

        return titleSimilarity > threshold && authorMatch
      })

      logger.info("Similar works search completed", { 
        title, 
        foundCount: similarWorks.length 
      })

      return similarWorks
    } catch (error) {
      logger.error("Failed to find similar works", { error, title })
      return []
    }
  }

  /**
   * DOI Registration Methods
   */

  /**
   * Register DOI with DataCite
   */
  async registerDOI(metadata: DOIMetadata): Promise<{
    success: boolean
    doi: string
    url?: string
    error?: string
  }> {
    try {
      const response = await fetch(`${this.dataciteApiUrl}/dois`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${Buffer.from(
            `${process.env.DATACITE_USERNAME}:${process.env.DATACITE_PASSWORD}`
          ).toString('base64')}`
        },
        body: JSON.stringify({
          data: {
            type: 'dois',
            attributes: {
              doi: metadata.doi,
              url: metadata.url,
              titles: [{ title: metadata.title }],
              creators: metadata.authors.map(author => ({
                name: `${author.family}, ${author.given}`,
                givenName: author.given,
                familyName: author.family,
                nameIdentifiers: author.orcid ? [{
                  nameIdentifier: author.orcid,
                  nameIdentifierScheme: 'ORCID'
                }] : undefined,
                affiliation: author.affiliation ? [{ name: author.affiliation }] : undefined
              })),
              publisher: metadata.publisher,
              publicationYear: metadata.publicationYear,
              resourceTypeGeneral: metadata.resourceType,
              descriptions: metadata.description ? [{
                description: metadata.description,
                descriptionType: 'Abstract'
              }] : undefined,
              subjects: metadata.subjects?.map(subject => ({ subject })),
              contributors: metadata.contributors?.map(contributor => ({
                name: contributor.name,
                contributorType: contributor.type
              })),
              fundingReferences: metadata.fundingReferences,
              event: 'publish'
            }
          }
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new AppError(`DOI registration failed: ${responseData.errors?.[0]?.detail || response.status}`)
      }

      logger.info("DOI registered successfully", { doi: metadata.doi })

      return {
        success: true,
        doi: metadata.doi,
        url: metadata.url
      }
    } catch (error) {
      logger.error("DOI registration failed", { error, doi: metadata.doi })
      return {
        success: false,
        doi: metadata.doi,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update DOI metadata
   */
  async updateDOIMetadata(doi: string, updates: Partial<DOIMetadata>): Promise<boolean> {
    try {
      const response = await fetch(`${this.dataciteApiUrl}/dois/${doi}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `process.env.AUTH_TOKEN_PREFIX + ' '${Buffer.from(
            `${process.env.DATACITE_USERNAME}:${process.env.DATACITE_PASSWORD}`
          ).toString('base64')}`
        },
        body: JSON.stringify({
          data: {
            type: 'dois',
            id: doi,
            attributes: this.buildDOIUpdateAttributes(updates)
          }
        })
      })

      if (!response.ok) {
        throw new AppError(`DOI update failed: ${response.status}`)
      }

      logger.info("DOI metadata updated", { doi })
      return true
    } catch (error) {
      logger.error("Failed to update DOI metadata", { error, doi })
      return false
    }
  }

  /**
   * PubMed Integration Methods
   */

  /**
   * Search PubMed for articles
   */
  async searchPubMed(
    query: string,
    filters?: {
      author?: string
      journal?: string
      fromYear?: number
      toYear?: number
      publicationType?: string
    },
    limit: number = 20
  ): Promise<PubMedArticle[]> {
    try {
      // Build search query
      let searchQuery = query
      if (filters?.author) searchQuery += `[Author] AND ${filters.author}`
      if (filters?.journal) searchQuery += `[Journal] AND ${filters.journal}`
      if (filters?.fromYear) searchQuery += ` AND ${filters.fromYear}[Publication Date]:${filters.toYear || new Date().getFullYear()}[Publication Date]`
      if (filters?.publicationType) searchQuery += `[Publication Type] AND ${filters.publicationType}`

      // Search for PMIDs
      const searchResponse = await fetch(
        `${this.pubmedApiUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${limit}&retmode=json`
      )

      if (!searchResponse.ok) {
        throw new AppError(`PubMed search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const pmids = searchData.esearchresult.idlist

      if (pmids.length === 0) {
        return []
      }

      // Fetch article details
      const detailsResponse = await fetch(
        `${this.pubmedApiUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
      )

      if (!detailsResponse.ok) {
        throw new AppError(`PubMed details fetch failed: ${detailsResponse.status}`)
      }

      const xmlData = await detailsResponse.text()
      const articles = this.parsePubMedXML(xmlData)

      logger.info("PubMed search completed", { query, foundCount: articles.length })

      return articles
    } catch (error) {
      logger.error("PubMed search failed", { error, query })
      return []
    }
  }

  /**
   * Get PubMed article by PMID
   */
  async getPubMedArticle(pmid: string): Promise<PubMedArticle | null> {
    try {
      const cacheKey = `pubmed_article:${pmid}`
      const cachedArticle = await CacheManager.get<PubMedArticle>(cacheKey)
      if (cachedArticle) {
        return cachedArticle
      }

      const response = await fetch(
        `${this.pubmedApiUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`
      )

      if (!response.ok) {
        throw new AppError(`PubMed fetch failed: ${response.status}`)
      }

      const xmlData = await response.text()
      const articles = this.parsePubMedXML(xmlData)
      const article = articles[0] || null

      if (article) {
        // Cache for 24 hours
        await CacheManager.set(cacheKey, article, 86400)
      }

      return article
    } catch (error) {
      logger.error("Failed to fetch PubMed article", { error, pmid })
      return null
    }
  }

  /**
   * Citation Network Analysis
   */

  /**
   * Analyze citation network for an article
   */
  async analyzeCitationNetwork(doi: string, depth: number = 2): Promise<{
    referencedBy: CrossRefWork[]
    references: CrossRefWork[]
    networkStats: {
      totalReferences: number
      totalCitations: number
      impactScore: number
      centrality: number
    }
  }> {
    try {
      const work = await this.getCrossRefWorkByDOI(doi)
      if (!work) {
        throw new NotFoundError("Work not found")
      }

      // Get works that reference this work
      const referencedByResults = await this.searchCrossRef(`doi:${doi}`, {}, 100)
      const referencedBy = referencedByResults.works

      // Get works referenced by this work (simulated - would need full text parsing)
      const references: CrossRefWork[] = []

      const impactScore = this.calculateImpactScore(work, referencedBy)
      const centrality = this.calculateNetworkCentrality(work, referencedBy, references)

      return {
        referencedBy,
        references,
        networkStats: {
          totalReferences: references.length,
          totalCitations: referencedBy.length,
          impactScore,
          centrality
        }
      }
    } catch (error) {
      logger.error("Citation network analysis failed", { error, doi })
      return {
        referencedBy: [],
        references: [],
        networkStats: {
          totalReferences: 0,
          totalCitations: 0,
          impactScore: 0,
          centrality: 0
        }
      }
    }
  }

  // Private helper methods

  private async fetchORCIDPerson(orcidId: string) {
    try {
      const response = await fetch(`${this.orcidApiUrl}/${orcidId}/person`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      logger.error("Failed to fetch ORCID person data", { error, orcidId })
      return null
    }
  }

  private async fetchORCIDWorks(orcidId: string) {
    try {
      const response = await fetch(`${this.orcidApiUrl}/${orcidId}/works`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      logger.error("Failed to fetch ORCID works", { error, orcidId })
      return null
    }
  }

  private async fetchORCIDEmployments(orcidId: string) {
    try {
      const response = await fetch(`${this.orcidApiUrl}/${orcidId}/employments`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      logger.error("Failed to fetch ORCID employments", { error, orcidId })
      return null
    }
  }

  private async fetchORCIDEducations(orcidId: string) {
    try {
      const response = await fetch(`${this.orcidApiUrl}/${orcidId}/educations`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      logger.error("Failed to fetch ORCID educations", { error, orcidId })
      return null
    }
  }

  private extractAffiliations(employmentsData: unknown): Affiliation[] {
    if (!employmentsData?.['affiliation-group']) {
      return []
    }

    return employmentsData['affiliation-group'].map((group: unknown) => {
      const summaries = Array.isArray(group.summaries) ? group.summaries : [group.summaries]
      const employment = summaries[0]?.['employment-summary']
      
      return {
        organization: employment?.organization?.name || '',
        department: employment?.['department-name'] || '',
        role: employment?.['role-title'] || '',
        startDate: employment?.['start-date']?.year?.value || '',
        endDate: employment?.['end-date']?.year?.value || '',
        city: employment?.organization?.address?.city || '',
        country: employment?.organization?.address?.country || ''
      }
    })
  }

  private parseEmployments(employmentsData: unknown): Employment[] {
    if (!employmentsData?.['affiliation-group']) {
      return []
    }

    return employmentsData['affiliation-group'].map((group: unknown) => {
      const summaries = Array.isArray(group.summaries) ? group.summaries : [group.summaries]
      const employment = summaries[0]?.['employment-summary']
      
      return {
        organization: employment?.organization?.name || '',
        department: employment?.['department-name'] || '',
        role: employment?.['role-title'] || '',
        startDate: employment?.['start-date']?.year?.value || '',
        endDate: employment?.['end-date']?.year?.value || '',
        city: employment?.organization?.address?.city || '',
        country: employment?.organization?.address?.country || ''
      }
    })
  }

  private parseEducations(educationsData: unknown): Education[] {
    if (!educationsData?.['affiliation-group']) {
      return []
    }

    return educationsData['affiliation-group'].map((group: unknown) => {
      const summaries = Array.isArray(group.summaries) ? group.summaries : [group.summaries]
      const education = summaries[0]?.['education-summary']
      
      return {
        organization: education?.organization?.name || '',
        degree: education?.['role-title'] || '',
        startDate: education?.['start-date']?.year?.value || '',
        endDate: education?.['end-date']?.year?.value || '',
        city: education?.organization?.address?.city || '',
        country: education?.organization?.address?.country || ''
      }
    })
  }

  private parseORCIDWorks(worksData: unknown): ORCIDWork[] {
    if (!worksData?.group) {
      return []
    }

    return worksData.group.map((group: unknown) => {
      const workSummary = group['work-summary'][0]
      
      return {
        putCode: workSummary['put-code'].toString(),
        title: workSummary.title?.title?.value || '',
        subtitle: workSummary.title?.subtitle?.value,
        journal: workSummary['journal-title']?.value,
        type: workSummary.type || '',
        publicationDate: workSummary['publication-date']?.year?.value || '',
        doi: this.extractDOIFromExternalIds(workSummary['external-ids']),
        url: workSummary.url?.value,
        contributors: [] // Would need detailed work fetch for contributors
      }
    })
  }

  private parseResearcherUrls(urlsData: unknown): ResearcherUrl[] {
    if (!urlsData?.['researcher-url']) {
      return []
    }

    return urlsData['researcher-url'].map((url: unknown) => ({
      name: url['url-name'] || '',
      url: url.url?.value || ''
    }))
  }

  private parseEmails(emailsData: unknown): EmailAddress[] {
    if (!emailsData?.email) {
      return []
    }

    return emailsData.email.map((email: unknown) => ({
      email: email.email || '',
      verified: email.verified || false,
      primary: email.primary || false
    }))
  }

  private extractDOIFromExternalIds(externalIds: unknown): string | undefined {
    if (!externalIds?.['external-id']) {
      return undefined
    }

    const doiId = externalIds['external-id'].find((id: unknown) => 
      id['external-id-type'] === 'doi'
    )

    return doiId?.['external-id-value']
  }

  private parseCrossRefWork(item: unknown): CrossRefWork {
    return {
      doi: item.DOI,
      title: item.title || [],
      subtitle: item.subtitle,
      author: item.author || [],
      publisher: item.publisher || '',
      journalTitle: item['container-title']?.[0],
      volume: item.volume,
      issue: item.issue,
      page: item.page,
      published: item.published || { dateParts: [[]] },
      type: item.type || '',
      isReferencedByCount: item['is-referenced-by-count'] || 0,
      referencesCount: item['references-count'] || 0,
      subject: item.subject || [],
      url: item.URL,
      abstract: item.abstract
    }
  }

  private parsePubMedXML(xmlData: string): PubMedArticle[] {
    // Simplified XML parsing - in production, use a proper XML parser
    const articles: PubMedArticle[] = []
    
    // This is a simplified implementation
    // In production, you would use a proper XML parser like xml2js
    
    return articles
  }

  private async updateAuthorProfile(userId: string, orcidProfile: ORCIDProfile): Promise<void> {
    await DatabaseService.query(`
      INSERT INTO author_profiles (
        user_id, 
        orcid_id, 
        affiliations, 
        research_interests, 
        h_index,
        total_citations,
        publication_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        affiliations = VALUES(affiliations),
        research_interests = VALUES(research_interests),
        updated_at = NOW()
    `, [
      userId,
      orcidProfile.orcidId,
      JSON.stringify(orcidProfile.affiliations),
      JSON.stringify(orcidProfile.works.map(w => w.title).slice(0, 10)),
      0, // Would calculate from works data
      0, // Would calculate from citation data
      orcidProfile.works.length
    ])
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private buildDOIUpdateAttributes(updates: Partial<DOIMetadata>): unknown {
    const attributes: unknown = {}
    
    if (updates.title) {
      attributes.titles = [{ title: updates.title }]
    }
    
    if (updates.authors) {
      attributes.creators = updates.authors.map(author => ({
        name: `${author.family}, ${author.given}`,
        givenName: author.given,
        familyName: author.family
      }))
    }
    
    if (updates.description) {
      attributes.descriptions = [{
        description: updates.description,
        descriptionType: 'Abstract'
      }]
    }
    
    return attributes
  }

  private calculateImpactScore(work: CrossRefWork, citations: CrossRefWork[]): number {
    const citationCount = citations.length
    const ageInYears = new Date().getFullYear() - (work.published.dateParts[0]?.[0] || new Date().getFullYear())
    const adjustedCitations = ageInYears > 0 ? citationCount / ageInYears : citationCount
    
    return Math.min(adjustedCitations * 10, 100) // Scale to 0-100
  }

  private calculateNetworkCentrality(
    work: CrossRefWork, 
    citations: CrossRefWork[], 
    references: CrossRefWork[]
  ): number {
    // Simplified centrality calculation
    const inDegree = citations.length
    const outDegree = references.length
    const totalConnections = inDegree + outDegree
    
    return Math.min(totalConnections / 10, 1) // Scale to 0-1
  }
}

export const externalIntegrationsService = ExternalIntegrationsService.getInstance()
