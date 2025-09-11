import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { volumes, articles } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'

/**
 * GET /api/public/volumes/[number]
 * Get public volume information with all published articles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const volumeNumber = params.number

    // Get volume information
    const volume = await db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        description: volumes.description,
        coverImage: volumes.coverImage,
        publishedDate: volumes.publishedDate,
        status: volumes.status,
        metadata: volumes.metadata
      })
      .from(volumes)
      .where(and(
        eq(volumes.number, volumeNumber),
        eq(volumes.status, 'published')
      ))
      .limit(1)

    if (volume.length === 0) {
      return NextResponse.json(
        { error: "Volume not found or not published" },
        { status: 404 }
      )
    }

    const volumeData = volume[0]

    // Get all published articles in this volume
    const volumeArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        keywords: articles.keywords,
        category: articles.category,
        doi: articles.doi,
        volume: articles.volume,
        issue: articles.issue,
        pages: articles.pages,
        publishedDate: articles.publishedDate,
        submittedDate: articles.submittedDate,
        authorId: articles.authorId,
        coAuthors: articles.coAuthors,
        views: articles.views,
        downloads: articles.downloads,
        citations: articles.citations,
        files: articles.files
      })
      .from(articles)
      .where(and(
        eq(articles.volume, volumeNumber),
        eq(articles.status, 'published')
      ))
      .orderBy(articles.publishedDate, articles.submittedDate)

    // Calculate volume statistics
    const statistics = {
      totalArticles: volumeArticles.length,
      totalViews: volumeArticles.reduce((sum, a) => sum + (a.views || 0), 0),
      totalDownloads: volumeArticles.reduce((sum, a) => sum + (a.downloads || 0), 0),
      totalCitations: volumeArticles.reduce((sum, a) => sum + (a.citations || 0), 0),
      categories: Array.from(new Set(volumeArticles.map(a => a.category))),
      pageRange: getPageRange(volumeArticles)
    }

    // Format articles for public display
    const formattedArticles = volumeArticles.map((article, index) => ({
      id: article.id,
      title: article.title,
      abstract: article.abstract,
      keywords: article.keywords || [],
      category: article.category,
      doi: article.doi,
      pages: article.pages,
      publishedDate: article.publishedDate,
      authors: formatAuthors(article.coAuthors || []),
      views: article.views || 0,
      downloads: article.downloads || 0,
      citations: article.citations || 0,
      articleNumber: index + 1,
      pdfUrl: getPdfUrl(article.files || []),
      publicUrl: `/article/${article.id}`,
      citationText: generateCitation(article, volumeData)
    }))

    return NextResponse.json({
      success: true,
      volume: {
        number: volumeData.number,
        year: volumeData.year,
        title: volumeData.title,
        description: volumeData.description,
        coverImage: volumeData.coverImage,
        publishedDate: volumeData.publishedDate,
        metadata: volumeData.metadata
      },
      articles: formattedArticles,
      statistics,
      publicUrl: `/archive/volume/${volumeNumber}`,
      downloadUrl: `/api/public/volumes/${volumeNumber}/download`,
      citationFormat: {
        apa: generateVolumeCitation(volumeData, 'apa'),
        mla: generateVolumeCitation(volumeData, 'mla'),
        chicago: generateVolumeCitation(volumeData, 'chicago')
      }
    })

  } catch (error) {
    console.error("Error fetching public volume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Helper function to format authors array
 */
function formatAuthors(coAuthors: any[]): string[] {
  if (!Array.isArray(coAuthors)) return []
  
  return coAuthors.map(author => {
    if (typeof author === 'string') return author
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`
    }
    return author.name || 'Unknown Author'
  })
}

/**
 * Helper function to get PDF URL from files array
 */
function getPdfUrl(files: any[]): string | null {
  if (!Array.isArray(files)) return null
  
  const pdfFile = files.find(file => 
    file.type === 'manuscript' || 
    file.name?.toLowerCase().includes('.pdf')
  )
  
  return pdfFile?.url || null
}

/**
 * Helper function to calculate page range for volume
 */
function getPageRange(articles: any[]): string | null {
  if (articles.length === 0) return null
  
  const pages = articles
    .map(a => a.pages)
    .filter(Boolean)
    .map(pageStr => {
      const parts = pageStr.split('-')
      return {
        start: parseInt(parts[0]) || 0,
        end: parseInt(parts[1] || parts[0]) || 0
      }
    })
    .filter(p => p.start > 0)
  
  if (pages.length === 0) return null
  
  const minPage = Math.min(...pages.map(p => p.start))
  const maxPage = Math.max(...pages.map(p => p.end))
  
  return `${minPage}-${maxPage}`
}

/**
 * Helper function to generate article citation
 */
function generateCitation(article: any, volume: any): string {
  const authors = formatAuthors(article.coAuthors || []).join(', ')
  const year = new Date(article.publishedDate || article.submittedDate).getFullYear()
  
  return `${authors} (${year}). ${article.title}. AMHSJ, ${volume.number}, ${article.pages || 'pp. 1-n'}. ${article.doi ? `https://doi.org/${article.doi}` : ''}`
}

/**
 * Helper function to generate volume citation
 */
function generateVolumeCitation(volume: any, format: 'apa' | 'mla' | 'chicago'): string {
  const year = volume.year
  const title = volume.title || `Volume ${volume.number}`
  
  switch (format) {
    case 'apa':
      return `AMHSJ Editorial Board (${year}). ${title}. Advances in Medicine and Health Sciences Journal, ${volume.number}.`
    case 'mla':
      return `AMHSJ Editorial Board. "${title}." Advances in Medicine and Health Sciences Journal, vol. ${volume.number}, ${year}.`
    case 'chicago':
      return `AMHSJ Editorial Board. "${title}." Advances in Medicine and Health Sciences Journal ${volume.number} (${year}).`
    default:
      return generateVolumeCitation(volume, 'apa')
  }
}