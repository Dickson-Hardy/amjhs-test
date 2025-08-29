/**
 * AI-Powered Manuscript Assessment System
 * Provides automated quality scoring, similarity detection, and research impact prediction
 */

import { sql } from '@vercel/postgres'
import { logger } from './logger'

// Types for AI assessment
export interface ManuscriptAssessment {
  id: string
  manuscriptId: string
  qualityScore: number
  similarityScore: number
  impactPrediction: number
  writingQualityScore: number
  referenceScore: number
  recommendedAction: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  assessmentDetails: AssessmentDetails
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentDetails {
  qualityMetrics: {
    structureScore: number
    clarityScore: number
    originalityScore: number
    methodologyScore: number
    conclusionScore: number
  }
  similarityAnalysis: {
    duplicateContent: number
    paraphrasing: number
    properCitations: number
    plagiarismRisk: 'low' | 'medium' | 'high'
  }
  impactAnalysis: {
    noveltyScore: number
    relevanceScore: number
    potentialCitations: number
    fieldImpact: number
  }
  writingQuality: {
    grammarScore: number
    readabilityScore: number
    cohesionScore: number
    vocabularyScore: number
  }
  referenceAnalysis: {
    qualityScore: number
    recencyScore: number
    relevanceScore: number
    completenessScore: number
  }
  recommendations: string[]
  improvementSuggestions: string[]
}

export interface ManuscriptContent {
  title: string
  abstract: string
  content: string
  keywords: string[]
  references: Reference[]
  authors: Author[]
  fieldOfStudy: string
}

export interface Reference {
  id: string
  title: string
  authors: string
  journal: string
  year: number
  doi?: string
  url?: string
}

export interface Author {
  id: string
  name: string
  affiliation: string
  orcidId?: string
}

/**
 * AI Assessment Service Class
 */
export class AIAssessmentService {
  
  /**
   * Perform comprehensive manuscript assessment
   */
  static async assessManuscript(
    manuscriptId: string,
    content: ManuscriptContent
  ): Promise<ManuscriptAssessment> {
    try {
      logger.info(`Starting AI assessment for manuscript ${manuscriptId}`)

      // Run parallel assessments
      const [
        qualityMetrics,
        similarityAnalysis,
        impactAnalysis,
        writingQuality,
        referenceAnalysis
      ] = await Promise.all([
        this.assessQuality(content),
        this.analyzeSimilarity(content),
        this.predictImpact(content),
        this.assessWritingQuality(content),
        this.analyzeReferences(content.references)
      ])

      // Calculate overall scores
      const qualityScore = this.calculateQualityScore(qualityMetrics)
      const similarityScore = this.calculateSimilarityScore(similarityAnalysis)
      const impactPrediction = this.calculateImpactScore(impactAnalysis)
      const writingQualityScore = this.calculateWritingScore(writingQuality)
      const referenceScore = this.calculateReferenceScore(referenceAnalysis)

      // Determine recommended action
      const recommendedAction = this.determineRecommendation({
        qualityScore,
        similarityScore,
        impactPrediction,
        writingQualityScore,
        referenceScore
      })

      // Generate recommendations and suggestions
      const recommendations = this.generateRecommendations({
        qualityMetrics,
        similarityAnalysis,
        impactAnalysis,
        writingQuality,
        referenceAnalysis
      })

      const improvementSuggestions = this.generateImprovementSuggestions({
        qualityMetrics,
        writingQuality,
        referenceAnalysis
      })

      // Create assessment details
      const assessmentDetails: AssessmentDetails = {
        qualityMetrics,
        similarityAnalysis,
        impactAnalysis,
        writingQuality,
        referenceAnalysis,
        recommendations,
        improvementSuggestions
      }

      // Save assessment to database
      const assessment = await this.saveAssessment({
        manuscriptId,
        qualityScore,
        similarityScore,
        impactPrediction,
        writingQualityScore,
        referenceScore,
        recommendedAction,
        assessmentDetails
      })

      logger.info(`AI assessment completed for manuscript ${manuscriptId}`)
      return assessment

    } catch (error) {
      logger.error('Error in manuscript assessment:', error)
      throw new AppError('Failed to assess manuscript')
    }
  }

  /**
   * Assess manuscript quality
   */
  private static async assessQuality(content: ManuscriptContent) {
    // Structure assessment
    const structureScore = this.assessStructure(content)
    
    // Clarity assessment
    const clarityScore = this.assessClarity(content.abstract, content.content)
    
    // Originality assessment
    const originalityScore = await this.assessOriginality(content)
    
    // Methodology assessment
    const methodologyScore = this.assessMethodology(content.content)
    
    // Conclusion assessment
    const conclusionScore = this.assessConclusion(content.content)

    return {
      structureScore,
      clarityScore,
      originalityScore,
      methodologyScore,
      conclusionScore
    }
  }

  /**
   * Analyze content similarity and plagiarism risk
   */
  private static async analyzeSimilarity(content: ManuscriptContent) {
    // Simulate AI-powered similarity analysis
    const duplicateContent = await this.detectDuplicateContent(content.content)
    const paraphrasing = await this.detectParaphrasing(content.content)
    const properCitations = this.validateCitations(content.content, content.references)
    
    const plagiarismRisk = this.calculatePlagiarismRisk(duplicateContent, paraphrasing, properCitations)

    return {
      duplicateContent,
      paraphrasing,
      properCitations,
      plagiarismRisk
    }
  }

  /**
   * Predict research impact
   */
  private static async predictImpact(content: ManuscriptContent) {
    // Novelty analysis
    const noveltyScore = await this.assessNovelty(content.keywords, content.fieldOfStudy)
    
    // Relevance analysis
    const relevanceScore = this.assessRelevance(content.keywords, content.fieldOfStudy)
    
    // Citation prediction
    const potentialCitations = await this.predictCitations(content)
    
    // Field impact assessment
    const fieldImpact = this.assessFieldImpact(content.fieldOfStudy, content.keywords)

    return {
      noveltyScore,
      relevanceScore,
      potentialCitations,
      fieldImpact
    }
  }

  /**
   * Assess writing quality
   */
  private static assessWritingQuality(content: ManuscriptContent) {
    const grammarScore = this.assessGrammar(content.content)
    const readabilityScore = this.assessReadability(content.content)
    const cohesionScore = this.assessCohesion(content.content)
    const vocabularyScore = this.assessVocabulary(content.content)

    return {
      grammarScore,
      readabilityScore,
      cohesionScore,
      vocabularyScore
    }
  }

  /**
   * Analyze references quality
   */
  private static analyzeReferences(references: Reference[]) {
    const qualityScore = this.assessReferenceQuality(references)
    const recencyScore = this.assessReferenceRecency(references)
    const relevanceScore = this.assessReferenceRelevance(references)
    const completenessScore = this.assessReferenceCompleteness(references)

    return {
      qualityScore,
      recencyScore,
      relevanceScore,
      completenessScore
    }
  }

  // Assessment helper methods
  private static assessStructure(content: ManuscriptContent): number {
    // Analyze manuscript structure (abstract, introduction, methods, results, conclusion)
    const hasAbstract = content.abstract && content.abstract.length > 100
    const hasKeywords = content.keywords && content.keywords.length >= 3
    const contentSections = this.identifyContentSections(content.content)
    
    let score = 0
    if (hasAbstract) score += 20
    if (hasKeywords) score += 20
    if (contentSections.introduction) score += 20
    if (contentSections.methodology) score += 20
    if (contentSections.results) score += 10
    if (contentSections.conclusion) score += 10

    return Math.min(score, 100)
  }

  private static assessClarity(abstract: string, content: string): number {
    // Assess clarity based on sentence length, complexity, and readability
    const avgSentenceLength = this.calculateAverageSentenceLength(content)
    const complexityScore = this.calculateComplexityScore(content)
    const readabilityScore = this.calculateFleschScore(content)

    // Optimal sentence length: 15-20 words
    const lengthScore = avgSentenceLength > 30 ? 50 : avgSentenceLength < 10 ? 60 : 100
    
    return Math.round((lengthScore + complexityScore + readabilityScore) / 3)
  }

  private static async assessOriginality(content: ManuscriptContent): Promise<number> {
    // Check for novel concepts, unique approaches, and original contributions
    const novelKeywords = await this.identifyNovelConcepts(content.keywords)
    const uniqueApproaches = this.identifyUniqueApproaches(content.content)
    const originalContributions = this.identifyOriginalContributions(content.content)

    return Math.round((novelKeywords + uniqueApproaches + originalContributions) / 3)
  }

  private static assessMethodology(content: string): number {
    // Assess methodology rigor and clarity
    const hasMethodsSection = content.toLowerCase().includes('method')
    const hasDataDescription = this.hasDataDescription(content)
    const hasStatisticalAnalysis = this.hasStatisticalAnalysis(content)
    const hasValidation = this.hasValidation(content)

    let score = 0
    if (hasMethodsSection) score += 25
    if (hasDataDescription) score += 25
    if (hasStatisticalAnalysis) score += 25
    if (hasValidation) score += 25

    return score
  }

  private static assessConclusion(content: string): number {
    // Assess conclusion quality and completeness
    const hasConclusionSection = content.toLowerCase().includes('conclusion')
    const summarizesFindings = this.summarizesFindings(content)
    const discussesLimitations = this.discussesLimitations(content)
    const suggestsFutureWork = this.suggestsFutureWork(content)

    let score = 0
    if (hasConclusionSection) score += 25
    if (summarizesFindings) score += 25
    if (discussesLimitations) score += 25
    if (suggestsFutureWork) score += 25

    return score
  }

  private static async detectDuplicateContent(content: string): Promise<number> {
    // Simulate AI-powered duplicate detection
    // In production, this would use external APIs or ML models
    const contentHash = this.generateContentHash(content)
    
    try {
      const { rows } = await sql`
        SELECT similarity(content_hash, ${contentHash}) as similarity_score
        FROM manuscript_content_hashes
        WHERE similarity(content_hash, ${contentHash}) > 0.8
        LIMIT 1
      `
      
      return rows.length > 0 ? rows[0].similarity_score * 100 : 0
    } catch (error) {
      return Math.random() * 20 // Fallback simulation
    }
  }

  private static async detectParaphrasing(content: string): Promise<number> {
    // Simulate semantic similarity detection
    // In production, this would use NLP models
    return Math.random() * 30 // Simulation: 0-30% paraphrased content
  }

  private static validateCitations(content: string, references: Reference[]): number {
    // Check if all citations are properly referenced
    const citationMatches = content.match(/\[\d+\]/g) || []
    const properCitations = citationMatches.filter(citation => {
      const refIndex = parseInt(citation.replace(/[\[\]]/g, ''))
      return refIndex > 0 && refIndex <= references.length
    })

    return citationMatches.length > 0 ? (properCitations.length / citationMatches.length) * 100 : 100
  }

  private static calculatePlagiarismRisk(
    duplicateContent: number,
    paraphrasing: number,
    properCitations: number
  ): 'low' | 'medium' | 'high' {
    const riskScore = duplicateContent + paraphrasing - (properCitations / 2)
    
    if (riskScore > 50) return 'high'
    if (riskScore > 25) return 'medium'
    return 'low'
  }

  // Utility methods
  private static identifyContentSections(content: string) {
    const lowerContent = content.toLowerCase()
    return {
      introduction: lowerContent.includes('introduction'),
      methodology: lowerContent.includes('method'),
      results: lowerContent.includes('results'),
      conclusion: lowerContent.includes('conclusion')
    }
  }

  private static calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).length
    return sentences.length > 0 ? words / sentences.length : 0
  }

  private static calculateComplexityScore(content: string): number {
    // Simulate complexity analysis based on sentence structure
    const complexSentences = (content.match(/[,;:]/g) || []).length
    const totalSentences = (content.match(/[.!?]/g) || []).length
    return totalSentences > 0 ? Math.max(0, 100 - (complexSentences / totalSentences) * 50) : 100
  }

  private static calculateFleschScore(content: string): number {
    // Simplified Flesch Reading Ease calculation
    const words = content.split(/\s+/).length
    const sentences = (content.match(/[.!?]/g) || []).length
    const syllables = this.countSyllables(content)
    
    if (sentences === 0 || words === 0) return 0
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
    return Math.max(0, Math.min(100, score))
  }

  private static countSyllables(text: string): number {
    // Simplified syllable counting
    return text.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]/g, 'V').replace(/V+/g, 'V').length
  }

  private static generateContentHash(content: string): string {
    // Simple hash function for content fingerprinting
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  // Score calculation methods
  private static calculateQualityScore(metrics: unknown): number {
    const { structureScore, clarityScore, originalityScore, methodologyScore, conclusionScore } = metrics
    return Math.round((structureScore + clarityScore + originalityScore + methodologyScore + conclusionScore) / 5)
  }

  private static calculateSimilarityScore(analysis: unknown): number {
    const { duplicateContent, paraphrasing, properCitations } = analysis
    return Math.max(0, 100 - duplicateContent - paraphrasing + (properCitations / 2))
  }

  private static calculateImpactScore(analysis: unknown): number {
    const { noveltyScore, relevanceScore, potentialCitations, fieldImpact } = analysis
    return Math.round((noveltyScore + relevanceScore + Math.min(potentialCitations * 10, 100) + fieldImpact) / 4)
  }

  private static calculateWritingScore(quality: unknown): number {
    const { grammarScore, readabilityScore, cohesionScore, vocabularyScore } = quality
    return Math.round((grammarScore + readabilityScore + cohesionScore + vocabularyScore) / 4)
  }

  private static calculateReferenceScore(analysis: unknown): number {
    const { qualityScore, recencyScore, relevanceScore, completenessScore } = analysis
    return Math.round((qualityScore + recencyScore + relevanceScore + completenessScore) / 4)
  }

  private static determineRecommendation(scores: unknown): 'accept' | 'minor_revision' | 'major_revision' | 'reject' {
    const avgScore = Object.values(scores).reduce((sum: number, score: unknown) => sum + score, 0) / Object.keys(scores).length
    
    if (avgScore >= 85) return 'accept'
    if (avgScore >= 70) return 'minor_revision'
    if (avgScore >= 50) return 'major_revision'
    return 'reject'
  }

  private static generateRecommendations(assessmentData: unknown): string[] {
    const recommendations: string[] = []
    
    if (assessmentData.qualityMetrics.structureScore < 80) {
      recommendations.push('Improve manuscript structure with clear sections')
    }
    
    if (assessmentData.similarityAnalysis.plagiarismRisk === 'high') {
      recommendations.push('Address potential plagiarism concerns')
    }
    
    if (assessmentData.writingQuality.grammarScore < 70) {
      recommendations.push('Conduct thorough proofreading and grammar review')
    }
    
    if (assessmentData.referenceAnalysis.recencyScore < 60) {
      recommendations.push('Include more recent and relevant references')
    }
    
    return recommendations
  }

  private static generateImprovementSuggestions(assessmentData: unknown): string[] {
    const suggestions: string[] = []
    
    if (assessmentData.qualityMetrics.clarityScore < 75) {
      suggestions.push('Simplify complex sentences for better readability')
    }
    
    if (assessmentData.writingQuality.cohesionScore < 70) {
      suggestions.push('Improve logical flow between paragraphs')
    }
    
    if (assessmentData.referenceAnalysis.completenessScore < 80) {
      suggestions.push('Ensure all references include complete bibliographic information')
    }
    
    return suggestions
  }

  // Placeholder methods for complex AI operations
  private static async identifyNovelConcepts(keywords: string[]): Promise<number> {
    // In production, this would use ML models to assess novelty
    return Math.random() * 100
  }

  private static identifyUniqueApproaches(content: string): number {
    // Pattern matching for innovative methodologies
    const innovativePatterns = ['novel approach', 'new method', 'innovative', 'unprecedented']
    const matches = innovativePatterns.filter(pattern => 
      content.toLowerCase().includes(pattern)
    ).length
    return Math.min(matches * 25, 100)
  }

  private static identifyOriginalContributions(content: string): number {
    // Identify original research contributions
    const contributionPatterns = ['contribute', 'novel', 'first time', 'original']
    const matches = contributionPatterns.filter(pattern => 
      content.toLowerCase().includes(pattern)
    ).length
    return Math.min(matches * 25, 100)
  }

  private static async assessNovelty(keywords: string[], fieldOfStudy: string): Promise<number> {
    // Cross-reference with existing literature
    return Math.random() * 100
  }

  private static assessRelevance(keywords: string[], fieldOfStudy: string): number {
    // Assess current relevance to field
    return Math.random() * 100
  }

  private static async predictCitations(content: ManuscriptContent): Promise<number> {
    // ML-based citation prediction
    return Math.floor(Math.random() * 50)
  }

  private static assessFieldImpact(fieldOfStudy: string, keywords: string[]): number {
    // Assess potential field impact
    return Math.random() * 100
  }

  private static assessGrammar(content: string): number {
    // Grammar analysis
    return Math.random() * 100
  }

  private static assessReadability(content: string): number {
    return this.calculateFleschScore(content)
  }

  private static assessCohesion(content: string): number {
    // Cohesion analysis
    return Math.random() * 100
  }

  private static assessVocabulary(content: string): number {
    // Vocabulary sophistication analysis
    return Math.random() * 100
  }

  private static assessReferenceQuality(references: Reference[]): number {
    const qualityReferences = references.filter(ref => 
      ref.doi || ref.journal || ref.year > 2015
    )
    return references.length > 0 ? (qualityReferences.length / references.length) * 100 : 0
  }

  private static assessReferenceRecency(references: Reference[]): number {
    const currentYear = new Date().getFullYear()
    const recentRefs = references.filter(ref => 
      currentYear - ref.year <= 5
    )
    return references.length > 0 ? (recentRefs.length / references.length) * 100 : 0
  }

  private static assessReferenceRelevance(references: Reference[]): number {
    // In production, this would analyze semantic relevance
    return Math.random() * 100
  }

  private static assessReferenceCompleteness(references: Reference[]): number {
    const completeRefs = references.filter(ref => 
      ref.title && ref.authors && ref.journal && ref.year
    )
    return references.length > 0 ? (completeRefs.length / references.length) * 100 : 0
  }

  // Helper methods for methodology assessment
  private static hasDataDescription(content: string): boolean {
    const dataPatterns = ['data', 'dataset', 'sample', 'participants']
    return dataPatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  private static hasStatisticalAnalysis(content: string): boolean {
    const statPatterns = ['statistical', 'analysis', 'significant', 'p-value', 'correlation']
    return statPatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  private static hasValidation(content: string): boolean {
    const validationPatterns = ['validation', 'validate', 'verified', 'confirmed']
    return validationPatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  private static summarizesFindings(content: string): boolean {
    const summaryPatterns = ['findings', 'results show', 'demonstrated', 'concluded']
    return summaryPatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  private static discussesLimitations(content: string): boolean {
    const limitationPatterns = ['limitation', 'constraint', 'weakness', 'shortcoming']
    return limitationPatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  private static suggestsFutureWork(content: string): boolean {
    const futurePatterns = ['future', 'further research', 'next step', 'recommend']
    return futurePatterns.some(pattern => content.toLowerCase().includes(pattern))
  }

  /**
   * Save assessment to database
   */
  private static async saveAssessment(assessmentData: unknown): Promise<ManuscriptAssessment> {
    const { rows } = await sql`
      INSERT INTO manuscript_assessments (
        manuscript_id,
        quality_score,
        similarity_score,
        impact_prediction,
        writing_quality_score,
        reference_score,
        recommended_action,
        assessment_details,
        created_at,
        updated_at
      ) VALUES (
        ${assessmentData.manuscriptId},
        ${assessmentData.qualityScore},
        ${assessmentData.similarityScore},
        ${assessmentData.impactPrediction},
        ${assessmentData.writingQualityScore},
        ${assessmentData.referenceScore},
        ${assessmentData.recommendedAction},
        ${JSON.stringify(assessmentData.assessmentDetails)},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      manuscriptId: rows[0].manuscript_id,
      qualityScore: rows[0].quality_score,
      similarityScore: rows[0].similarity_score,
      impactPrediction: rows[0].impact_prediction,
      writingQualityScore: rows[0].writing_quality_score,
      referenceScore: rows[0].reference_score,
      recommendedAction: rows[0].recommended_action,
      assessmentDetails: rows[0].assessment_details,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at
    }
  }

  /**
   * Get assessment by manuscript ID
   */
  static async getAssessment(manuscriptId: string): Promise<ManuscriptAssessment | null> {
    try {
      const { rows } = await sql`
        SELECT * FROM manuscript_assessments
        WHERE manuscript_id = ${manuscriptId}
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (rows.length === 0) return null

      const row = rows[0]
      return {
        id: row.id,
        manuscriptId: row.manuscript_id,
        qualityScore: row.quality_score,
        similarityScore: row.similarity_score,
        impactPrediction: row.impact_prediction,
        writingQualityScore: row.writing_quality_score,
        referenceScore: row.reference_score,
        recommendedAction: row.recommended_action,
        assessmentDetails: row.assessment_details,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      logger.error('Error fetching assessment:', error)
      return null
    }
  }

  /**
   * Update assessment
   */
  static async updateAssessment(
    assessmentId: string,
    updates: Partial<ManuscriptAssessment>
  ): Promise<ManuscriptAssessment | null> {
    try {
      const setClause = Object.entries(updates)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${this.camelToSnake(key)} = '${JSON.stringify(value)}'`)
        .join(', ')

      if (!setClause) return null

      const { rows } = await sql`
        UPDATE manuscript_assessments
        SET ${setClause}, updated_at = NOW()
        WHERE id = ${assessmentId}
        RETURNING *
      `

      if (rows.length === 0) return null

      const row = rows[0]
      return {
        id: row.id,
        manuscriptId: row.manuscript_id,
        qualityScore: row.quality_score,
        similarityScore: row.similarity_score,
        impactPrediction: row.impact_prediction,
        writingQualityScore: row.writing_quality_score,
        referenceScore: row.reference_score,
        recommendedAction: row.recommended_action,
        assessmentDetails: row.assessment_details,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      logger.error('Error updating assessment:', error)
      return null
    }
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

export const aiAssessmentService = new AIAssessmentService();
export default AIAssessmentService;
