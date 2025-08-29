"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Users, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/components/toast-provider"

interface Application {
  application: {
    id: string
    userId: string
    requestedRole: string
    currentRole: string
    status: string
    applicationData: unknown
    submittedAt: string
  }
  user: {
    id: string
    name: string
    email: string
    affiliation: string
    orcid: string
    bio: string
    profileCompleteness: number
  }
  qualifications: unknown[]
  publications: unknown[]
  references: unknown[]
}

export default function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [processingReview, setProcessingReview] = useState(false)
  const [currentStatus, setCurrentStatus] = useState("pending")
  const [currentRole, setCurrentRole] = useState("all")
  
  const { success, error } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [currentStatus, currentRole])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: currentStatus,
        ...(currentRole !== "all" && { role: currentRole })
      })
      
      const response = await fetch(`/api/admin/applications?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setApplications(data.applications)
      } else {
        error("Failed to fetch applications", data.error)
      }
    } catch (err) {
      error("Failed to fetch applications", "Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedApplication || !reviewAction) return

    setProcessingReview(true)
    try {
      const response = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApplication.application.id,
          action: reviewAction,
          reviewNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        success(
          "Application Processed",
          `Application ${reviewAction}d successfully`
        )
        setShowReviewDialog(false)
        setSelectedApplication(null)
        setReviewNotes("")
        setReviewAction(null)
        fetchApplications()
      } else {
        error("Failed to process application", data.error)
      }
    } catch (err) {
      error("Failed to process application", "Network error")
    } finally {
      setProcessingReview(false)
    }
  }

  const openReviewDialog = (application: Application, action: "approve" | "reject") => {
    setSelectedApplication(application)
    setReviewAction(action)
    setShowReviewDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "under_review":
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><Eye className="h-3 w-3 mr-1" />Under Review</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant="secondary" className="capitalize">
        {role}
      </Badge>
    )
  }

  if (loading) {
    return <div>Loading applications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div>
              <Label>Status</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={currentRole} onValueChange={setCurrentRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No applications found for the selected filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <ApplicationCard 
              key={app.application.id} 
              application={app}
              onReview={openReviewDialog}
            />
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Application
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && (
                <>
                  Review application from {selectedApplication.user.name} for {selectedApplication.application.requestedRole} role.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <ApplicationDetails application={selectedApplication} />
              
              <div>
                <Label htmlFor="reviewNotes">
                  {reviewAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason"}
                </Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === "approve" 
                      ? "Any additional notes for the applicant..."
                      : "Please provide a reason for rejection..."
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReview}
              disabled={processingReview || (reviewAction === "reject" && !reviewNotes.trim())}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {processingReview ? "Processing..." : reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApplicationCard({ 
  application, 
  onReview 
}: { 
  application: Application
  onReview: (app: Application, action: "approve" | "reject") => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{application.user.name}</span>
              <Badge variant="secondary" className="capitalize">
                {application.application.requestedRole}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>{application.user.email}</span>
              </div>
              {application.user.affiliation && (
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{application.user.affiliation}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600">
              {application.user.profileCompleteness}% Complete
            </Badge>
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <Clock className="h-3 w-3 mr-1" />
              {application.application.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {application.user.bio && (
            <p className="text-gray-700 text-sm">{application.user.bio}</p>
          )}

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showDetails ? "Hide" : "View"} Details
            </Button>
            
            {application.application.status === "pending" && (
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onReview(application, "reject")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onReview(application, "approve")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>

          {showDetails && <ApplicationDetails application={application} />}
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationDetails({ application }: { application: Application }) {
  return (
    <Tabs defaultValue="qualifications" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
        <TabsTrigger value="publications">Publications</TabsTrigger>
        <TabsTrigger value="references">References</TabsTrigger>
      </TabsList>

      <TabsContent value="qualifications" className="space-y-3">
        {application.qualifications.length > 0 ? (
          application.qualifications.map((qual, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="h-4 w-4" />
                <span className="font-medium">{qual.title}</span>
                <Badge variant="outline" className="text-xs">{qual.type}</Badge>
              </div>
              {qual.institution && (
                <p className="text-sm text-gray-600">{qual.institution}</p>
              )}
              {qual.description && (
                <p className="text-sm text-gray-700 mt-1">{qual.description}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No qualifications listed</p>
        )}
      </TabsContent>

      <TabsContent value="publications" className="space-y-3">
        {application.publications.length > 0 ? (
          application.publications.map((pub, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{pub.title}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {pub.journal && <p>Journal: {pub.journal}</p>}
                {pub.year && <p>Year: {pub.year}</p>}
                {pub.doi && <p>DOI: {pub.doi}</p>}
                {pub.authorRole && (
                  <Badge variant="outline" className="text-xs">{pub.authorRole.replace('_', ' ')}</Badge>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No publications listed</p>
        )}
      </TabsContent>

      <TabsContent value="references" className="space-y-3">
        {application.references.length > 0 ? (
          application.references.map((ref, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">{ref.referenceName}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Email: {ref.referenceEmail}</p>
                {ref.referenceAffiliation && <p>Affiliation: {ref.referenceAffiliation}</p>}
                <p>Relationship: {ref.relationship}</p>
                <Badge variant="outline" className="text-xs">
                  {ref.status || "pending"}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No references listed</p>
        )}
      </TabsContent>
    </Tabs>
  )
}
