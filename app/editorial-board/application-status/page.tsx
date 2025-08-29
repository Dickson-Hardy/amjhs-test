"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Mail, 
  Calendar,
  User,
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  position: string
  status: string
  submitted_at: string
  reviewed_at?: string
  decision_at?: string
  first_name: string
  last_name: string
  email: string
  motivation_statement: string
  review_comments?: string
  decision_comments?: string
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending":
      return {
        label: "Application Submitted",
        description: "Your application is awaiting initial review",
        color: "bg-blue-500",
        progress: 25
      }
    case "technical_check":
      return {
        label: "Technical Check", 
        description: "Your application is undergoing technical and administrative review",
        color: "bg-purple-500",
        progress: 35
      }
    case "under_review":
      return {
        label: "Under Review", 
        description: "Our editorial committee is reviewing your application",
        color: "bg-yellow-500",
        progress: 65
      }
    case "approved":
      return {
        label: "Approved",
        description: "Congratulations! Your application has been approved",
        color: "bg-green-500", 
        progress: 100
      }
    case "rejected":
      return {
        label: "Not Selected",
        description: "Thank you for your interest. We encourage future applications",
        color: "bg-red-500",
        progress: 100
      }
    default:
      return {
        label: "Unknown",
        description: "Status unavailable",
        color: "bg-gray-500",
        progress: 0
      }
  }
}

const getTimelineSteps = (status: string, submittedAt: string, reviewedAt?: string, decisionAt?: string) => {
  const steps = [
    {
      title: "Application Submitted",
      description: "Application received and queued for review",
      date: submittedAt,
      completed: true,
      icon: FileText
    },
    {
      title: "Initial Review",
      description: "Editorial committee reviewing qualifications",
      date: reviewedAt,
      completed: status !== "pending",
      icon: User
    },
    {
      title: "Committee Decision",
      description: "Final decision made by editorial board",
      date: decisionAt,
      completed: status === "approved" || status === "rejected",
      icon: status === "approved" ? CheckCircle : AlertCircle
    }
  ]

  if (status === "approved") {
    steps.push({
      title: "Welcome & Onboarding",
      description: "Access to editorial portal and orientation",
      date: undefined,
      completed: false,
      icon: Mail
    })
  }

  return steps
}

export default function ApplicationStatusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("id")
  
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
      return
    }

    fetchApplication()
  }, [session, status, applicationId])

  const fetchApplication = async () => {
    try {
      const url = applicationId 
        ? `/api/editorial-board/apply?id=${applicationId}`
        : `/api/editorial-board/apply`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new AppError("Failed to fetch application")
      }

      const data = await response.json()
      
      if (applicationId) {
        setApplication(data.application)
      } else {
        // If no specific ID, show the most recent application
        const applications = data.applications || []
        if (applications.length > 0) {
          setApplication(applications[0])
        } else {
          setError("No applications found")
        }
      }
    } catch (err) {
      setError("Failed to load application data")
      logger.error("Fetch application error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading application status...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild>
              <Link href="/editorial-board">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editorial Board
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Applications Found</h2>
          <p className="text-gray-600 mb-6">
            You haven't submitted any editorial board applications yet.
          </p>
          <Button asChild>
            <Link href="/editorial-board/apply">
              Submit Application
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(application.status)
  const timelineSteps = getTimelineSteps(
    application.status,
    application.submitted_at,
    application.reviewed_at,
    application.decision_at
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/editorial-board">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editorial Board
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Application Status
            </h1>
            <p className="text-xl text-gray-600">
              Track your editorial board application progress
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {application.position.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </CardTitle>
                <CardDescription>
                  Application ID: {application.id}
                </CardDescription>
              </div>
              <Badge 
                className={`${statusInfo.color} text-white px-4 py-2 text-sm font-medium`}
              >
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{statusInfo.progress}%</span>
                </div>
                <Progress value={statusInfo.progress} className="h-2" />
              </div>
              <p className="text-gray-600">{statusInfo.description}</p>
              
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-900">Applicant</p>
                  <p className="text-sm text-gray-600">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(application.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{application.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Application Timeline
            </CardTitle>
            <CardDescription>
              Track the progress of your application through our review process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timelineSteps.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? "bg-green-100 text-green-600" 
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          step.completed ? "text-gray-900" : "text-gray-500"
                        }`}>
                          {step.title}
                        </p>
                        {step.date && (
                          <p className="text-sm text-gray-500">
                            {new Date(step.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className={`text-sm ${
                        step.completed ? "text-gray-600" : "text-gray-400"
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {(application.review_comments || application.decision_comments) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Review Feedback</CardTitle>
              <CardDescription>
                Comments from the editorial committee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.review_comments && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Review Comments</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{application.review_comments}</p>
                  </div>
                </div>
              )}
              
              {application.decision_comments && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Decision Comments</h3>
                  <div className={`border rounded-lg p-4 ${
                    application.status === "approved" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}>
                    <p className={`text-sm ${
                      application.status === "approved" 
                        ? "text-green-800" 
                        : "text-red-800"
                    }`}>
                      {application.decision_comments}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            {application.status === "pending" && (
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your application is in the queue for review. Our editorial committee reviews applications within 2-3 weeks. You'll receive an email update when the status changes.
                  </AlertDescription>
                </Alert>
                <div className="flex space-x-4">
                  <Button variant="outline" asChild>
                    <Link href="/editorial-board">
                      View Editorial Board
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {(application.status === "technical_check" || application.status === "under_review") && (
              <div className="space-y-4">
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    Your application is currently being reviewed by our editorial committee. This process typically takes 1-2 weeks. We'll notify you as soon as a decision is made.
                  </AlertDescription>
                </Alert>
                <div className="flex space-x-4">
                  <Button variant="outline" asChild>
                    <Link href="/contact">
                      Contact Editorial Office
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {application.status === "approved" && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Congratulations!</strong> Welcome to the AMHSJ Editorial Board. You should receive onboarding information and access credentials within 48 hours.
                  </AlertDescription>
                </Alert>
                <div className="flex space-x-4">
                  <Button asChild>
                    <Link href="/dashboard">
                      Access Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/editorial-board">
                      View Editorial Board
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {application.status === "rejected" && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Thank you for your interest in joining the AMHSJ Editorial Board. While we weren't able to offer you a position at this time, we encourage you to continue your excellent work and consider applying for future opportunities.
                  </AlertDescription>
                </Alert>
                <div className="flex space-x-4">
                  <Button variant="outline" asChild>
                    <Link href="/editorial-board">
                      View Current Board
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
