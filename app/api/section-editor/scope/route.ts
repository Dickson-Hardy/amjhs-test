import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has section editor role or higher
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get user's section from their profile
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    const userSection = user[0]?.specializations?.[0] || "General"

    // Define section scopes based on specialization
    const sectionScopes: Record<string, any> = {
      "Cardiology": {
        name: "Cardiology",
        description: "Cardiovascular medicine including surgical and non-surgical interventions, cardiac imaging, and preventive cardiology",
        keywords: ["cardiology", "cardiac surgery", "heart disease", "cardiovascular", "interventional", "cardiac imaging", "heart failure"],
        guidelines: "Submissions should focus on clinical or research aspects of cardiovascular medicine, including novel treatments, diagnostic techniques, and preventive strategies.",
        acceptance_criteria: [
          "Novel findings or approaches in cardiovascular medicine",
          "Strong methodological design with appropriate controls",
          "Clinical relevance and potential impact on patient care",
          "Appropriate statistical analysis and sample size",
          "Clear presentation of results with proper figures and tables",
          "Ethical approval for human studies"
        ]
      },
      "Computer Science": {
        name: "Computer Science",
        description: "Computational methods, algorithms, artificial intelligence, and software engineering applications",
        keywords: ["computer science", "algorithms", "artificial intelligence", "machine learning", "software engineering", "data science"],
        guidelines: "Submissions should present novel computational methods, algorithms, or applications with clear technical merit and innovation.",
        acceptance_criteria: [
          "Novel computational approaches or algorithms",
          "Rigorous experimental validation or theoretical proof",
          "Comparison with existing state-of-the-art methods",
          "Clear technical contribution and innovation",
          "Reproducible results with available code/data",
          "Practical applicability and impact"
        ]
      },
      "Biology": {
        name: "Biology",
        description: "Biological sciences including molecular biology, ecology, genetics, and evolutionary biology",
        keywords: ["biology", "molecular biology", "genetics", "ecology", "evolution", "cell biology", "biochemistry"],
        guidelines: "Submissions should advance our understanding of biological systems through experimental or theoretical approaches.",
        acceptance_criteria: [
          "Significant biological findings or discoveries",
          "Rigorous experimental design and controls",
          "Appropriate statistical analysis of biological data",
          "Clear biological significance and implications",
          "Reproducible methodology and results",
          "Ethical approval for animal studies if applicable"
        ]
      },
      "Physics": {
        name: "Physics",
        description: "Physical sciences including theoretical and experimental physics across all subfields",
        keywords: ["physics", "quantum mechanics", "thermodynamics", "electromagnetism", "optics", "particle physics"],
        guidelines: "Submissions should present novel physical phenomena, theories, or experimental techniques with clear scientific merit.",
        acceptance_criteria: [
          "Novel physical insights or phenomena",
          "Rigorous theoretical framework or experimental design",
          "Appropriate mathematical treatment and analysis",
          "Clear physical significance and implications",
          "Reproducible experimental results or verifiable theory",
          "Connection to broader physical principles"
        ]
      }
    }

    const sectionScope = sectionScopes[userSection] || {
      name: "General Sciences",
      description: "Multidisciplinary research across various scientific fields",
      keywords: ["science", "research", "methodology", "analysis", "innovation"],
      guidelines: "Submissions should present high-quality research with clear methodology and significant findings.",
      acceptance_criteria: [
        "Novel findings or approaches",
        "Strong methodological design",
        "Clear significance and impact",
        "Appropriate analysis and interpretation",
        "Reproducible results",
        "Ethical considerations addressed"
      ]
    }

    return NextResponse.json(sectionScope)

  } catch (error) {
    logger.error("Error fetching section scope:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
