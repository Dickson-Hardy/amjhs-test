import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

// SEO settings table (add to main schema)
export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  page: text("page").notNull().unique(),
  title: text("title"),
  description: text("description"),
  keywords: text("keywords"),
  ogImage: text("og_image"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page")

    if (page) {
      const [settings] = await db.select().from(seoSettings).where(eq(seoSettings.page, page)).limit(1)

      return NextResponse.json({
        success: true,
        settings: settings || { page, title: "", description: "", keywords: "", ogImage: "" },
      })
    }

    const allSettings = await db.select().from(seoSettings)

    return NextResponse.json({
      success: true,
      settings: allSettings,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/seo" })
    return NextResponse.json({ success: false, error: "Failed to fetch SEO settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { page, title, description, keywords, ogImage } = await request.json()

    const [updatedSettings] = await db
      .insert(seoSettings)
      .values({
        page,
        title,
        description,
        keywords,
        ogImage,
      })
      .onConflictDoUpdate({
        target: seoSettings.page,
        set: {
          title,
          description,
          keywords,
          ogImage,
          updatedAt: new Date(),
        },
      })
      .returning()

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/seo PUT" })
    return NextResponse.json({ success: false, error: "Failed to update SEO settings" }, { status: 500 })
  }
}
