/**
 * Academic Standards Integration Tests
 * Tests for plagiarism detection and citation management systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PlagiarismDetectionService from '@/lib/plagiarism'
import CitationService, { type Citation, type CitationStyle } from '@/lib/citations'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/logger')

// Mock fetch globally
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('PlagiarismDetectionService', () => {
  const mockArticleContent = `
    This is a sample article about climate change. Climate change represents one of the most pressing challenges of our time.
    The scientific consensus is clear that human activities are the primary driver of recent climate change.
    Rising global temperatures have led to more frequent extreme weather events.
  `

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock database responses
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        id: 'article-123',
        title: 'Climate Change Research',
        abstract: 'An article about climate change',
        content: mockArticleContent
      }])
    }

    vi.mocked(require('@/lib/db')).db = mockDb
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkPlagiarism', () => {
    it('should perform comprehensive plagiarism check', async () => {
      // Mock CrossRef API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: {
            items: [
              {
                DOI: '10.1000/example',
                title: ['Similar Climate Research'],
                author: [{ given: 'John', family: 'Doe' }],
                abstract: 'Climate change represents a significant challenge',
                URL: 'https://example.com/paper'
              }
            ]
          }
        })
      } as Response)

      const report = await PlagiarismDetectionService.checkPlagiarism('article-123')

      expect(report).toBeDefined()
      expect(report.articleId).toBe('article-123')
      expect(report.status).toBe('completed')
      expect(report.overallSimilarity).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(report.sources)).toBe(true)
      expect(Array.isArray(report.textMatches)).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const report = await PlagiarismDetectionService.checkPlagiarism('article-123')

      expect(report.status).toBe('completed')
      expect(report.sources).toHaveLength(0)
    })

    it('should detect internal database similarities', async () => {
      const report = await PlagiarismDetectionService.checkPlagiarism('article-123')

      expect(report).toBeDefined()
      expect(report.service).toBe('combined')
    })
  })

  describe('analyzeSimilarity', () => {
    it('should analyze text similarity correctly', async () => {
      const text1 = 'Climate change is a significant global challenge'
      const text2 = 'Climate change represents a major worldwide challenge'

      const analysis = await PlagiarismDetectionService.analyzeSimilarity(text1, text2)

      expect(analysis.similarity).toBeGreaterThan(0)
      expect(analysis.similarity).toBeLessThanOrEqual(1)
      expect(Array.isArray(analysis.matchedPhrases)).toBe(true)
      expect(Array.isArray(analysis.suspiciousPatterns)).toBe(true)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })

    it('should detect high similarity in identical texts', async () => {
      const text1 = 'This is exactly the same text'
      const text2 = 'This is exactly the same text'

      const analysis = await PlagiarismDetectionService.analyzeSimilarity(text1, text2)

      expect(analysis.similarity).toBeGreaterThan(0.9)
    })

    it('should detect low similarity in different texts', async () => {
      const text1 = 'Climate change affects global temperatures'
      const text2 = 'Artificial intelligence transforms modern computing'

      const analysis = await PlagiarismDetectionService.analyzeSimilarity(text1, text2)

      expect(analysis.similarity).toBeLessThan(0.3)
    })
  })
})

describe('CitationService', () => {
  const mockCitations: Citation[] = [
    {
      id: 'cite-1',
      type: 'journal',
      title: 'Climate Change Research',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      year: 2023,
      journal: 'Nature Climate Change',
      volume: '13',
      issue: '4',
      pages: '123-130',
      doi: '10.1038/s41558-023-01234-5'
    },
    {
      id: 'cite-2',
      type: 'book',
      title: 'Environmental Science Handbook',
      authors: [
        { firstName: 'Jane', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Johnson' }
      ],
      year: 2022,
      publisher: 'Academic Press',
      isbn: '978-0123456789'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractCitations', () => {
    it('should extract DOI citations from text', async () => {
      const text = `
        According to recent research (10.1038/s41558-023-01234-5), climate change is accelerating.
        Another study shows similar results (10.1126/science.abc1234).
      `

      const citations = await CitationService.extractCitations(text)

      expect(citations.length).toBeGreaterThan(0)
      expect(citations.some(c => c.doi === '10.1038/s41558-023-01234-5')).toBe(true)
      expect(citations.some(c => c.doi === '10.1126/science.abc1234')).toBe(true)
    })

    it('should extract URL citations from text', async () => {
      const text = `
        Visit https://example.com/research for more information.
        Also see http://journal.org/article for details.
      `

      const citations = await CitationService.extractCitations(text)

      expect(citations.length).toBeGreaterThan(0)
      expect(citations.some(c => c.url === 'https://example.com/research')).toBe(true)
      expect(citations.some(c => c.url === 'http://journal.org/article')).toBe(true)
    })

    it('should extract formatted citations from text', async () => {
      const text = `
        Smith, J. A. (2023). Climate research findings. Nature, 123(4), 56-78.
        [1] B. Johnson, "Environmental impacts," Science Journal, vol. 45, no. 2, pp. 12-20, 2022.
      `

      const citations = await CitationService.extractCitations(text)

      expect(citations.length).toBeGreaterThan(0)
      expect(citations.some(c => c.type === 'journal')).toBe(true)
    })

    it('should deduplicate extracted citations', async () => {
      const text = `
        10.1038/s41558-023-01234-5
        https://doi.org/10.1038/s41558-023-01234-5
        DOI: 10.1038/s41558-023-01234-5
      `

      const citations = await CitationService.extractCitations(text)

      // Should have only one unique citation despite multiple mentions
      const uniqueDOIs = new Set(citations.map(c => c.doi).filter(Boolean))
      expect(uniqueDOIs.size).toBeLessThanOrEqual(citations.length)
    })
  })

  describe('validateCitations', () => {
    it('should validate complete citations', async () => {
      const validations = await CitationService.validateCitations(mockCitations)

      expect(validations).toHaveLength(mockCitations.length)
      expect(validations[0].isValid).toBe(true)
      expect(validations[0].errors).toHaveLength(0)
    })

    it('should detect missing required fields', async () => {
      const incompleteCitation: Citation = {
        id: 'incomplete',
        type: 'journal',
        title: '',
        authors: []
      }

      const validations = await CitationService.validateCitations([incompleteCitation])

      expect(validations[0].isValid).toBe(false)
      expect(validations[0].errors).toContain('Title is missing or unknown')
      expect(validations[0].errors).toContain('No authors specified')
    })

    it('should validate DOI format', async () => {
      const invalidDOICitation: Citation = {
        id: 'invalid-doi',
        type: 'journal',
        title: 'Test Article',
        authors: [{ firstName: 'Test', lastName: 'Author' }],
        doi: 'invalid-doi-format'
      }

      const validations = await CitationService.validateCitations([invalidDOICitation])

      expect(validations[0].errors).toContain('Invalid DOI format')
    })

    it('should provide warnings for missing optional fields', async () => {
      const minimalCitation: Citation = {
        id: 'minimal',
        type: 'journal',
        title: 'Test Article',
        authors: [{ firstName: 'Test', lastName: 'Author' }]
      }

      const validations = await CitationService.validateCitations([minimalCitation])

      expect(validations[0].warnings).toContain('Publication year is missing')
      expect(validations[0].warnings).toContain('Journal name is missing')
    })
  })

  describe('formatCitation', () => {
    const testCitation = mockCitations[0]

    it('should format citation in APA style', () => {
      const formatted = CitationService.formatCitation(testCitation, 'apa')

      expect(formatted.style).toBe('apa')
      expect(formatted.formattedText).toContain('Doe, J.')
      expect(formatted.formattedText).toContain('(2023)')
      expect(formatted.formattedText).toContain('Climate Change Research')
      expect(formatted.formattedText).toContain('Nature Climate Change')
      expect(formatted.inTextCitation).toContain('(Doe, 2023)')
    })

    it('should format citation in MLA style', () => {
      const formatted = CitationService.formatCitation(testCitation, 'mla')

      expect(formatted.style).toBe('mla')
      expect(formatted.formattedText).toContain('Doe, John')
      expect(formatted.formattedText).toContain('"Climate Change Research"')
      expect(formatted.inTextCitation).toContain('(Doe)')
    })

    it('should format citation in Vancouver style', () => {
      const formatted = CitationService.formatCitation(testCitation, 'vancouver')

      expect(formatted.style).toBe('vancouver')
      expect(formatted.formattedText).toContain('Doe J')
      expect(formatted.inTextCitation).toBe('[1]')
    })

    it('should format citation in IEEE style', () => {
      const formatted = CitationService.formatCitation(testCitation, 'ieee')

      expect(formatted.style).toBe('ieee')
      expect(formatted.formattedText).toContain('J. Doe')
      expect(formatted.formattedText).toContain('"Climate Change Research"')
      expect(formatted.inTextCitation).toBe('[1]')
    })

    it('should handle multiple authors correctly', () => {
      const multiAuthorCitation = mockCitations[1]
      const formatted = CitationService.formatCitation(multiAuthorCitation, 'apa')

      expect(formatted.formattedText).toContain('Smith, J.')
      expect(formatted.formattedText).toContain('& Johnson, B.')
    })
  })

  describe('generateBibliography', () => {
    it('should generate sorted bibliography', () => {
      const bibliography = CitationService.generateBibliography(mockCitations, 'apa')

      expect(bibliography).toHaveLength(mockCitations.length)
      
      // Check alphabetical sorting by first author's last name
      const authorLastNames = bibliography.map(entry => 
        entry.citation.authors[0]?.lastName || ''
      )
      
      for (let i = 1; i < authorLastNames.length; i++) {
        expect(authorLastNames[i].localeCompare(authorLastNames[i - 1])).toBeGreaterThanOrEqual(0)
      }
    })

    it('should maintain citation details in bibliography entries', () => {
      const bibliography = CitationService.generateBibliography(mockCitations, 'apa')

      bibliography.forEach((entry, index) => {
        expect(entry.citation).toEqual(mockCitations[index])
        expect(entry.formattedText).toBeTruthy()
        expect(entry.inTextCitation).toBeTruthy()
        expect(entry.style).toBe('apa')
      })
    })
  })

  describe('analyzeReferences', () => {
    it('should provide comprehensive reference analysis', async () => {
      // Mock validation responses
      vi.spyOn(CitationService, 'validateCitations').mockResolvedValueOnce([
        { isValid: true, errors: [], warnings: [], suggestions: [] },
        { isValid: false, errors: ['Missing DOI'], warnings: [], suggestions: [] }
      ])

      const analysis = await CitationService.analyzeReferences(mockCitations)

      expect(analysis.totalReferences).toBe(mockCitations.length)
      expect(analysis.validReferences).toBe(1)
      expect(analysis.invalidReferences).toBe(1)
      expect(analysis.qualityScore).toBeGreaterThan(0)
      expect(analysis.qualityScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })

    it('should detect duplicate citations', async () => {
      const duplicateCitations = [
        mockCitations[0],
        { ...mockCitations[0], id: 'duplicate' }
      ]

      vi.spyOn(CitationService, 'validateCitations').mockResolvedValueOnce([
        { isValid: true, errors: [], warnings: [], suggestions: [] },
        { isValid: true, errors: [], warnings: [], suggestions: [] }
      ])

      const analysis = await CitationService.analyzeReferences(duplicateCitations)

      expect(analysis.duplicateReferences).toBeGreaterThan(0)
      expect(analysis.recommendations).toContain(expect.stringContaining('duplicate'))
    })

    it('should calculate quality score correctly', async () => {
      const highQualityCitations = mockCitations.map(citation => ({
        ...citation,
        doi: '10.1000/example',
        year: 2023
      }))

      vi.spyOn(CitationService, 'validateCitations').mockResolvedValueOnce(
        highQualityCitations.map(() => ({ 
          isValid: true, 
          errors: [], 
          warnings: [], 
          suggestions: [] 
        }))
      )

      const analysis = await CitationService.analyzeReferences(highQualityCitations)

      expect(analysis.qualityScore).toBeGreaterThan(80)
    })
  })

  describe('searchCitationMetadata', () => {
    it('should search by DOI', async () => {
      const doi = '10.1038/s41558-023-01234-5'
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: {
            title: ['Climate Change Research'],
            author: [{ given: 'John', family: 'Doe' }],
            published: { 'date-parts': [[2023]] },
            'container-title': ['Nature Climate Change'],
            DOI: doi
          }
        })
      } as Response)

      const results = await CitationService.searchCitationMetadata(doi)

      expect(results).toHaveLength(1)
      expect(results[0].doi).toBe(doi)
      expect(results[0].title).toBe('Climate Change Research')
    })

    it('should search CrossRef by title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: {
            items: [
              {
                title: ['Environmental Research'],
                author: [{ given: 'Jane', family: 'Smith' }],
                published: { 'date-parts': [[2022]] },
                'container-title': ['Environmental Journal'],
                DOI: '10.1000/env123'
              }
            ]
          }
        })
      } as Response)

      const results = await CitationService.searchCitationMetadata('Environmental Research')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toBe('Environmental Research')
    })

    it('should handle search API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const results = await CitationService.searchCitationMetadata('test query')

      expect(results).toHaveLength(0)
    })
  })

  describe('Citation Style Formatting', () => {
    const testCases: { style: CitationStyle; expectedPatterns: string[] }[] = [
      {
        style: 'apa',
        expectedPatterns: ['Doe, J.', '(2023)', 'https://doi.org/']
      },
      {
        style: 'mla',
        expectedPatterns: ['Doe, John', '"Climate Change Research"', 'vol.']
      },
      {
        style: 'chicago',
        expectedPatterns: ['Doe, J.', '(2023)']
      },
      {
        style: 'harvard',
        expectedPatterns: ['Doe, J.', '(2023)']
      },
      {
        style: 'vancouver',
        expectedPatterns: ['Doe J', ';13(4)']
      },
      {
        style: 'ieee',
        expectedPatterns: ['J. Doe', '"Climate Change Research"', 'vol. 13']
      }
    ]

    testCases.forEach(({ style, expectedPatterns }) => {
      it(`should format ${style.toUpperCase()} style correctly`, () => {
        const formatted = CitationService.formatCitation(mockCitations[0], style)

        expectedPatterns.forEach(pattern => {
          expect(formatted.formattedText).toContain(pattern)
        })
      })
    })
  })
})

describe('Integration Tests', () => {
  it('should work together for complete academic workflow', async () => {
    const articleText = `
      According to recent research by Smith et al. (2023), climate change is accelerating.
      This finding is supported by other studies (10.1038/s41558-023-01234-5).
      The scientific consensus is clear that immediate action is required.
    `

    // 1. Extract citations
    const citations = await CitationService.extractCitations(articleText)
    expect(citations.length).toBeGreaterThan(0)

    // 2. Validate citations
    const validations = await CitationService.validateCitations(citations)
    expect(validations).toHaveLength(citations.length)

    // 3. Format bibliography
    const bibliography = CitationService.generateBibliography(citations, 'apa')
    expect(bibliography).toHaveLength(citations.length)

    // 4. Analyze references
    const analysis = await CitationService.analyzeReferences(citations)
    expect(analysis.totalReferences).toBe(citations.length)

    // 5. Check for plagiarism
    vi.mocked(require('@/lib/db')).db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        id: 'test-article',
        title: 'Test Article',
        content: articleText
      }])
    }

    const plagiarismReport = await PlagiarismDetectionService.checkPlagiarism('test-article')
    expect(plagiarismReport.status).toBe('completed')
  })
})
