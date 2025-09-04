import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const available = searchParams.get("available")
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      affiliation: users.affiliation,
      expertise: users.expertise,
      specializations: users.specializations,
      isActive: users.isActive,
      // Mock workload data - in a real system this would come from assignments table
      currentWorkload: sql<number>`CASE WHEN ${users.role} = 'associate-editor' THEN FLOOR(RANDOM() * 8) ELSE 0 END`,
      maxWorkload: sql<number>`CASE WHEN ${users.role} = 'associate-editor' THEN 10 ELSE 0 END`,
    }).from(users)

    // Apply role filter
    if (role) {
      query = query.where(eq(users.role, role))
    }

    // Apply active/available filter
    if (available === "true") {
      query = query.where(and(
        eq(users.isActive, true),
        // In a real system, you'd also check current workload vs max workload
      ))
    }

    // Apply limit
    query = query.limit(limit)

    const result = await query

    // Process the results to add availability status
    const processedUsers = result.map(user => ({
      ...user,
      expertise: user.expertise || [],
      specializations: user.specializations || [],
      isAvailable: user.isActive && (user.currentWorkload < user.maxWorkload),
      currentWorkload: user.currentWorkload || 0,
      maxWorkload: user.maxWorkload || 10
    }))

    logInfo("Users fetched successfully", {
      operation: "fetchUsers",
      role,
      available,
      count: processedUsers.length,
      requestedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      users: processedUsers,
      count: processedUsers.length
    })

  } catch (error) {
    logError("Error fetching users", {
      operation: "fetchUsers",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}