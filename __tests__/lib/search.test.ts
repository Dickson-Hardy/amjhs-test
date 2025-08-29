import { describe, it, expect, beforeEach, vi } from "vitest"
import { AdvancedSearch } from "@/lib/search"
import { db } from "@/lib/db"

vi.mock("@/lib/db")

describe("AdvancedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("searchArticles", () => {
    it("should return search results with pagination", async () => {
      const mockResults = [
        {
          id: "1",
          title: "IoT Article 1",
          abstract: "Test abstract",
          category: "IoT",
        },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockResults),
                }),
              }),
            }),
          }),
        }),
      } as any)

      const result = await AdvancedSearch.searchArticles({
        query: "IoT",
        page: 1,
        limit: 10,
      })

      expect(result.success).toBe(true)
      expect(result.results).toEqual(mockResults)
    })
  })
})
