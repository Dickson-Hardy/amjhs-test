import { describe, it, expect, beforeEach, vi } from "vitest"
import { GET, POST } from "@/app/api/articles/route"
import { NextRequest } from "next/server"

// Mock the database
vi.mock("@/lib/db")

describe("/api/articles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET", () => {
    it("should return articles with default pagination", async () => {
      const request = new NextRequest("http://localhost/api/articles")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("success")
      expect(data).toHaveProperty("articles")
    })

    it("should handle search parameters", async () => {
      const request = new NextRequest("http://localhost/api/articles?search=IoT&category=technology")
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe("POST", () => {
    it("should create a new article", async () => {
      const articleData = {
        title: "Test IoT Article",
        abstract: "This is a test abstract for IoT research",
        keywords: ["IoT", "sensors", "connectivity"],
        category: "IoT Technology",
        authorId: "test-author-id",
      }

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(articleData),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })
})
