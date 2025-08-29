import { test, expect } from "@playwright/test"

test.describe("Article Submission Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto("/login")
    await page.fill('[data-testid="email"]', "test@example.com")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')
  })

  test("should complete full article submission", async ({ page }) => {
    // Navigate to submission page
    await page.goto("/submit")
    await expect(page.locator("h1")).toContainText("Submit Your Article")

    // Step 1: Article Information
    await page.fill('[data-testid="article-title"]', "Advanced IoT Security Framework")
    await page.selectOption('[data-testid="category"]', "IoT Security")
    await page.fill(
      '[data-testid="abstract"]',
      "This research presents a novel security framework for IoT devices that addresses authentication, encryption, and intrusion detection in connected environments.",
    )
    await page.fill('[data-testid="keywords"]', "IoT Security, Authentication, Encryption, Intrusion Detection")
    await page.click('[data-testid="next-step"]')

    // Step 2: Authors & Affiliations
    await page.fill('[data-testid="author-first-name"]', "John")
    await page.fill('[data-testid="author-last-name"]', "Doe")
    await page.fill('[data-testid="author-email"]', "john.doe@university.edu")
    await page.fill('[data-testid="author-affiliation"]', "University of Technology")
    await page.click('[data-testid="next-step"]')

    // Step 3: Files & Documents
    await page.setInputFiles('[data-testid="manuscript-upload"]', "test-files/sample-manuscript.docx")
    await page.check('[data-testid="copyright-form"]')
    await page.check('[data-testid="cover-letter"]')
    await page.click('[data-testid="next-step"]')

    // Step 4: Review & Submit
    await page.check('[data-testid="terms-agreement"]')
    await page.click('[data-testid="submit-article"]')

    // Verify submission success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="submission-id"]')).toBeVisible()
  })

  test("should validate required fields", async ({ page }) => {
    await page.goto("/submit")

    // Try to proceed without filling required fields
    await page.click('[data-testid="next-step"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="abstract-error"]')).toBeVisible()
  })
})

test.describe("Search Functionality", () => {
  test("should search and filter articles", async ({ page }) => {
    await page.goto("/")

    // Use search functionality
    await page.fill('[data-testid="search-input"]', "IoT security")
    await page.click('[data-testid="search-button"]')

    // Should navigate to search results
    await expect(page).toHaveURL(/.*search.*/)
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()

    // Apply filters
    await page.selectOption('[data-testid="category-filter"]', "IoT Security")
    await page.selectOption('[data-testid="year-filter"]', "2024")

    // Results should update
    await expect(page.locator('[data-testid="results-count"]')).toBeVisible()
  })
})
