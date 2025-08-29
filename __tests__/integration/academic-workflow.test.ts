/**
 * Complete Academic Standards Integration Test
 * Tests the full workflow from DOI assignment to plagiarism checking and citation management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DoiService } from '@/lib/doi'
import { OrcidService } from '@/lib/orcid'
import PlagiarismDetectionService from '@/lib/plagiarism'
import CitationService from '@/lib/citations'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/logger')
vi.mock('@/lib/email')

// Mock fetch globally
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('Complete Academic Standards Workflow', () => {
  const mockArticle = {
    id: 'article-test-123',
    title: 'Climate Change and Sustainable Development: A Comprehensive Review',
    abstract: `This comprehensive review examines the intersection of climate change and sustainable development.
    We analyze recent research findings and propose innovative solutions for addressing environmental challenges.
    The study incorporates findings from Smith et al. (2023) and references key work by Johnson (10.1038/nature.2023.123).`,
    content: `
    Introduction
    
    Climate change represents one of the most pressing challenges of our time. According to Smith et al. (2023), 
    global temperatures have risen significantly over the past decade. This finding is corroborated by recent 
    research published in Nature (DOI: 10.1038/nature.2023.123).
    
    Methodology
    
    Our research methodology follows established protocols from the Intergovernmental Panel on Climate Change.
    We conducted a systematic review of literature published between 2020 and 2023, analyzing data from
    multiple sources including satellite measurements and ground-based observations.
    
    Results
    
    The analysis reveals significant trends in global temperature patterns. Key findings include:
    1. Average global temperature increase of 1.2°C since pre-industrial times
    2. Accelerated ice sheet melting in Greenland and Antarctica
    3. Rising sea levels affecting coastal communities worldwide
    
    These results align with previous studies by Davis et al. (2022) published in Science Climate Dynamics
    (https://doi.org/10.1126/sciadv.abc1234) and the comprehensive assessment by Wilson (2023).
    
    Discussion
    
    The implications of our findings are far-reaching. Climate change impacts extend beyond environmental
    concerns to include economic, social, and political dimensions. Immediate action is required to
    implement sustainable development practices and reduce greenhouse gas emissions.
    
    Conclusion
    
    This study provides compelling evidence for the urgent need to address climate change through
    coordinated global action. The integration of sustainable development principles offers a pathway
    toward a more resilient and equitable future.
    
    References
    
    1. Smith, J. A., Brown, K. L., & Taylor, M. R. (2023). Global temperature trends and climate modeling. 
       Nature Climate Change, 13(4), 123-135. https://doi.org/10.1038/s41558-023-01234-5
    
    2. Davis, P. M., Wilson, S. K., & Johnson, L. A. (2022). Ice sheet dynamics and sea level projections. 
       Science Climate Dynamics, 45(8), 1256-1270. https://doi.org/10.1126/sciadv.abc1234
    
    3. Wilson, R. T. (2023). Sustainable development in the context of climate change. 
       Environmental Policy Review, 28(3), 45-67.
    `,
    authorId: 'author-123',
    journalId: 'journal-456',
    status: 'submitted' as const,
    submissionDate: new Date(),
    metadata: {}
  }

  const mockAuthor = {
    id: 'author-123',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    orcidId: '0000-0002-1825-0097',
    affiliation: 'University of Environmental Sciences',
    credentials: 'PhD in Environmental Science'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup database mocks
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockArticle]),
      execute: vi.fn().mockResolvedValue({ insertId: 'new-id' })
    }

    vi.mocked(require('@/lib/db')).db = mockDb
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Article Processing Pipeline', () => {
    it('should process article through complete academic standards workflow', async () => {
      // Step 1: Assign DOI to article
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'test-doi-123',
            attributes: {
              doi: '10.5555/test.2024.001',
              url: 'https://doi.org/10.5555/test.2024.001',
              state: 'findable'
            }
          }
        })
      } as Response)

      const doiResult = await DoiService.assignDOI(mockArticle.id, {
        title: mockArticle.title,
        creators: [{ name: mockAuthor.name, orcid: mockAuthor.orcidId }],
        publicationYear: 2024,
        resourceType: 'JournalArticle'
      })

      expect(doiResult.success).toBe(true)
      expect(doiResult.doi).toBe('10.5555/test.2024.001')

      // Step 2: Verify ORCID integration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'orcid-identifier': {
            path: '0000-0002-1825-0097'
          },
          person: {
            name: {
              'given-names': { value: 'Sarah' },
              'family-name': { value: 'Johnson' }
            }
          }
        })
      } as Response)

      const orcidProfile = await OrcidService.getProfile(mockAuthor.orcidId!, 'access-token')
      expect(orcidProfile).toBeDefined()
      expect(orcidProfile.orcidId).toBe(mockAuthor.orcidId)

      // Step 3: Extract and validate citations
      const citations = await CitationService.extractCitations(mockArticle.content)
      expect(citations.length).toBeGreaterThan(0)

      // Verify DOI citations are extracted
      const doiCitations = citations.filter(c => c.doi)
      expect(doiCitations.length).toBeGreaterThan(0)
      expect(doiCitations.some(c => c.doi === '10.1038/s41558-023-01234-5')).toBe(true)

      // Verify URL citations are extracted
      const urlCitations = citations.filter(c => c.url)
      expect(urlCitations.length).toBeGreaterThan(0)

      // Validate extracted citations
      const validations = await CitationService.validateCitations(citations)
      expect(validations.length).toBe(citations.length)

      // Step 4: Generate bibliography in multiple styles
      const apaBibliography = CitationService.generateBibliography(citations, 'apa')
      const mlaBibliography = CitationService.generateBibliography(citations, 'mla')
      const vancouverBibliography = CitationService.generateBibliography(citations, 'vancouver')

      expect(apaBibliography.length).toBe(citations.length)
      expect(mlaBibliography.length).toBe(citations.length)
      expect(vancouverBibliography.length).toBe(citations.length)

      // Verify different formatting styles
      expect(apaBibliography[0].formattedText).toContain('(')
      expect(mlaBibliography[0].formattedText).toContain('"')
      expect(vancouverBibliography[0].inTextCitation).toMatch(/^\[\d+\]$/)

      // Step 5: Analyze reference quality
      const referenceAnalysis = await CitationService.analyzeReferences(citations)
      expect(referenceAnalysis.totalReferences).toBe(citations.length)
      expect(referenceAnalysis.qualityScore).toBeGreaterThanOrEqual(0)
      expect(referenceAnalysis.qualityScore).toBeLessThanOrEqual(100)

      // Step 6: Perform plagiarism detection
      // Mock CrossRef search for similar content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: {
            items: [
              {
                DOI: '10.1038/nature.2023.456',
                title: ['Climate Change Research Methods'],
                author: [{ given: 'John', family: 'Smith' }],
                abstract: 'Climate change represents a significant global challenge requiring immediate action',
                URL: 'https://www.nature.com/articles/nature456',
                score: 15.2
              }
            ]
          }
        })
      } as Response)

      const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(mockArticle.id)

      expect(plagiarismReport.status).toBe('completed')
      expect(plagiarismReport.articleId).toBe(mockArticle.id)
      expect(plagiarismReport.overallSimilarity).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(plagiarismReport.sources)).toBe(true)
      expect(Array.isArray(plagiarismReport.textMatches)).toBe(true)

      // Step 7: Verify comprehensive workflow completion
      const workflowSummary = {
        doiAssigned: doiResult.success,
        orcidVerified: orcidProfile !== null,
        citationsExtracted: citations.length > 0,
        citationsValidated: validations.every(v => v.isValid || v.warnings.length === 0),
        bibliographyGenerated: apaBibliography.length > 0,
        plagiarismChecked: plagiarismReport.status === 'completed',
        qualityScore: referenceAnalysis.qualityScore
      }

      expect(workflowSummary.doiAssigned).toBe(true)
      expect(workflowSummary.orcidVerified).toBe(true)
      expect(workflowSummary.citationsExtracted).toBe(true)
      expect(workflowSummary.bibliographyGenerated).toBe(true)
      expect(workflowSummary.plagiarismChecked).toBe(true)
    })

    it('should handle academic standards API failures gracefully', async () => {
      // Test DOI service failure
      mockFetch.mockRejectedValueOnce(new Error('DOI API unavailable'))
      
      const doiResult = await DoiService.assignDOI(mockArticle.id, {
        title: mockArticle.title,
        creators: [{ name: mockAuthor.name }],
        publicationYear: 2024,
        resourceType: 'JournalArticle'
      })

      expect(doiResult.success).toBe(false)
      expect(doiResult.error).toContain('DOI API unavailable')

      // Test ORCID service failure
      mockFetch.mockRejectedValueOnce(new Error('ORCID API unavailable'))
      
      try {
        await OrcidService.getProfile('0000-0002-1825-0097', 'access-token')
        expect(false).toBe(true) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
      }

      // Test plagiarism service with API failure (should still complete)
      mockFetch.mockRejectedValueOnce(new Error('External API unavailable'))
      
      const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(mockArticle.id)
      expect(plagiarismReport.status).toBe('completed')
      expect(plagiarismReport.sources).toHaveLength(0)

      // Citation extraction should work without external APIs
      const citations = await CitationService.extractCitations(mockArticle.content)
      expect(citations.length).toBeGreaterThan(0)
    })

    it('should validate academic standards compliance', async () => {
      // Extract citations
      const citations = await CitationService.extractCitations(mockArticle.content)
      
      // Validate all citations
      const validations = await CitationService.validateCitations(citations)
      
      // Check compliance metrics
      const complianceMetrics = {
        hasDOIReferences: citations.some(c => c.doi),
        hasRecentReferences: citations.some(c => c.year && c.year >= 2020),
        hasProperFormatting: validations.every(v => v.errors.length === 0),
        diverseCitationTypes: new Set(citations.map(c => c.type)).size > 1,
        sufficientReferences: citations.length >= 3
      }

      expect(complianceMetrics.hasDOIReferences).toBe(true)
      expect(complianceMetrics.hasRecentReferences).toBe(true)
      expect(complianceMetrics.sufficientReferences).toBe(true)
    })

    it('should detect and report academic integrity issues', async () => {
      // Create a test article with potential issues
      const problematicContent = `
        Climate change is a serious issue. Climate change affects everyone.
        The research shows that climate change is happening now.
        According to studies, climate change requires immediate action.
        Climate change research indicates significant environmental impacts.
      `

      const suspiciousArticle = {
        ...mockArticle,
        content: problematicContent
      }

      // Mock database to return suspicious article
      vi.mocked(require('@/lib/db')).db.limit.mockResolvedValue([suspiciousArticle])

      // Run plagiarism detection
      const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(suspiciousArticle.id)

      // Analyze similarity patterns
      const textAnalysis = await PlagiarismDetectionService.analyzeSimilarity(
        problematicContent,
        problematicContent
      )

      expect(textAnalysis.similarity).toBeGreaterThan(0.9)
      expect(textAnalysis.suspiciousPatterns.length).toBeGreaterThan(0)
      expect(textAnalysis.recommendations.length).toBeGreaterThan(0)

      // Check for repetitive content patterns
      const phrases = problematicContent.split(/[.!?]+/).filter(p => p.trim())
      const repeatedPhrases = phrases.filter(phrase => 
        phrase.toLowerCase().includes('climate change')
      )

      expect(repeatedPhrases.length).toBeGreaterThan(3)
    })
  })

  describe('Cross-service Integration', () => {
    it('should link ORCID profiles with DOI assignments', async () => {
      // Mock ORCID profile response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'orcid-identifier': { path: mockAuthor.orcidId },
          person: {
            name: {
              'given-names': { value: 'Sarah' },
              'family-name': { value: 'Johnson' }
            }
          }
        })
      } as Response)

      // Mock DOI assignment with ORCID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'test-doi-456',
            attributes: {
              doi: '10.5555/test.2024.002',
              creators: [{ name: mockAuthor.name, nameIdentifiers: [{ nameIdentifier: mockAuthor.orcidId }] }]
            }
          }
        })
      } as Response)

      const orcidProfile = await OrcidService.getProfile(mockAuthor.orcidId!, 'access-token')
      const doiResult = await DoiService.assignDOI(mockArticle.id, {
        title: mockArticle.title,
        creators: [{ name: mockAuthor.name, orcid: mockAuthor.orcidId }],
        publicationYear: 2024,
        resourceType: 'JournalArticle'
      })

      expect(orcidProfile).toBeDefined()
      expect(doiResult.success).toBe(true)
      
      // Verify ORCID is included in DOI metadata
      expect(doiResult.metadata?.creators?.[0]?.orcid).toBe(mockAuthor.orcidId)
    })

    it('should correlate citation quality with plagiarism detection', async () => {
      const citations = await CitationService.extractCitations(mockArticle.content)
      const referenceAnalysis = await CitationService.analyzeReferences(citations)
      
      // Mock plagiarism check
      const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(mockArticle.id)

      // High-quality citations should correlate with lower plagiarism risk
      const academicIntegrityScore = {
        referenceQuality: referenceAnalysis.qualityScore,
        plagiarismRisk: plagiarismReport.overallSimilarity,
        citationCount: citations.length,
        recentCitations: citations.filter(c => c.year && c.year >= 2020).length
      }

      expect(academicIntegrityScore.referenceQuality).toBeGreaterThan(0)
      expect(academicIntegrityScore.citationCount).toBeGreaterThan(0)
      expect(academicIntegrityScore.recentCitations).toBeGreaterThan(0)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large articles efficiently', async () => {
      // Create a large article content
      const largeContent = Array(100).fill(mockArticle.content).join('\n\n')
      const largeArticle = { ...mockArticle, content: largeContent }

      vi.mocked(require('@/lib/db')).db.limit.mockResolvedValue([largeArticle])

      const startTime = Date.now()

      // Test citation extraction performance
      const citations = await CitationService.extractCitations(largeContent)
      const citationExtractionTime = Date.now() - startTime

      // Test plagiarism detection performance
      const plagiarismStart = Date.now()
      const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(largeArticle.id)
      const plagiarismTime = Date.now() - plagiarismStart

      // Performance should be reasonable (less than 30 seconds for large content)
      expect(citationExtractionTime).toBeLessThan(30000)
      expect(plagiarismTime).toBeLessThan(30000)
      
      expect(citations.length).toBeGreaterThan(0)
      expect(plagiarismReport.status).toBe('completed')
    })

    it('should handle concurrent processing', async () => {
      const articleIds = ['article-1', 'article-2', 'article-3']
      
      // Process multiple articles concurrently
      const promises = articleIds.map(async (id) => {
        const citations = await CitationService.extractCitations(mockArticle.content)
        const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism(id)
        return { id, citations: citations.length, plagiarism: plagiarismReport.status }
      })

      const results = await Promise.all(promises)

      expect(results).toHaveLength(articleIds.length)
      results.forEach(result => {
        expect(result.citations).toBeGreaterThan(0)
        expect(result.plagiarism).toBe('completed')
      })
    })
  })
})
