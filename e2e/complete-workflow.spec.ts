// e2e/complete-workflow.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Complete Journal Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete user registration and login flow', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Register')
    
    // Fill registration form
    await page.fill('[name="name"]', 'Dr. Test User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePassword123!')
    await page.fill('[name="affiliation"]', 'Test University')
    await page.selectOption('[name="role"]', 'author')
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Should redirect to verification page
    await expect(page).toHaveURL(/.*verify/)
    await expect(page.locator('text=Check your email')).toBeVisible()
    
    // Simulate email verification (in real test, you'd check email)
    // For now, navigate directly to login
    await page.goto('/auth/signin')
    
    // Login with registered credentials
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('complete article submission workflow', async ({ page }) => {
    // Login first (assume user exists)
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'author@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to submission
    await page.goto('/submit')
    
    // Fill article details
    await page.fill('[name="title"]', 'Revolutionary Cardiovascular Treatment Research')
    await page.fill('[name="abstract"]', 'This groundbreaking research explores innovative approaches to cardiovascular treatment...')
    await page.fill('[name="keywords"]', 'cardiovascular, treatment, research, innovation')
    await page.selectOption('[name="category"]', 'Clinical Medicine & Patient Care')
    
    // Add authors
    await page.click('text=Add Author')
    await page.fill('[name="authors.0.name"]', 'Dr. Co-Author')
    await page.fill('[name="authors.0.email"]', 'coauthor@example.com')
    
    // Upload manuscript file
    await page.setInputFiles('[name="manuscript"]', 'test-files/sample-manuscript.pdf')
    
    // Fill content
    await page.fill('[name="content"]', 'Detailed article content goes here...')
    
    // Submit article
    await page.click('button[type="submit"]')
    
    // Should see success message
    await expect(page.locator('text=Submission successful')).toBeVisible()
    await expect(page.locator('text=Your article has been submitted')).toBeVisible()
    
    // Should redirect to dashboard with submission
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Revolutionary Cardiovascular Treatment')).toBeVisible()
  })

  test('reviewer workflow - accept and complete review', async ({ page }) => {
    // Login as reviewer
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'reviewer@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to reviewer dashboard
    await page.goto('/reviewer')
    
    // Should see pending review invitations
    await expect(page.locator('text=Pending Review Invitations')).toBeVisible()
    
    // Accept review invitation
    await page.click('text=Accept Review')
    
    // Navigate to review form
    await page.click('text=Start Review')
    
    // Fill review form
    await page.selectOption('[name="recommendation"]', 'accept')
    await page.fill('[name="comments"]', 'This is an excellent piece of research. The methodology is sound and the results are significant.')
    await page.fill('[name="confidentialComments"]', 'No major issues found. Minor grammatical corrections suggested.')
    await page.click('[name="rating"][value="4"]')
    
    // Submit review
    await page.click('button[type="submit"]')
    
    // Should see confirmation
    await expect(page.locator('text=Review submitted successfully')).toBeVisible()
    
    // Should update dashboard
    await page.goto('/reviewer')
    await expect(page.locator('text=Completed Reviews')).toBeVisible()
  })

  test('editor workflow - make editorial decision', async ({ page }) => {
    // Login as editor
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'editor@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to editor dashboard
    await page.goto('/editor')
    
    // Should see articles pending decision
    await expect(page.locator('text=Articles Pending Decision')).toBeVisible()
    
    // Click on article to review
    await page.click('text=Revolutionary Cardiovascular Treatment')
    
    // Should see article details and reviews
    await expect(page.locator('text=Reviewer Comments')).toBeVisible()
    await expect(page.locator('text=Recommendation: Accept')).toBeVisible()
    
    // Make editorial decision
    await page.selectOption('[name="decision"]', 'accepted')
    await page.fill('[name="editorComments"]', 'Excellent research contribution. Ready for publication.')
    await page.fill('[name="scheduledPublicationDate"]', '2025-08-15')
    
    // Submit decision
    await page.click('button[type="submit"]')
    
    // Should see confirmation
    await expect(page.locator('text=Editorial decision submitted')).toBeVisible()
    
    // Article should move to accepted articles
    await expect(page.locator('text=Articles Accepted for Publication')).toBeVisible()
  })

  test('search functionality workflow', async ({ page }) => {
    // Test basic search
    await page.fill('[placeholder="Search articles..."]', 'cardiovascular')
    await page.press('[placeholder="Search articles..."]', 'Enter')
    
    // Should show search results
    await expect(page.locator('text=Search Results')).toBeVisible()
    await expect(page.locator('.search-result')).toHaveCount.greaterThan(0)
    
    // Test search suggestions
    await page.fill('[placeholder="Search articles..."]', 'cardio')
    await expect(page.locator('.search-suggestions')).toBeVisible()
    await expect(page.locator('text=cardiovascular')).toBeVisible()
    
    // Click on suggestion
    await page.click('text=cardiovascular research')
    await expect(page.locator('text=Search Results')).toBeVisible()
    
    // Test advanced search
    await page.click('text=Advanced Search')
    await page.fill('[name="query"]', 'treatment')
    await page.selectOption('[name="category"]', 'Clinical Medicine & Patient Care')
    await page.fill('[name="dateFrom"]', '2024-01-01')
    await page.fill('[name="dateTo"]', '2025-12-31')
    
    await page.click('button[type="submit"]')
    
    // Should show filtered results
    await expect(page.locator('text=Advanced Search Results')).toBeVisible()
    await expect(page.locator('.filter-applied')).toBeVisible()
  })

  test('admin analytics dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to admin dashboard
    await page.goto('/admin')
    
    // Should see analytics overview
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
    await expect(page.locator('text=Total Users')).toBeVisible()
    await expect(page.locator('text=Total Articles')).toBeVisible()
    await expect(page.locator('text=Page Views')).toBeVisible()
    
    // Test time range filter
    await page.selectOption('[name="timeRange"]', '90d')
    await expect(page.locator('text=Last 90 days')).toBeVisible()
    
    // Should update charts
    await page.waitForSelector('.recharts-wrapper')
    
    // Test export functionality
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/analytics-.*\.csv/)
    
    // Test user management
    await page.click('text=User Management')
    await expect(page.locator('text=Manage Users')).toBeVisible()
    
    // Should see user list
    await expect(page.locator('.user-table')).toBeVisible()
    await expect(page.locator('text=Dr. Test User')).toBeVisible()
  })

  test('notification system workflow', async ({ page }) => {
    // Login as user
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'author@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should see notification bell
    await expect(page.locator('.notification-bell')).toBeVisible()
    
    // Click on notifications
    await page.click('.notification-bell')
    
    // Should see notification dropdown
    await expect(page.locator('.notification-dropdown')).toBeVisible()
    await expect(page.locator('text=Your article has been accepted')).toBeVisible()
    
    // Mark notification as read
    await page.click('.notification-item:first-child')
    
    // Should navigate to relevant page
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Test in-app messaging
    await page.click('text=Messages')
    await expect(page.locator('text=Communication Center')).toBeVisible()
    
    // Send message to editor
    await page.click('text=New Message')
    await page.selectOption('[name="recipient"]', 'editor@example.com')
    await page.fill('[name="subject"]', 'Question about review process')
    await page.fill('[name="message"]', 'I have a question about the review timeline.')
    await page.click('button[type="submit"]')
    
    // Should see confirmation
    await expect(page.locator('text=Message sent successfully')).toBeVisible()
  })

  test('responsive design and mobile workflow', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should show mobile navigation
    await expect(page.locator('.mobile-menu-button')).toBeVisible()
    
    // Test mobile menu
    await page.click('.mobile-menu-button')
    await expect(page.locator('.mobile-menu')).toBeVisible()
    
    // Test mobile search
    await page.fill('[placeholder="Search..."]', 'research')
    await page.press('[placeholder="Search..."]', 'Enter')
    
    // Should work on mobile
    await expect(page.locator('text=Search Results')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Navigation should adapt
    await expect(page.locator('.desktop-menu')).toBeVisible()
    
    // Test submission form on tablet
    await page.goto('/submit')
    await expect(page.locator('form')).toBeVisible()
    
    // Form should be responsive
    const formWidth = await page.locator('form').boundingBox()
    expect(formWidth?.width).toBeLessThan(768)
  })

  test('accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Should navigate via keyboard
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test screen reader compatibility
    const title = await page.locator('h1').textContent()
    expect(title).toBeTruthy()
    
    // Test alt text on images
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Test form labels
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        expect(label).toBeGreaterThan(0)
      }
    }
    
    // Test color contrast (basic check)
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      }
    })
    
    expect(bodyStyles.color).toBeTruthy()
    expect(bodyStyles.backgroundColor).toBeTruthy()
  })
})
