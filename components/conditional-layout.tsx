"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import SiteFooter from "@/components/site-footer"
import TawkToWidget from "@/components/tawk-to-widget"
import FloatingSupportButton from "@/components/floating-support-button"

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Routes that should not show header/footer (internal application routes)
  const isInternalRoute = pathname?.startsWith('/dashboard') || 
                         pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/editor') || 
                         pathname?.startsWith('/author') ||
                         pathname?.startsWith('/reviewer') ||
                         pathname?.startsWith('/submit')

  if (isInternalRoute) {
    // Clean layout for internal application pages
    return <>{children}</>
  }

  // Standard layout for public website pages
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <SiteFooter />
      <TawkToWidget />
      <FloatingSupportButton />
    </>
  )
}
