import { NextRequest, NextResponse } from "next/server"
import { CustomAnalyticsService } from "@/lib/monitoring-production"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, userId, properties, category } = body

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event name is required" },
        { status: 400 }
      )
    }

    await CustomAnalyticsService.trackEvent({
      event,
      userId,
      properties,
      category: category || 'user',
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: "Event tracked successfully"
    })
  } catch (error: unknown) {
    logError(error, { context: 'POST /api/monitoring/analytics/events' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to track event"
    }, { status: 500 })
  }
}

// Batch event tracking
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: "Events array is required" },
        { status: 400 }
      )
    }

    if (events.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 events per batch" },
        { status: 400 }
      )
    }

    // Track all events
    const promises = events.map(event => 
      CustomAnalyticsService.trackEvent({
        ...event,
        timestamp: new Date(event.timestamp) || new Date()
      })
    )

    await Promise.allSettled(promises)

    return NextResponse.json({
      success: true,
      message: `Batch of ${events.length} events processed`
    })
  } catch (error: unknown) {
    logError(error, { context: 'PUT /api/monitoring/analytics/events' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to process batch events"
    }, { status: 500 })
  }
}
