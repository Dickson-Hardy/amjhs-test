import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions, issues, volumes, articles, users } from "@/lib/db/schema"
import { eq, isNotNull } from "drizzle-orm"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "xlsx" // xlsx or csv
    const includeUnregistered = searchParams.get("includeUnregistered") === "true"

    // Build query
    const baseQuery = db
      .select({
        id: articles.id,
        title: articles.title,
        authorName: users.name,
        authorEmail: users.email,
        doi: articles.doi,
        doiRegistered: articles.doiRegistered,
        publishedAt: articles.publishedDate,
        status: articles.status,
        issueNumber: articles.issue,
        volumeNumber: articles.volume,
        volumeYear: volumes.year
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(volumes, eq(articles.volume, volumes.number.toString()))

    const articlesData = includeUnregistered 
      ? await baseQuery
      : await baseQuery.where(isNotNull(articles.doi))

    // Prepare data for export
    const exportData = articlesData.map(article => ({
      'Article ID': article.id,
      'Title': article.title,
      'Author': article.authorName,
      'Author Email': article.authorEmail,
      'DOI': article.doi || 'Not assigned',
      'DOI Registered': article.doiRegistered ? 'Yes' : 'No',
      'Status': article.status,
      'Published Date': article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : 'Not published',
      'Volume': article.volumeNumber || 'Not assigned',
      'Issue': article.issueNumber || 'Not assigned',
      'Year': article.volumeYear || 'Not assigned'
    }))

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="doi-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Generate Excel
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length))
      }))
      worksheet['!cols'] = colWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, 'DOI Report')
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="doi-report-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

  } catch (error) {
    logger.error("Error generating DOI report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
