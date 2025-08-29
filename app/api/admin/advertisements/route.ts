import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { advertisements } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"

// GET /api/admin/advertisements - Get all advertisements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position")
    const activeOnly = searchParams.get("active") === "true"

    let whereConditions: unknown[] = []

    if (position) {
      whereConditions.push(eq(advertisements.position, position))
    }

    if (activeOnly) {
      whereConditions.push(eq(advertisements.isActive, true))
      whereConditions.push(gt(advertisements.expiresAt, new Date()))
    }

    const ads = whereConditions.length > 0 
      ? await db.select().from(advertisements).where(and(...whereConditions))
      : await db.select().from(advertisements)

    return NextResponse.json({
      success: true,
      advertisements: ads,
    })
  } catch (error) {
    logger.error("Error fetching advertisements:", error)
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    )
  }
}

// POST /api/admin/advertisements - Create new advertisement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as unknown).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, imageUrl, targetUrl, position, expiresAt } = body

    if (!title || !imageUrl || !position) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const [newAd] = await db.insert(advertisements).values({
      title,
      imageUrl,
      targetUrl,
      position,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: (session.user as unknown).id,
    }).returning()

    return NextResponse.json({
      success: true,
      advertisement: newAd,
    })
  } catch (error) {
    logger.error("Error creating advertisement:", error)
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/advertisements - Update advertisement
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as unknown).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, imageUrl, targetUrl, position, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json(
        { error: "Advertisement ID is required" },
        { status: 400 }
      )
    }

    const updateData: unknown = { updatedAt: new Date() }
    
    if (title !== undefined) updateData.title = title
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl
    if (position !== undefined) updateData.position = position
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt)

    const [updatedAd] = await db.update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id))
      .returning()

    if (!updatedAd) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      advertisement: updatedAd,
    })
  } catch (error) {
    logger.error("Error updating advertisement:", error)
    return NextResponse.json(
      { error: "Failed to update advertisement" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/advertisements - Delete advertisement
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as unknown).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Advertisement ID is required" },
        { status: 400 }
      )
    }

    const [deletedAd] = await db.delete(advertisements)
      .where(eq(advertisements.id, id))
      .returning()

    if (!deletedAd) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    })
  } catch (error) {
    logger.error("Error deleting advertisement:", error)
    return NextResponse.json(
      { error: "Failed to delete advertisement" },
      { status: 500 }
    )
  }
}
