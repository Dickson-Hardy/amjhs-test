export class DOIGenerator {
  private static readonly DOI_PREFIX = process.env.DOI_PREFIX || "10.1234"
  private static readonly JOURNAL_CODE = "amhsj"
  private static readonly CROSSREF_API_URL = "https://api.crossref.org/works"
  private static readonly CROSSREF_DEPOSIT_URL = "https://api.crossref.org/deposits"

  static generateDOI(articleData: {
    year: number
    volume: string
    issue: string
    articleNumber: number
  }): string {
    const { year, volume, issue, articleNumber } = articleData
    return `${this.DOI_PREFIX}/${this.JOURNAL_CODE}.${year}.${volume}.${issue}.${articleNumber.toString().padStart(3, "0")}`
  }

  static async registerWithCrossRef(doi: string, metadata: DOIMetadata): Promise<boolean> {
    try {
      const crossRefData = this.formatCrossRefMetadata(doi, metadata)
      
      const response = await fetch(this.CROSSREF_DEPOSIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `process.env.AUTH_TOKEN_PREFIX + ' '${process.env.CROSSREF_API_KEY}`,
          "User-Agent": "AMHSJ/1.0 (process.env.EMAIL_FROMprocess.env.EMAIL_FROMamhsj.org)"
        },
        body: JSON.stringify(crossRefData)
      })

      if (response.ok) {
        const result = await response.json()
        logger.info(`DOI ${doi} registered successfully with CrossRef:`, result)
        return true
      } else {
        const error = await response.text()
        logger.error(`CrossRef registration failed: ${error}`)
        return false
      }
    } catch (error) {
      logger.error("DOI registration error:", error)
      return false
    }
  }

  private static formatCrossRefMetadata(doi: string, metadata: DOIMetadata) {
    return {
      "message-type": "work",
      "message-version": "1.0.0",
      "message": {
        "indexed": {
          "date-parts": [[new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]],
          "date-time": new Date().toISOString(),
          "timestamp": Date.now()
        },
        "DOI": doi,
        "type": "journal-article",
        "title": [metadata.title],
        "author": metadata.authors.map(author => ({
          "given": author.given,
          "family": author.family,
          "ORCID": author.orcid || undefined,
          "affiliation": [{ "name": author.affiliation }]
        })),
        "container-title": ["Advancing Modern Hardware & Software Journal"],
        "abstract": metadata.abstract,
        "published-online": {
          "date-parts": [[
            new Date(metadata.publicationDate).getFullYear(),
            new Date(metadata.publicationDate).getMonth() + 1,
            new Date(metadata.publicationDate).getDate()
          ]]
        },
        "volume": metadata.volume,
        "issue": metadata.issue,
        "page": metadata.pages,
        "subject": metadata.keywords,
        "URL": `${process.env.NEXT_PUBLIC_BASE_URL}/article/${metadata.articleId}`,
        "license": [
          {
            "URL": "https://creativecommons.org/licenses/by/4.0/",
            "start": {
              "date-parts": [[
                new Date(metadata.publicationDate).getFullYear(),
                new Date(metadata.publicationDate).getMonth() + 1,
                new Date(metadata.publicationDate).getDate()
              ]],
              "date-time": metadata.publicationDate,
              "timestamp": new Date(metadata.publicationDate).getTime()
            },
            "delay-in-days": 0,
            "content-version": "vor"
          }
        ]
      }
    }
  }

  static async verifyDOI(doi: string): Promise<DOIVerificationResult> {
    try {
      const response = await fetch(`${this.CROSSREF_API_URL}/${doi}`, {
        headers: {
          "User-Agent": "AMHSJ/1.0 (process.env.EMAIL_FROMprocess.env.EMAIL_FROMamhsj.org)"
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          exists: true,
          metadata: data.message,
          registeredAt: data.message.indexed['date-time']
        }
      } else {
        return {
          exists: false,
          error: `DOI not found: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        exists: false,
        error: `Verification failed: ${error}`
      }
    }
  }

  // Legacy method for backward compatibility
  static async registerDOI(doi: string, metadata: DOIMetadata): Promise<boolean> {
    return this.registerWithCrossRef(doi, metadata)
  }
}

export interface DOIMetadata {
  articleId: string
  title: string
  authors: Array<{
    given: string
    family: string
    orcid?: string
    affiliation: string
  }>
  abstract: string
  publicationDate: string
  volume: string
  issue: string
  pages: string
  keywords: string[]
  category: string
}

export interface DOIVerificationResult {
  exists: boolean
  metadata?: unknown
  registeredAt?: string
  error?: string
}

export interface DOIRegistrationResult {
  success: boolean
  doi?: string
  registrationId?: string
  error?: string
  timestamp: Date
}
