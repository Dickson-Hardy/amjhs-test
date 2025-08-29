import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        message: "Valid email is required" 
      }, { status: 400 })
    }

    // In production, this would store the email in a database
    // or send it to an email service for maintenance notifications
    logger.info(`Maintenance notification signup: ${email}`)
    
    // Simulate storing the email for notifications
    // await db.maintenanceNotifications.create({ email, createdAt: new Date() })
    
    return NextResponse.json({ 
      success: true, 
      message: "You'll be notified when maintenance is complete" 
    })
  } catch (error) {
    logger.error("Maintenance subscription error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to subscribe for notifications" 
    }, { status: 500 })
  }
}

export async function GET() {
  // Return maintenance status information
  const maintenanceInfo = {
    isMaintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    startTime: process.env.MAINTENANCE_START_TIME || null,
    endTime: process.env.MAINTENANCE_END_TIME || null,
    reason: process.env.MAINTENANCE_REASON || "System maintenance",
    estimatedDuration: process.env.MAINTENANCE_DURATION || "2-4 hours"
  }
  
  return NextResponse.json(maintenanceInfo)
}
