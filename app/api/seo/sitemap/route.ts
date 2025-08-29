import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logWarn, logError } from '@/lib/logger'

export async function GET() {
  try {
    let publishedArticles: unknown[] = []
    
    // Try to fetch articles with a timeout and fallback
    try {
      publishedArticles = await Promise.race([
        db
          .select({
            id: articles.id,
            title: articles.title,
            publishedDate: articles.publishedDate,
            updatedAt: articles.updatedAt,
          })
          .from(articles)
          .where(eq(articles.status, "published")),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]) as any[]
    } catch (dbError) {
      logWarn(`Database connection failed for sitemap generation, generating basic sitemap: ${dbError}`)
      // Continue with empty articles array to generate basic sitemap
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://amhsj.org"

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/archive</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/editorial-board</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  ${publishedArticles
    .map(
      (article) => `
  <url>
    <loc>${baseUrl}/article/${article.id}</loc>
    <lastmod>${(article.updatedAt || article.publishedDate || new Date()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("")}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "s-maxage=86400, stale-while-revalidate",
      },
    })
  } catch (error) {
    logError(error as Error, {
      context: 'GET /api/seo/sitemap'
    })
    return new NextResponse("Error generating sitemap", { status: 500 })
  }
}
