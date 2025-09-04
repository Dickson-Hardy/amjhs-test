import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { issues } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch active call for papers from database (special issues)
    const callsForPapers = await db.select().from(issues).where(eq(issues.specialIssue, true))
    
    // If no active calls, return a default one
    if (callsForPapers.length === 0) {
      const defaultCall = {
        id: "1",
        title: "Call for Papers: AI and ML in Healthcare",
        description: "Special issue on artificial intelligence and machine learning applications in modern healthcare. We welcome original research, systematic reviews, and case studies that demonstrate innovative applications of AI/ML technologies in clinical practice, medical diagnosis, treatment planning, and patient care management.",
        deadline: "2024-03-15",
        status: 'published',
        distributionChannels: [
          "Journal Website", 
          "Social Media", 
          "Academic Networks", 
          "Conference Announcements",
          "Professional Societies",
          "University Mailing Lists"
        ],
        responsesReceived: 18,
        submissionGuidelines: "All submissions must include original research, proper ethical approvals, and adherence to CONSORT guidelines where applicable.",
        expectedSubmissions: 25,
        publishedDate: "2024-01-01",
        promotionStrategy: "Multi-channel approach including social media, academic conferences, and professional networks"
      }

      return NextResponse.json([defaultCall])
    }

    // Map database results to expected format
    const formattedCalls = callsForPapers.map(issue => ({
      id: issue.id,
      title: issue.title || "Special Issue Call for Papers",
      description: issue.description || "Call for papers for special issue",
      deadline: issue.publishedDate?.toISOString().split('T')[0] || "2024-12-31",
      status: issue.status === 'published' ? 'published' : 'draft',
      distributionChannels: ["Journal Website", "Academic Networks"],
      responsesReceived: 0, // Could be calculated from submissions
      submissionGuidelines: issue.description || "Follow standard submission guidelines",
      expectedSubmissions: 25,
      publishedDate: issue.createdAt?.toISOString().split('T')[0] || "2024-01-01",
      promotionStrategy: "Multi-channel academic promotion"
    }))

    return NextResponse.json(formattedCalls)
  } catch (error) {
    logError(error as Error, { context: 'guest-editor-call-for-papers' })
    return NextResponse.json(
      { error: 'Failed to fetch call for papers' },
      { status: 500 }
    )
  }
}
