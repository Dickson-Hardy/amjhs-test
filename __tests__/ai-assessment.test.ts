/**
 * AI Assessment Service Tests
 * Comprehensive test suite for AI-powered manuscript assessment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AIAssessmentService, type ManuscriptContent } from '@/lib/ai-assessment'
import { sql } from '@vercel/postgres'

// Mock dependencies
vi.mock('@vercel/postgres')
vi.mock('@/lib/logger')

const mockSql = vi.mocked(sql)

describe('AIAssessmentService', () => {
  const mockManuscriptContent: ManuscriptContent = {
    title: 'Novel Machine Learning Approaches for Climate Prediction',
    abstract: 'This paper presents innovative machine learning algorithms for accurate climate prediction models.',
    content: `
      Introduction
      Climate prediction is a critical challenge in modern science. This paper introduces novel machine learning approaches that significantly improve prediction accuracy.
      
      Methodology
      We developed a hybrid neural network architecture combining convolutional and recurrent layers. The dataset includes 50 years of meteorological data from 1000 weather stations worldwide.
      
      Results
      Our model achieved 95% accuracy in temperature prediction and 87% accuracy in precipitation forecasting, outperforming existing methods by 15%.
      
      Conclusion
      The proposed methodology demonstrates significant improvements in climate prediction accuracy. Future work will focus on real-time implementation and integration with existing weather forecasting systems.
      
      Limitations
      The study is limited by data availability and computational constraints. Further validation with larger datasets is recommended.
    `,
    keywords: ['machine learning', 'climate prediction', 'neural networks', 'weather forecasting'],
    references: [
      {
        id: '1',
        title: 'Deep Learning for Climate Science',
        authors: 'Smith, J. et al.',
        journal: 'Nature Climate Change',
        year: 2023,
        doi: '10.1038/s41558-023-01234-5'
      },
      {
        id: '2',
        title: 'Machine Learning in Meteorology',
        authors: 'Johnson, A. and Brown, B.',
        journal: 'Journal of Applied Meteorology',
        year: 2022,
        doi: '10.1175/JAMC-D-22-0123.1'
      }
    ],
    authors: [
      {
        id: 'author1',
        name: 'Dr. Jane Doe',
        affiliation: 'University of Climate Science',
        orcidId: '0000-0000-0000-0001'
      }
    ],
    fieldOfStudy: 'Climate Science'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful database operations
    mockSql.mockResolvedValue({
      rows: [{
        id: 'assessment-123',
        manuscript_id: 'manuscript-456',
        quality_score: 85,
        similarity_score: 95,
        impact_prediction: 78,
        writing_quality_score: 82,
        reference_score: 88,
        recommended_action: 'minor_revision',
        assessment_details: {},
        created_at: new Date(),
        updated_at: new Date()
      }],
      rowCount: 1
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('assessManuscript', () => {
    it('should successfully assess a manuscript and return comprehensive analysis', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      expect(result).toBeDefined()
      expect(result.manuscriptId).toBe('manuscript-456')
      expect(result.qualityScore).toBeGreaterThan(0)
      expect(result.similarityScore).toBeGreaterThan(0)
      expect(result.impactPrediction).toBeGreaterThan(0)
      expect(result.writingQualityScore).toBeGreaterThan(0)
      expect(result.referenceScore).toBeGreaterThan(0)
      expect(['accept', 'minor_revision', 'major_revision', 'reject']).toContain(result.recommendedAction)
      
      // Verify assessment details structure
      expect(result.assessmentDetails).toBeDefined()
      expect(result.assessmentDetails.qualityMetrics).toBeDefined()
      expect(result.assessmentDetails.similarityAnalysis).toBeDefined()
      expect(result.assessmentDetails.impactAnalysis).toBeDefined()
      expect(result.assessmentDetails.writingQuality).toBeDefined()
      expect(result.assessmentDetails.referenceAnalysis).toBeDefined()
      expect(result.assessmentDetails.recommendations).toBeInstanceOf(Array)
      expect(result.assessmentDetails.improvementSuggestions).toBeInstanceOf(Array)
    })

    it('should handle manuscripts with minimal content', async () => {
      const minimalContent: ManuscriptContent = {
        title: 'Short Title',
        abstract: 'Brief abstract.',
        content: 'Minimal content.',
        keywords: [],
        references: [],
        authors: [],
        fieldOfStudy: 'General'
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-789',
        minimalContent
      )

      expect(result).toBeDefined()
      expect(result.qualityScore).toBeLessThan(50) // Should score lower for minimal content
    })

    it('should detect potential plagiarism risks', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      expect(result.assessmentDetails.similarityAnalysis.plagiarismRisk).toMatch(/low|medium|high/)
      expect(result.assessmentDetails.similarityAnalysis.duplicateContent).toBeGreaterThanOrEqual(0)
      expect(result.assessmentDetails.similarityAnalysis.duplicateContent).toBeLessThanOrEqual(100)
    })

    it('should provide actionable recommendations', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      expect(result.assessmentDetails.recommendations).toBeInstanceOf(Array)
      expect(result.assessmentDetails.improvementSuggestions).toBeInstanceOf(Array)
      
      // Recommendations should be strings
      result.assessmentDetails.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string')
        expect(rec.length).toBeGreaterThan(0)
      })
    })

    it('should assess writing quality metrics', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      const writingQuality = result.assessmentDetails.writingQuality
      expect(writingQuality.grammarScore).toBeGreaterThanOrEqual(0)
      expect(writingQuality.grammarScore).toBeLessThanOrEqual(100)
      expect(writingQuality.readabilityScore).toBeGreaterThanOrEqual(0)
      expect(writingQuality.readabilityScore).toBeLessThanOrEqual(100)
      expect(writingQuality.cohesionScore).toBeGreaterThanOrEqual(0)
      expect(writingQuality.cohesionScore).toBeLessThanOrEqual(100)
      expect(writingQuality.vocabularyScore).toBeGreaterThanOrEqual(0)
      expect(writingQuality.vocabularyScore).toBeLessThanOrEqual(100)
    })

    it('should analyze reference quality', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      const referenceAnalysis = result.assessmentDetails.referenceAnalysis
      expect(referenceAnalysis.qualityScore).toBeGreaterThanOrEqual(0)
      expect(referenceAnalysis.recencyScore).toBeGreaterThanOrEqual(0)
      expect(referenceAnalysis.relevanceScore).toBeGreaterThanOrEqual(0)
      expect(referenceAnalysis.completenessScore).toBeGreaterThanOrEqual(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(
        AIAssessmentService.assessManuscript('manuscript-456', mockManuscriptContent)
      ).rejects.toThrow('Failed to assess manuscript')
    })
  })

  describe('getAssessment', () => {
    it('should retrieve existing assessment', async () => {
      const result = await AIAssessmentService.getAssessment('manuscript-456')

      expect(result).toBeDefined()
      expect(result?.manuscriptId).toBe('manuscript-456')
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT * FROM manuscript_assessments')
        ])
      )
    })

    it('should return null for non-existent assessment', async () => {
      mockSql.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const result = await AIAssessmentService.getAssessment('non-existent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database error'))

      const result = await AIAssessmentService.getAssessment('manuscript-456')

      expect(result).toBeNull()
    })
  })

  describe('updateAssessment', () => {
    it('should update existing assessment', async () => {
      const updates = {
        qualityScore: 90,
        recommendedAction: 'accept' as const
      }

      const result = await AIAssessmentService.updateAssessment('assessment-123', updates)

      expect(result).toBeDefined()
      expect(mockSql).toHaveBeenCalled()
    })

    it('should return null for non-existent assessment', async () => {
      mockSql.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const result = await AIAssessmentService.updateAssessment('non-existent', {})

      expect(result).toBeNull()
    })
  })

  describe('Quality Assessment Methods', () => {
    it('should assess manuscript structure correctly', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      const structureScore = result.assessmentDetails.qualityMetrics.structureScore
      expect(structureScore).toBeGreaterThan(50) // Good structure should score well
    })

    it('should evaluate clarity based on content complexity', async () => {
      const complexContent = {
        ...mockManuscriptContent,
        content: 'This is a very long and complex sentence with multiple subordinate clauses that makes it difficult to understand the main point being conveyed by the author in this particular section of the manuscript.'
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        complexContent
      )

      const clarityScore = result.assessmentDetails.qualityMetrics.clarityScore
      expect(clarityScore).toBeLessThan(100) // Complex content should score lower
    })

    it('should detect methodology sections', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      const methodologyScore = result.assessmentDetails.qualityMetrics.methodologyScore
      expect(methodologyScore).toBeGreaterThan(0) // Should detect methodology section
    })
  })

  describe('Similarity Analysis', () => {
    it('should calculate proper citation ratio', async () => {
      const contentWithCitations = {
        ...mockManuscriptContent,
        content: 'This research builds on previous work [1] and extends the findings of [2].'
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        contentWithCitations
      )

      const properCitations = result.assessmentDetails.similarityAnalysis.properCitations
      expect(properCitations).toBeGreaterThan(0)
    })

    it('should assess plagiarism risk appropriately', async () => {
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        mockManuscriptContent
      )

      const riskLevel = result.assessmentDetails.similarityAnalysis.plagiarismRisk
      expect(['low', 'medium', 'high']).toContain(riskLevel)
    })
  })

  describe('Reference Analysis', () => {
    it('should evaluate reference recency', async () => {
      const currentYear = new Date().getFullYear()
      const recentReferences = mockManuscriptContent.references.map(ref => ({
        ...ref,
        year: currentYear - 1 // Recent references
      }))

      const contentWithRecentRefs = {
        ...mockManuscriptContent,
        references: recentReferences
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        contentWithRecentRefs
      )

      const recencyScore = result.assessmentDetails.referenceAnalysis.recencyScore
      expect(recencyScore).toBeGreaterThan(50) // Recent references should score well
    })

    it('should assess reference completeness', async () => {
      const incompleteReferences = [
        {
          id: '1',
          title: 'Incomplete Reference',
          authors: '',
          journal: '',
          year: 2020
        }
      ]

      const contentWithIncompleteRefs = {
        ...mockManuscriptContent,
        references: incompleteReferences
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        contentWithIncompleteRefs
      )

      const completenessScore = result.assessmentDetails.referenceAnalysis.completenessScore
      expect(completenessScore).toBeLessThan(100) // Incomplete references should score lower
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle very large manuscripts efficiently', async () => {
      const largeContent = {
        ...mockManuscriptContent,
        content: 'Lorem ipsum '.repeat(10000) // Large content
      }

      const startTime = Date.now()
      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        largeContent
      )
      const endTime = Date.now()

      expect(result).toBeDefined()
      expect(endTime - startTime).toBeLessThan(30000) // Should complete within 30 seconds
    })

    it('should handle empty or minimal content gracefully', async () => {
      const emptyContent = {
        title: '',
        abstract: '',
        content: '',
        keywords: [],
        references: [],
        authors: [],
        fieldOfStudy: ''
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        emptyContent
      )

      expect(result).toBeDefined()
      expect(result.qualityScore).toBeLessThan(50)
    })

    it('should handle special characters and unicode', async () => {
      const unicodeContent = {
        ...mockManuscriptContent,
        title: 'Título con caracteres especiales: αβγ δε ζη',
        content: 'Content with émojis 🧪 and spéciàl cháracters'
      }

      const result = await AIAssessmentService.assessManuscript(
        'manuscript-456',
        unicodeContent
      )

      expect(result).toBeDefined()
      expect(result.qualityScore).toBeGreaterThan(0)
    })
  })
})
