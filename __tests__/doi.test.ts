import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DOIGenerator } from '../lib/doi'

// Mock environment variables
vi.stubEnv('DOI_PREFIX', '10.1234')
vi.stubEnv('CROSSREF_API_KEY', 'test-api-key')
vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://test-journal.com')

// Mock fetch
global.fetch = vi.fn()

describe('DOI Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateDOI', () => {
    it('should generate valid DOI format', () => {
      const doi = DOIGenerator.generateDOI({
        year: 2025,
        volume: "1",
        issue: "1", 
        articleNumber: 1
      })
      
      expect(doi).toBe('10.1234/amhsj.2025.1.1.001')
    })

    it('should pad article numbers correctly', () => {
      const doi1 = DOIGenerator.generateDOI({
        year: 2025,
        volume: "1",
        issue: "2", 
        articleNumber: 5
      })
      
      const doi2 = DOIGenerator.generateDOI({
        year: 2025,
        volume: "2",
        issue: "1", 
        articleNumber: 123
      })
      
      expect(doi1).toBe('10.1234/amhsj.2025.1.2.005')
      expect(doi2).toBe('10.1234/amhsj.2025.2.1.123')
    })
  })

  describe('registerWithCrossRef', () => {
    it('should successfully register DOI with CrossRef', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'success' })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const metadata = {
        articleId: 'test-article-id',
        title: 'Test Article',
        authors: [
          {
            given: 'John',
            family: 'Doe',
            affiliation: 'Test University'
          }
        ],
        abstract: 'Test abstract',
        publicationDate: '2025-07-06',
        volume: '1',
        issue: '1',
        pages: '1-10',
        keywords: ['test', 'research'],
        category: 'Computer Science'
      }
      
      const result = await DOIGenerator.registerWithCrossRef('10.1234/test', metadata)
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.crossref.org/deposits',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'process.env.AUTH_TOKEN_PREFIX || "process.env.AUTH_TOKEN_PREFIX || "process.env.AUTH_TOKEN_PREFIX || "Bearer """test-api-key'
          })
        })
      )
    })

    it('should handle CrossRef registration failure', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockResolvedValue('API Error')
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const metadata = {
        articleId: 'test-article-id',
        title: 'Test Article',
        authors: [],
        abstract: 'Test abstract',
        publicationDate: '2025-07-06',
        volume: '1',
        issue: '1',
        pages: '1-10',
        keywords: [],
        category: 'Computer Science'
      }
      
      const result = await DOIGenerator.registerWithCrossRef('10.1234/test', metadata)
      
      expect(result).toBe(false)
    })
  })

  describe('verifyDOI', () => {
    it('should verify existing DOI', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: {
            DOI: '10.1234/test',
            title: ['Test Article'],
            indexed: {
              'date-time': '2025-07-06T00:00:00Z'
            }
          }
        })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const result = await DOIGenerator.verifyDOI('10.1234/test')
      
      expect(result.exists).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.registeredAt).toBe('2025-07-06T00:00:00Z')
    })

    it('should handle non-existent DOI', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found'
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const result = await DOIGenerator.verifyDOI('10.1234/nonexistent')
      
      expect(result.exists).toBe(false)
      expect(result.error).toContain('DOI not found')
    })
  })
})
