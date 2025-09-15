import { NextResponse } from "next/server"

// Mock articles data matching the current-issue page
const mockArticles = [
  {
    id: "1",
    title: "Machine Learning Applications in Predictive Medicine: A Comprehensive Review",
    authors: ["Dr. Sarah Chen", "Prof. Michael Rodriguez", "Dr. Amy Watson"],
    doi: "1:001",
    type: "Review Article",
    abstract: "This comprehensive review examines the current state and future potential of machine learning applications in predictive medicine, covering diagnostic algorithms, treatment optimization, and patient outcome prediction.",
    publishedDate: "2024-02-15",
    pages: "1-18",
    keywords: ["Machine Learning", "Predictive Medicine", "Healthcare AI", "Medical Diagnosis"],
    downloadUrl: "/papers/ml-predictive-medicine.pdf",
    citationCount: 45
  },
  {
    id: "2", 
    title: "IoT-Based Remote Patient Monitoring Systems: Design and Implementation",
    authors: ["Dr. James Liu", "Dr. Maria Santos", "Prof. David Kim"],
    doi: "1:002",
    type: "Original Research",
    abstract: "This study presents a novel IoT-based framework for continuous remote patient monitoring, demonstrating improved patient outcomes and reduced hospital readmission rates.",
    publishedDate: "2024-02-10",
    pages: "19-32",
    keywords: ["Internet of Things", "Remote Monitoring", "Patient Care", "Healthcare Technology"],
    downloadUrl: "/papers/iot-patient-monitoring.pdf",
    citationCount: 23
  },
  {
    id: "3",
    title: "Blockchain Technology in Healthcare Data Security: Challenges and Solutions", 
    authors: ["Prof. Elena Petrov", "Dr. Ahmed Hassan", "Dr. Jennifer Chang"],
    doi: "1:003",
    type: "Original Research",
    abstract: "An investigation into the application of blockchain technology for securing healthcare data, addressing privacy concerns, interoperability challenges, and regulatory compliance.",
    publishedDate: "2024-02-05",
    pages: "33-48",
    keywords: ["Blockchain", "Healthcare Security", "Data Privacy", "Medical Records"],
    downloadUrl: "/papers/blockchain-healthcare-security.pdf",
    citationCount: 31
  },
  {
    id: "4",
    title: "Editorial: Emerging Technologies in Modern Healthcare - Opportunities and Ethical Considerations",
    authors: ["Dr. Robert Thompson", "Prof. Lisa Anderson"],
    doi: "1:004", 
    type: "Editorial",
    abstract: "This editorial discusses the rapid adoption of emerging technologies in healthcare, highlighting both the tremendous opportunities for improving patient care and the ethical considerations that must be addressed.",
    publishedDate: "2024-02-01",
    pages: "49-52",
    keywords: ["Healthcare Technology", "Medical Ethics", "Digital Health", "Innovation"],
    downloadUrl: "/papers/editorial-emerging-tech.pdf",
    citationCount: 12
  }
]

const mockIssue = {
  id: "issue-1",
  title: "Volume 1, Issue 1",
  number: 1,
  description: "Inaugural issue featuring cutting-edge research in healthcare technology and medical innovation",
  publishedDate: "2024-02-15",
  coverImage: "/issue-covers/vol1-issue1.jpg",
  status: "published",
  specialIssue: false,
  guestEditors: null,
  articleCount: mockArticles.length,
  totalPages: 52
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      issue: mockIssue,
      articles: mockArticles,
    })
  } catch (error) {
    console.error("Error fetching demo current issue data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch demo current issue data",
      },
      { status: 500 }
    )
  }
}