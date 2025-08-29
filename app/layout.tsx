import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ModernErrorBoundary from "@/components/modern-error-boundary"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import ConditionalLayout from "@/components/conditional-layout"
import RegisterServiceWorker from "@/app/register-sw"
import SiteFooter from "@/components/site-footer"

// Initialize backup scheduler in production
if (typeof window === 'undefined') {
  import('@/lib/backup').then(({ initializeBackupScheduler }) => {
    initializeBackupScheduler()
  }).catch(console.error)
}

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'),
  title: {
    default: "AJRS - Academic Journal Research System",
    template: "%s | AJRS",
  },
  description:
    "A comprehensive academic journal platform supporting multidisciplinary research across all fields of study including sciences, humanities, engineering, and social sciences",
  keywords: [
    "academic research",
    "multidisciplinary journal",
    "peer review",
    "scholarly publishing",
    "research platform",
    "academic journal",
    "sciences",
    "humanities",
    "engineering",
    "social sciences",
  ],
  authors: [{ name: "AJRS Editorial Team" }],
  creator: "AJRS",
  publisher: "Academic Journal Research System",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/logo-amhsj.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "AJRS",
    title: "AJRS - Academic Journal Research System",
    description:
      "A comprehensive multidisciplinary academic journal platform supporting research across all fields",
    images: [
      {
        url: "/logo-amhsj.png",
        width: 512,
        height: 512,
        alt: "AJRS - Academic Journal Research System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AJRS - Academic Journal Research System",
    description: "Comprehensive academic journal platform for multidisciplinary research",
    images: ["/logo-amhsj.png"],
    creator: "@ajrs_journal",
  },
  verification: {
    google: "your-google-verification-code",
  },
  manifest: "/manifest.json",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ModernErrorBoundary>
          <Providers>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <Toaster />
            <RegisterServiceWorker />
          </Providers>
        </ModernErrorBoundary>
      </body>
    </html>
  )
}
