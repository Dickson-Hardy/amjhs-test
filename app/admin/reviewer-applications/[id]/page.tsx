"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RouteGuard from "@/components/route-guard"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  BookOpen, 
  Award, 
  Mail,
  Phone,
  Building,
  Calendar,
  FileText
} from "lucide-react"

interface ReviewerApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  orcid: string
  currentPosition: string
  institution: string
  department: string
  yearsExperience: string
  primarySpecialty: string
  secondarySpecialties: string[]
  researchAreas: string
  highestDegree: string
  graduationYear: string
  publications: string
  previousReviewExperience: string
  reviewFrequency: string
  conflictInstitutions: string
  languageProficiency: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedDate: string
}

export default function ReviewerApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const applicationId = params.id as string
  
  const [application, setApplication] = useState<ReviewerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate with mock data
      const mockApplication: ReviewerApplication = {
        id: applicationId,
        firstName: "Dr. Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@university.edu",
        phone: "+1 (555) 123-4567",
        orcid: "0000-0002-1825-0097",
        currentPosition: "Associate Professor of Cardiology",
        institution: "University Medical Center",
        department: "Department of Internal Medicine",
        yearsExperience: "10-15 years",
        primarySpecialty: "Cardiology",
        secondarySpecialties: ["Internal Medicine", "Public Health"],
        researchAreas: "Cardiovascular epidemiology, heart failure outcomes research, preventive cardiology in low-resource settings",
        highestDegree: "MD-PhD",
        graduationYear: "2008",
        publications: "Lead author on 45 peer-reviewed publications, including 12 first-author papers in high-impact journals (Circulation, JACC, European Heart Journal). Recent focus on cardiovascular disease in African populations.",
        previousReviewExperience: "Regular reviewer for Circulation, Heart, and African Heart Journal. Completed approximately 25 reviews in the past 3 years.",
        reviewFrequency: "4-6/year",
        conflictInstitutions: "Cardiology Associates of America (consulting), HeartTech Medical Devices (advisory board)",
        languageProficiency: ["English", "French"],
        status: "pending",
        submittedDate: "2025-01-05T10:30:00Z"
      }
      
      setApplication(mockApplication)
    } catch (error) {
      logger.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/reviewer-applications/${applicationId}/approve`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setApplication(prev => prev ? { ...prev, status: 'approved' } : null)
        alert('Reviewer application approved successfully!')
      } else {
        alert('Failed to approve application')
      }
    } catch (error) {
      logger.error('Error approving application:', error)
      alert('Error approving application')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/reviewer-applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      
      if (response.ok) {
        setApplication(prev => prev ? { ...prev, status: 'rejected' } : null)
        alert('Reviewer application rejected.')
      } else {
        alert('Failed to reject application')
      }
    } catch (error) {
      logger.error('Error rejecting application:', error)
      alert('Error rejecting application')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["admin", "editor"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application...</p>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (!application) {
    return (
      <RouteGuard allowedRoles={["admin", "editor"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Alert className="max-w-md">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Application not found or access denied.
            </AlertDescription>
          </Alert>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {application.firstName} {application.lastName}
                </h1>
                <p className="text-gray-600 mt-1">
                  Reviewer Application • Submitted {new Date(application.submittedDate).toLocaleDateString()}
                </p>
              </div>
              <Badge 
                className={
                  application.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : application.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {application.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="mb-6 flex gap-3">
              <Button 
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Application
              </Button>
              <Button 
                variant="outline"
                onClick={handleReject}
                disabled={processing}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Application
              </Button>
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{application.firstName} {application.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {application.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {application.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ORCID ID</label>
                    <p className="text-gray-900">{application.orcid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Position</label>
                  <p className="text-gray-900">{application.currentPosition}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Institution</label>
                    <p className="text-gray-900">{application.institution}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Department</label>
                    <p className="text-gray-900">{application.department}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Years of Experience</label>
                  <p className="text-gray-900">{application.yearsExperience}</p>
                </div>
              </CardContent>
            </Card>

            {/* Expertise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Areas of Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Primary Specialty</label>
                  <p className="text-gray-900">
                    <Badge variant="secondary">{application.primarySpecialty}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Secondary Specialties</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {application.secondarySpecialties.map((specialty) => (
                      <Badge key={specialty} variant="outline">{specialty}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Research Areas</label>
                  <p className="text-gray-900 mt-1">{application.researchAreas}</p>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Highest Degree</label>
                    <p className="text-gray-900">{application.highestDegree}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {application.graduationYear}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Recent Publications</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-line">{application.publications}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Previous Review Experience</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-line">{application.previousReviewExperience}</p>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Review Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Preferred Review Frequency</label>
                  <p className="text-gray-900">{application.reviewFrequency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Language Proficiency</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {application.languageProficiency.map((language) => (
                      <Badge key={language} variant="outline">{language}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Conflict of Interest Institutions</label>
                  <p className="text-gray-900 mt-1">{application.conflictInstitutions || 'None declared'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
