import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"""",
    reuseExistingServer: !process.env.CI,
  },
})
