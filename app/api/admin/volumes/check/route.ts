import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { volumes } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

/**
 * GET /api/admin/volumes/check
 * Check what volumes exist in the database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or Editor access required" },
        { status: 403 }
      )
    }

    // Get all volumes with basic info
    const allVolumes = await db
      .select({
        id: volumes.id,
        number: volumes.number,
        year: volumes.year,
        title: volumes.title,
        status: volumes.status,
        createdAt: volumes.createdAt,
        updatedAt: volumes.updatedAt
      })
      .from(volumes)
      .orderBy(desc(volumes.year), desc(volumes.number))

    // Get volume count by status
    const statusCounts = await db
      .select({
        status: volumes.status,
        count: sql<number>`count(*)`
      })
      .from(volumes)
      .groupBy(volumes.status)

    return NextResponse.json({
      success: true,
      volumes: allVolumes,
      summary: {
        total: allVolumes.length,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = Number(item.count)
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error) {
    console.error("Error checking volumes:", error)
    return NextResponse.json(
      { error: "Failed to check volumes" },
      { status: 500 }
    )
  }
}