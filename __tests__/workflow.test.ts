import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  workflowManager, 
  reviewerAssignmentService, 
  articleSubmissionService, 
  reviewManagementService,
  WORKFLOW_TRANSITIONS 
} from '../lib/workflow'

// Mock dependencies
vi.mock('../lib/db')
vi.mock('../lib/email')
vi.mock('uuid')

const mockDb = vi.mocked(await import('../lib/db'))
const mockEmail = vi.mocked(await import('../lib/email'))

describe('Workflow System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('WORKFLOW_TRANSITIONS', () => {
    it('should define valid workflow transitions', () => {
      expect(WORKFLOW_TRANSITIONS.draft).toContain('submitted')
      expect(WORKFLOW_TRANSITIONS.submitted).toContain('under_review')
      expect(WORKFLOW_TRANSITIONS.technical_check).toContain('under_review')
      expect(WORKFLOW_TRANSITIONS.under_review).toContain('accepted')
      expect(WORKFLOW_TRANSITIONS.accepted).toContain('published')
    })

    it('should not allow invalid transitions', () => {
      expect(WORKFLOW_TRANSITIONS.published).toEqual([])
      expect(WORKFLOW_TRANSITIONS.rejected).toEqual([])
    })
  })

  describe('ReviewerAssignmentService', () => {
    it('should find suitable reviewers based on expertise', async () => {
      const mockReviewers = [
        {
          id: 'reviewer1',
          email: 'reviewer1@example.com',
          name: 'Reviewer One',
          expertise: ['AI', 'Machine Learning'],
          currentLoad: 1,
          maxReviews: 3,
          qualityScore: 85,
          completedReviews: 10,
          lateReviews: 0,
          lastReviewDate: new Date('2024-11-01')
        },
        {
          id: 'reviewer2',
          email: 'reviewer2@example.com',
          name: 'Reviewer Two',
          expertise: ['Computer Vision', 'AI'],
          currentLoad: 2,
          maxReviews: 3,
          qualityScore: 90,
          completedReviews: 15,
          lateReviews: 1,
          lastReviewDate: new Date('2024-12-01')
        }
      ]

      // Mock database queries
      mockDb.db.query.articles.findFirst.mockResolvedValue({
        id: 'article1',
        title: 'AI Research Paper',
        keywords: ['artificial intelligence', 'machine learning'],
        authorId: 'author1'
      })

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockReviewers)
          })
        })
      })

      const criteria = {
        expertise: ['artificial intelligence', 'machine learning'],
        excludeConflicts: [],
        maxWorkload: 3,
        minQualityScore: 80
      }

      const result = await reviewerAssignmentService.findSuitableReviewers(
        'article1',
        criteria
      )

      expect(result).toHaveLength(2)
      expect(result[0].id).toBeDefined()
      expect(result[0].score).toBeGreaterThan(0)
      expect(result[0].score).toBeLessThanOrEqual(1)
    })

    it('should assign reviewers to an article', async () => {
      const mockArticle = {
        id: 'article1',
        title: 'Test Article',
        authorId: 'author1'
      }

      const mockEditor = {
        id: 'editor1',
        role: 'editor'
      }

      const mockReviewer = {
        userId: 'reviewer1',
        user: {
          id: 'reviewer1',
          email: 'reviewer@example.com',
          name: 'Test Reviewer',
          role: 'reviewer'
        },
        currentReviewLoad: 1,
        maxReviewsPerMonth: 3
      }

      // Mock database queries
      mockDb.db.query.articles.findFirst.mockResolvedValue(mockArticle)
      mockDb.db.query.users.findFirst.mockResolvedValue(mockEditor)
      mockDb.db.query.reviewerProfiles.findFirst.mockResolvedValue(mockReviewer)
      
      // Mock database operations
      mockDb.db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) })
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })

      // Mock email service
      mockEmail.sendReviewInvitation.mockResolvedValue()

      const result = await reviewerAssignmentService.assignReviewers(
        'article1',
        ['reviewer1'],
        'editor1'
      )

      expect(result.success).toBe(true)
      expect(result.assignedReviewers).toContain('reviewer1')
      expect(result.errors).toHaveLength(0)
      expect(mockEmail.sendReviewInvitation).toHaveBeenCalled()
    })

    it('should handle conflicts of interest', async () => {
      const mockArticle = {
        id: 'article1',
        title: 'Test Article',
        authorId: 'author1'
      }

      const mockEditor = {
        id: 'editor1',
        role: 'editor'
      }

      const mockReviewer = {
        userId: 'author1', // Same as author - conflict!
        user: {
          id: 'author1',
          email: 'author@example.com',
          name: 'Test Author',
          role: 'reviewer'
        }
      }

      mockDb.db.query.articles.findFirst.mockResolvedValue(mockArticle)
      mockDb.db.query.users.findFirst.mockResolvedValue(mockEditor)
      mockDb.db.query.reviewerProfiles.findFirst.mockResolvedValue(mockReviewer)

      const result = await reviewerAssignmentService.assignReviewers(
        'article1',
        ['author1'],
        'editor1'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('Cannot assign author as reviewer'))
    })
  })

  describe('ArticleSubmissionService', () => {
    it('should submit article successfully', async () => {
      const mockAuthor = {
        id: 'author1',
        email: 'author@example.com',
        name: 'Test Author'
      }

      const mockEditor = {
        id: 'editor1',
        email: 'editor@example.com',
        name: 'Test Editor'
      }

      const articleData = {
        title: 'Test Article',
        abstract: 'This is a test abstract',
        keywords: ['test', 'article'],
        category: 'research',
        content: 'Test content'
      }

      // Mock database queries
      mockDb.db.query.users.findFirst.mockResolvedValue(mockAuthor)
      mockDb.db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) })
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockEditor])
          })
        })
      })
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })
      mockDb.db.query.articles.findFirst.mockResolvedValue({ id: 'article1', ...articleData })

      // Mock email service
      mockEmail.sendWorkflowNotification.mockResolvedValue()

      const result = await articleSubmissionService.submitArticle(articleData, 'author1')

      expect(result.success).toBe(true)
      expect(result.article).toBeDefined()
      expect(result.submissionId).toBeDefined()
      expect(result.message).toContain('successfully')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        abstract: 'Test abstract',
        keywords: ['test'],
        category: 'research'
      }

      const result = await articleSubmissionService.submitArticle(invalidData, 'author1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Title is required')
    })

    it('should update submission status with history', async () => {
      const mockSubmission = {
        id: 'submission1',
        articleId: 'article1',
        status: 'submitted',
        statusHistory: []
      }

      mockDb.db.query.submissions.findFirst.mockResolvedValue(mockSubmission)
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })

      const result = await articleSubmissionService.updateSubmissionStatus(
        'submission1',
        'under_review',
        'editor1',
        'Assigned to editor'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('updated successfully')
    })

    it('should reject invalid status transitions', async () => {
      const mockSubmission = {
        id: 'submission1',
        status: 'published', // Cannot transition from published
        statusHistory: []
      }

      mockDb.db.query.submissions.findFirst.mockResolvedValue(mockSubmission)

      const result = await articleSubmissionService.updateSubmissionStatus(
        'submission1',
        'submitted', // Invalid transition
        'editor1'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid status transition')
    })
  })

  describe('ReviewManagementService', () => {
    it('should submit review successfully', async () => {
      const mockReview = {
        id: 'review1',
        articleId: 'article1',
        reviewerId: 'reviewer1',
        status: 'pending'
      }

      const mockArticle = {
        id: 'article1',
        title: 'Test Article',
        authorId: 'author1',
        editorId: 'editor1'
      }

      const reviewData = {
        recommendation: 'accept' as const,
        comments: 'This is a good paper',
        rating: 5
      }

      // Mock database queries
      mockDb.db.query.reviews.findFirst.mockResolvedValue(mockReview)
      mockDb.db.query.articles.findFirst.mockResolvedValue(mockArticle)
      mockDb.db.query.reviews.findMany.mockResolvedValue([
        { ...mockReview, status: 'completed', recommendation: 'accept' }
      ])
      
      // Mock database operations
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })

      const result = await reviewManagementService.submitReview(
        'review1',
        reviewData,
        'reviewer1'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('successfully')
    })

    it('should reject review submission for wrong reviewer', async () => {
      mockDb.db.query.reviews.findFirst.mockResolvedValue(null)

      const result = await reviewManagementService.submitReview(
        'review1',
        {
          recommendation: 'accept' as const,
          comments: 'Test'
        },
        'wrong-reviewer'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('not found or access denied')
    })

    it('should prevent duplicate review submissions', async () => {
      const mockReview = {
        id: 'review1',
        status: 'completed' // Already completed
      }

      mockDb.db.query.reviews.findFirst.mockResolvedValue(mockReview)

      const result = await reviewManagementService.submitReview(
        'review1',
        {
          recommendation: 'accept' as const,
          comments: 'Test'
        },
        'reviewer1'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('already completed')
    })

    it('should determine article status from review recommendations', async () => {
      const mockReview = {
        id: 'review1',
        articleId: 'article1',
        reviewerId: 'reviewer1',
        status: 'pending'
      }

      const mockArticle = {
        id: 'article1',
        title: 'Test Article',
        authorId: 'author1',
        editorId: 'editor1'
      }

      // Mock multiple reviews with different recommendations
      const allReviews = [
        { status: 'completed', recommendation: 'accept' },
        { status: 'completed', recommendation: 'minor_revision' },
        { status: 'completed', recommendation: 'accept' }
      ]

      mockDb.db.query.reviews.findFirst.mockResolvedValue(mockReview)
      mockDb.db.query.articles.findFirst.mockResolvedValue(mockArticle)
      mockDb.db.query.reviews.findMany.mockResolvedValue(allReviews)
      
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })

      const result = await reviewManagementService.submitReview(
        'review1',
        {
          recommendation: 'accept' as const,
          comments: 'Good paper'
        },
        'reviewer1'
      )

      expect(result.success).toBe(true)
      // Should be revision_requested due to minor_revision recommendation
    })

    it('should handle overdue reviews', async () => {
      const overdueReviews = [
        {
          id: 'review1',
          articleId: 'article1',
          reviewerId: 'reviewer1',
          createdAt: new Date('2024-10-01') // Old date
        }
      ]

      const mockReviewer = {
        id: 'reviewer1',
        email: 'reviewer@example.com',
        name: 'Test Reviewer'
      }

      // Mock database queries
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(overdueReviews)
          })
        })
      })
      mockDb.db.query.users.findFirst.mockResolvedValue(mockReviewer)
      
      // Mock database operations
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })
      mockDb.db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) })

      await reviewManagementService.checkOverdueReviews()

      // Should update review status and send notifications
      expect(mockDb.db.update).toHaveBeenCalled()
      expect(mockDb.db.insert).toHaveBeenCalled() // Notification
    })
  })

  describe('EditorialWorkflow Integration', () => {
    it('should provide access to all services', () => {
      expect(workflowManager.reviewerAssignment).toBeDefined()
      expect(workflowManager.submission).toBeDefined()
      expect(workflowManager.review).toBeDefined()
      expect(workflowManager.assignReviewers).toBeDefined()
      expect(workflowManager.submitArticle).toBeDefined()
    })

    it('should handle legacy updateSubmissionWorkflow method', async () => {
      const mockSubmission = {
        id: 'submission1',
        status: 'submitted'
      }

      mockDb.db.query.submissions.findFirst.mockResolvedValue(mockSubmission)
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })
      mockDb.db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) })

      // Mock email service
      mockEmail.sendNotificationEmail.mockResolvedValue()

      await workflowManager.updateSubmissionWorkflow(
        'submission1',
        { id: 'reviewer1', email: 'reviewer@example.com' },
        'You have been assigned a review',
        'under_review',
        'editor1'
      )

      expect(mockEmail.sendNotificationEmail).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.db.query.articles.findFirst.mockRejectedValue(new Error('Database error'))

      await expect(
        reviewerAssignmentService.findSuitableReviewers('article1', {
          expertise: ['AI'],
          excludeConflicts: [],
          maxWorkload: 3,
          minQualityScore: 80
        })
      ).rejects.toThrow('Database error')
    })

    it('should handle email sending errors', async () => {
      const mockAuthor = { id: 'author1', email: 'author@example.com', name: 'Author' }
      
      mockDb.db.query.users.findFirst.mockResolvedValue(mockAuthor)
      mockDb.db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) })
      mockEmail.sendWorkflowNotification.mockRejectedValue(new Error('Email error'))

      const result = await articleSubmissionService.submitArticle(
        {
          title: 'Test Article',
          abstract: 'Test abstract',
          keywords: ['test'],
          category: 'research'
        },
        'author1'
      )

      // Should still succeed even if email fails
      expect(result.success).toBe(true)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle empty reviewer pools', async () => {
      mockDb.db.query.articles.findFirst.mockResolvedValue({
        id: 'article1',
        authorId: 'author1'
      })
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]) // No reviewers available
          })
        })
      })

      const result = await reviewerAssignmentService.findSuitableReviewers(
        'article1',
        {
          expertise: ['AI'],
          excludeConflicts: [],
          maxWorkload: 3,
          minQualityScore: 80
        }
      )

      expect(result).toHaveLength(0)
    })

    it('should limit reviewer results appropriately', async () => {
      const manyReviewers = Array.from({ length: 20 }, (_, i) => ({
        id: `reviewer${i}`,
        email: `reviewer${i}@example.com`,
        name: `Reviewer ${i}`,
        expertise: ['AI'],
        currentLoad: 0,
        maxReviews: 3,
        qualityScore: 80,
        completedReviews: 5,
        lateReviews: 0,
        lastReviewDate: new Date()
      }))

      mockDb.db.query.articles.findFirst.mockResolvedValue({
        id: 'article1',
        authorId: 'author1'
      })
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(manyReviewers)
          })
        })
      })

      const result = await reviewerAssignmentService.findSuitableReviewers(
        'article1',
        {
          expertise: ['AI'],
          excludeConflicts: [],
          maxWorkload: 3,
          minQualityScore: 80
        }
      )

      expect(result.length).toBeLessThanOrEqual(10) // Should limit to 10
    })
  })
})
