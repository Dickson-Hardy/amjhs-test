import { NextRequest, NextResponse } from "next/server"
import { AdvancedSearch } from "@/lib/search"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      query: searchParams.get("q") || "",
      author: searchParams.get("author") || undefined,
      category: searchParams.get("category") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      keywords: searchParams.get("keywords")?.split(",").filter(Boolean) || [],
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100), // Max 100 results
      offset: Math.max(parseInt(searchParams.get("offset") || "0"), 0)
    }

    const result = await AdvancedSearch.advancedSearchArticles(filters)
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/search/advanced" })
    return NextResponse.json(
      { success: false, error: "Failed to perform advanced search" },
      { status: 500 }
    )
  }
}
