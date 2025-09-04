import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test the messaging API endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    
    const response = await fetch(`${baseUrl}/api/messaging`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Messaging API test completed",
      apiResponse: data,
      status: response.status
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}