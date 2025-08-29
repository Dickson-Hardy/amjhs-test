import { describe, it, expect, beforeEach, vi } from "vitest"
import { EditorialWorkflow } from "@/lib/workflow"
import { db } from "@/lib/db"

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}))

// Mock email service
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  emailTemplates: {
    submissionReceived: vi.fn(() => ({
      subject: "Test Subject",
      html: "Test HTML",
    })),
  },
}))

describe("EditorialWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("submitArticle", () => {
    it("should successfully submit an article", async () => {
      const mockArticle = {
        id: "test-id",
        title: "Test Article",
        abstract: "Test abstract",
        authorId: "author-id",
      }

      const mockUser = {
        id: "author-id",
        name: "Test Author",
        email: "test@example.com",
      }

      // Mock database responses
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockArticle]),
        }),
      } as any)

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      } as any)

      const result = await EditorialWorkflow.submitArticle(
        {
          title: "Test Article",
          abstract: "Test abstract",
          keywords: ["test"],
          category: "IoT",
        },
        "author-id",
      )

      expect(result.success).toBe(true)
      expect(result.article).toEqual(mockArticle)
    })

    it("should handle submission errors", async () => {
      vi.mocked(db.insert).mockImplementation(() => {
        throw new Error("Database error")
      })

      const result = await EditorialWorkflow.submitArticle(
        {
          title: "Test Article",
          abstract: "Test abstract",
          keywords: ["test"],
          category: "IoT",
        },
        "author-id",
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Submission failed")
    })
  })
})
