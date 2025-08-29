import { NextRequest, NextResponse } from "next/server"
import { CustomAnalyticsService } from "@/lib/monitoring-production"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, value, unit, metadata } = body

    if (!name || value === undefined) {
      return NextResponse.json(
        { success: false, error: "Metric name and value are required" },
        { status: 400 }
      )
    }

    await CustomAnalyticsService.trackPerformance({
      name,
      value: Number(value),
      unit: unit || 'ms',
      timestamp: new Date(),
      metadata
    })

    return NextResponse.json({
      success: true,
      message: "Performance metric tracked successfully"
    })
  } catch (error: unknown) {
    logError(error, { context: 'POST /api/monitoring/analytics/performance' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to track performance metric"
    }, { status: 500 })
  }
}

// Batch performance metrics
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { metrics } = body

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { success: false, error: "Metrics array is required" },
        { status: 400 }
      )
    }

    if (metrics.length > 50) {
      return NextResponse.json(
        { success: false, error: "Maximum 50 metrics per batch" },
        { status: 400 }
      )
    }

    // Track all metrics
    const promises = metrics.map(metric => 
      CustomAnalyticsService.trackPerformance({
        name: metric.name,
        value: Number(metric.value),
        unit: metric.unit || 'ms',
        timestamp: new Date(metric.timestamp) || new Date(),
        metadata: metric.metadata
      })
    )

    await Promise.allSettled(promises)

    return NextResponse.json({
      success: true,
      message: `Batch of ${metrics.length} metrics processed`
    })
  } catch (error: unknown) {
    logError(error, { context: 'PUT /api/monitoring/analytics/performance' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to process batch metrics"
    }, { status: 500 })
  }
}
