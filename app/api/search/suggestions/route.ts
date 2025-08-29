import { type NextRequest, NextResponse } from "next/server"
import { AdvancedSearch } from "@/lib/search"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, suggestions: [] })
    }

    const result = await AdvancedSearch.getSearchSuggestions(query)
    return NextResponse.json(result)
  } catch (error) {
    logError(error as Error, { endpoint: "/api/search/suggestions" })
    return NextResponse.json({ success: false, error: "Failed to get suggestions" }, { status: 500 })
  }
}
