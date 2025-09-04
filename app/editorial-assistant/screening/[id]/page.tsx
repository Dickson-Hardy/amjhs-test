"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FileText, Calendar, User, AlertCircle, ArrowLeft, CheckCircle2, XCircle, Download, Eye, Mail, Building, Globe, BookOpen, Tag, Clock, FileCheck, Shield, Search, Maximize2, Send, MessageSquare, Phone, ExternalLink, Users, Plus, Edit } from "lucide-react"
import Link from "next/link"
import { RouteGuard } from "@/components/route-guard"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SubmissionData {
  id: string
  status: string
  title: string
  abstract: string
  content?: string
  createdAt: string
  authorId: string
  authorName?: string
  authorEmail?: string
  coAuthors?: Array<{
    firstName: string
    lastName: string
    email: string
    affiliation?: string
    orcid?: string
    isCorrespondingAuthor?: boolean
  }>
  keywords?: string[]
  category?: string
  submissionType?: string
  ethics?: {
    hasEthicsApproval: boolean
    ethicsApprovalNumber?: string
    hasConflictOfInterest: boolean
    conflictDetails?: string
    hasInformedConsent: boolean
  }
  funding?: {
    hasFunding: boolean
    fundingSource?: string
    grantNumber?: string
  }
  manuscript?: {
    filename: string
    filesize: number
    uploadedAt: string
    url?: string
  }
  supplementaryFiles?: Array<{
    filename: string
    filesize: number
    type: string
    uploadedAt: string
    url?: string
  }>
  coverLetter?: string
  suggestedReviewers?: Array<{
    name: string
    email: string
    affiliation: string
    expertise?: string
  }>
  excludedReviewers?: Array<{
    name: string
    email: string
    reason: string
  }>
}

interface ScreeningData {
  fileCompleteness: boolean
  plagiarismCheck: boolean
  formatCompliance: boolean
  ethicalCompliance: boolean
  languageQuality: boolean
  technicalQuality: boolean
  scopeAlignment: boolean
  originalityCheck: boolean
  dataAvailability: boolean
  statisticalSoundness: boolean
  notes: string
  qualityScore: number
  completenessScore: number
  overallAssessment: string
  identifiedIssues: string[]
  requiredRevisions: string[]
}

export default function ManuscriptScreeningPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const submissionId = params?.id as string

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFullAbstract, setShowFullAbstract] = useState(false)
  const [communicationText, setCommunicationText] = useState("")
  const [sendingCommunication, setSendingCommunication] = useState(false)
  
  const [screeningData, setScreeningData] = useState<ScreeningData>({
    fileCompleteness: false,
    plagiarismCheck: false,
    formatCompliance: false,
    ethicalCompliance: false,
    languageQuality: false,
    technicalQuality: false,
    scopeAlignment: false,
    originalityCheck: false,
    dataAvailability: false,
    statisticalSoundness: false,
    notes: "",
    qualityScore: 0,
    completenessScore: 0,
    overallAssessment: "",
    identifiedIssues: [],
    requiredRevisions: []
  })

  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/editorial-assistant/screening?submissionId=${submissionId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Submission not found')
        }
        throw new Error('Failed to fetch submission')
      }
      const data = await response.json()
      setSubmission(data.submission)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleScreeningSubmit = async () => {
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/editorial-assistant/screening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          screeningData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit screening')
      }

      const result = await response.json()
      toast.success('Screening completed successfully!')
      
      // Redirect back to screening dashboard
      router.push('/editorial-assistant/screening')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit screening'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'screening':
        return 'bg-yellow-100 text-yellow-800'
      case 'screening_completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isScreeningComplete = () => {
    return screeningData.fileCompleteness && 
           screeningData.plagiarismCheck && 
           screeningData.formatCompliance && 
           screeningData.ethicalCompliance && 
           screeningData.languageQuality &&
           screeningData.technicalQuality &&
           screeningData.scopeAlignment &&
           screeningData.originalityCheck &&
           screeningData.overallAssessment.trim().length > 0
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading submission...</span>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error || 'Submission not found'}</span>
            </div>
            <Link href="/editorial-assistant/screening" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Screening Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RouteGuard allowedRoles={["editorial-assistant", "admin", "managing-editor", "editor-in-chief"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/editorial-assistant/screening">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Screening Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manuscript Screening</h1>
          <p className="text-gray-600 mt-2">Review and assess the submitted manuscript</p>
        </div>

        <div className="grid xl:grid-cols-3 gap-8">
          {/* Main Manuscript Details - Left Column (2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="manuscript">Manuscript</TabsTrigger>
                <TabsTrigger value="authors">Authors</TabsTrigger>
                <TabsTrigger value="ethics">Ethics</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl leading-tight">{submission.title || 'Untitled Submission'}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <User className="h-4 w-4 mr-1" />
                          {submission.authorName || submission.authorEmail || 'Author not specified'}
                          <Calendar className="h-4 w-4 ml-4 mr-1" />
                          {new Date(submission.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Submission ID</Label>
                        <p className="text-sm text-gray-600 font-mono">{submission.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Category</Label>
                        <p className="text-sm text-gray-600">{submission.category || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Submission Type</Label>
                        <p className="text-sm text-gray-600">{submission.submissionType || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Total Authors</Label>
                        <p className="text-sm text-gray-600">{submission.coAuthors ? submission.coAuthors.length + 1 : 1}</p>
                      </div>
                    </div>

                    {submission.keywords && submission.keywords.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {submission.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {submission.abstract && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          Abstract
                        </CardTitle>
                        <Dialog open={showFullAbstract} onOpenChange={setShowFullAbstract}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Maximize2 className="h-4 w-4 mr-2" />
                              View Full Abstract
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl mb-4">Full Abstract</DialogTitle>
                              <DialogDescription className="text-base leading-relaxed whitespace-pre-wrap">
                                {submission.abstract}
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <p className="text-sm text-gray-700 leading-relaxed">{submission.abstract}</p>
                      </ScrollArea>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          {submission.abstract.length} characters • Click "View Full Abstract" for complete text
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {submission.coverLetter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Mail className="h-5 w-5 mr-2" />
                        Cover Letter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{submission.coverLetter}</p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="manuscript" className="space-y-6">
                {submission.manuscript && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Download className="h-5 w-5 mr-2" />
                        Primary Manuscript File
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{submission.manuscript.filename}</p>
                            <p className="text-sm text-blue-700">
                              {(submission.manuscript.filesize / (1024 * 1024)).toFixed(2)} MB • 
                              Uploaded {new Date(submission.manuscript.uploadedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Primary manuscript document for review
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {submission.manuscript.url && (
                            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Manuscript
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {submission.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Manuscript Content Preview
                      </CardTitle>
                      <CardDescription>
                        Text content extracted from the submitted manuscript
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96 border rounded-lg p-4 bg-gray-50">
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                          {submission.content}
                        </div>
                      </ScrollArea>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          {submission.content.length} characters extracted • Use "Preview Manuscript" above for formatted view
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!submission.manuscript && !submission.content && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Manuscript Content Available</h3>
                      <p className="text-gray-600">
                        The manuscript file may still be processing or was not uploaded properly.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="authors" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Author Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Primary Author */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Primary Author</h4>
                        <Badge variant="outline">Corresponding</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-700">Name</Label>
                          <p>{submission.authorName || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-700">Email</Label>
                          <p>{submission.authorEmail || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Co-Authors */}
                    {submission.coAuthors && submission.coAuthors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Co-Authors ({submission.coAuthors.length})</h4>
                        <div className="space-y-3">
                          {submission.coAuthors.map((author, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{author.firstName} {author.lastName}</h5>
                                {author.isCorrespondingAuthor && <Badge variant="outline">Corresponding</Badge>}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-gray-700">Email</Label>
                                  <p>{author.email}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-700">Affiliation</Label>
                                  <p>{author.affiliation || 'Not provided'}</p>
                                </div>
                                {author.orcid && (
                                  <div>
                                    <Label className="text-gray-700">ORCID</Label>
                                    <p className="font-mono text-xs">{author.orcid}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ethics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Ethics & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {submission.ethics && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          {submission.ethics.hasEthicsApproval ? 
                            <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                            <XCircle className="h-5 w-5 text-red-600" />
                          }
                          <div>
                            <p className="font-medium">Ethics Approval</p>
                            <p className="text-sm text-gray-600">
                              {submission.ethics.hasEthicsApproval ? 'Approved' : 'Not required/obtained'}
                            </p>
                            {submission.ethics.ethicsApprovalNumber && (
                              <p className="text-xs text-gray-500">#{submission.ethics.ethicsApprovalNumber}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {submission.ethics.hasConflictOfInterest ? 
                            <AlertCircle className="h-5 w-5 text-yellow-600" /> : 
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          }
                          <div>
                            <p className="font-medium">Conflict of Interest</p>
                            <p className="text-sm text-gray-600">
                              {submission.ethics.hasConflictOfInterest ? 'Declared' : 'None declared'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {submission.ethics.hasInformedConsent ? 
                            <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                            <XCircle className="h-5 w-5 text-red-600" />
                          }
                          <div>
                            <p className="font-medium">Informed Consent</p>
                            <p className="text-sm text-gray-600">
                              {submission.ethics.hasInformedConsent ? 'Obtained' : 'Not required/obtained'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {submission.funding && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-medium mb-3">Funding Information</h4>
                        <div className="flex items-center space-x-2">
                          {submission.funding.hasFunding ? 
                            <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                            <XCircle className="h-5 w-5 text-gray-600" />
                          }
                          <div>
                            <p className="font-medium">Funding Status</p>
                            <p className="text-sm text-gray-600">
                              {submission.funding.hasFunding ? 'Funded research' : 'No funding declared'}
                            </p>
                            {submission.funding.fundingSource && (
                              <p className="text-sm text-gray-700 mt-1">
                                <strong>Source:</strong> {submission.funding.fundingSource}
                              </p>
                            )}
                            {submission.funding.grantNumber && (
                              <p className="text-sm text-gray-700">
                                <strong>Grant #:</strong> {submission.funding.grantNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                {/* Primary Manuscript File */}
                {submission.manuscript && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileCheck className="h-5 w-5 mr-2" />
                        Primary Manuscript File
                      </CardTitle>
                      <CardDescription>Main submission document</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-900">{submission.manuscript.filename}</p>
                            <p className="text-sm text-blue-700">
                              {(submission.manuscript.filesize / (1024 * 1024)).toFixed(2)} MB • 
                              Uploaded {new Date(submission.manuscript.uploadedAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center mt-2">
                              <Badge className="bg-blue-600 text-white">Primary Document</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open External
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Supplementary Files */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Supplementary Files
                      {submission.supplementaryFiles && (
                        <Badge variant="outline" className="ml-2">
                          {submission.supplementaryFiles.length} files
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Additional supporting documents and materials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {submission.supplementaryFiles && submission.supplementaryFiles.length > 0 ? (
                      <div className="space-y-3">
                        {submission.supplementaryFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <FileText className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">{file.filename}</p>
                                <p className="text-sm text-gray-500">
                                  {file.type} • {(file.filesize / (1024 * 1024)).toFixed(2)} MB • 
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {file.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {file.url && (
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Supplementary Files</h3>
                        <p className="text-gray-600">No additional files were uploaded with this submission</p>
                      </div>
                    )}

                    {/* File Summary */}
                    <div className="pt-4 border-t bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">File Submission Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-700">Total Files</Label>
                          <p className="font-medium">
                            {(submission.manuscript ? 1 : 0) + (submission.supplementaryFiles?.length || 0)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-700">Total Size</Label>
                          <p className="font-medium">
                            {(
                              ((submission.manuscript?.filesize || 0) + 
                               (submission.supplementaryFiles?.reduce((acc, file) => acc + file.filesize, 0) || 0)) / 
                              (1024 * 1024)
                            ).toFixed(2)} MB
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-700">Primary Document</Label>
                          <p className="font-medium">
                            {submission.manuscript ? 'Available' : 'Missing'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-700">File Status</Label>
                          <Badge className={submission.manuscript ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {submission.manuscript ? 'Complete' : 'Incomplete'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviewers" className="space-y-6">
                {/* Communication to Authors Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Communication to Authors
                    </CardTitle>
                    <CardDescription>Send messages and notifications to manuscript authors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center mb-3">
                        <Mail className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-blue-900">Author Contact Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-blue-700">Primary Author</Label>
                          <p className="font-medium">{submission.authorName || 'Not provided'}</p>
                          <p className="text-blue-600">{submission.authorEmail || 'No email'}</p>
                        </div>
                        <div>
                          <Label className="text-blue-700">Co-Authors</Label>
                          <p className="font-medium">
                            {submission.coAuthors?.length || 0} additional author(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="communication">Message to Authors</Label>
                      <Textarea
                        id="communication"
                        placeholder="Type your message to the authors here..."
                        value={communicationText}
                        onChange={(e) => setCommunicationText(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {communicationText.length} characters
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                          <Button 
                            size="sm" 
                            disabled={!communicationText.trim() || sendingCommunication}
                            onClick={async () => {
                              setSendingCommunication(true)
                              try {
                                const response = await fetch('/api/messages', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    recipientType: 'author',
                                    recipientId: submission.authorId,
                                    subject: `Regarding your submission: ${submission.title}`,
                                    content: communicationText,
                                    messageType: 'editorial',
                                    priority: 'medium',
                                    submissionId: submission.id
                                  })
                                })

                                if (response.ok) {
                                  toast.success("Message sent to authors")
                                  setCommunicationText("")
                                } else {
                                  const error = await response.json()
                                  toast.error(error.error || "Failed to send message")
                                }
                              } catch (error) {
                                console.error('Error sending message:', error)
                                toast.error("Failed to send message")
                              } finally {
                                setSendingCommunication(false)
                              }
                            }}
                          >
                            {sendingCommunication ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Message
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Message Templates */}
                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium">Quick Templates</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCommunicationText("Thank you for your submission. We have received your manuscript and it is currently under initial screening.")}
                        >
                          Acknowledgment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCommunicationText("We require some additional information/documents for your submission. Please provide the following:")}
                        >
                          Request Info
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCommunicationText("Your submission has passed initial screening and has been forwarded to an associate editor for content review.")}
                        >
                          Progress Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviewer Management Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Suggested Reviewers */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center text-green-700">
                          <Users className="h-5 w-5 mr-2" />
                          Suggested Reviewers
                          {submission.suggestedReviewers && (
                            <Badge variant="outline" className="ml-2 text-green-700">
                              {submission.suggestedReviewers.length}
                            </Badge>
                          )}
                        </CardTitle>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Reviewer
                        </Button>
                      </div>
                      <CardDescription>Authors' suggested reviewer recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {submission.suggestedReviewers && submission.suggestedReviewers.length > 0 ? (
                        <div className="space-y-3">
                          {submission.suggestedReviewers.map((reviewer, index) => (
                            <div key={index} className="border border-green-200 rounded-lg p-3 bg-green-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-green-900">{reviewer.name}</h4>
                                  <p className="text-sm text-green-700">{reviewer.email}</p>
                                  <p className="text-sm text-green-600">{reviewer.affiliation}</p>
                                  {reviewer.expertise && (
                                    <p className="text-xs text-green-600 mt-1">
                                      <strong>Expertise:</strong> {reviewer.expertise}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">No suggested reviewers provided</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Excluded Reviewers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center text-red-700">
                        <XCircle className="h-5 w-5 mr-2" />
                        Excluded Reviewers
                        {submission.excludedReviewers && (
                          <Badge variant="outline" className="ml-2 text-red-700">
                            {submission.excludedReviewers.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Reviewers to avoid due to conflicts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {submission.excludedReviewers && submission.excludedReviewers.length > 0 ? (
                        <div className="space-y-3">
                          {submission.excludedReviewers.map((reviewer, index) => (
                            <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-red-900">{reviewer.name}</h4>
                                  <p className="text-sm text-red-700">{reviewer.email}</p>
                                  <p className="text-sm text-red-600 mt-1">
                                    <strong>Exclusion reason:</strong> {reviewer.reason}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-red-700">
                                  Excluded
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">No reviewer exclusions specified</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Reviewer Selection Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Editorial Notes on Reviewer Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes about reviewer selection criteria, conflicts to consider, or special requirements..."
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm">
                        Save Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Screening Checklist - Right Column (1/3 width) */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Editorial Screening Assessment
                </CardTitle>
                <CardDescription>
                  Complete all criteria before submitting your assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="technical" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="editorial">Editorial</TabsTrigger>
                  </TabsList>

                  <TabsContent value="technical" className="space-y-4">
                    <div className="space-y-4">
                      {/* File Completeness */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fileCompleteness"
                            checked={screeningData.fileCompleteness}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, fileCompleteness: !!checked }))
                            }
                          />
                          <Label htmlFor="fileCompleteness" className="text-sm font-medium">
                            File Completeness
                          </Label>
                          {screeningData.fileCompleteness && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          All required files present and accessible
                        </p>
                      </div>

                      {/* Format Compliance */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="formatCompliance"
                            checked={screeningData.formatCompliance}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, formatCompliance: !!checked }))
                            }
                          />
                          <Label htmlFor="formatCompliance" className="text-sm font-medium">
                            Format Compliance
                          </Label>
                          {screeningData.formatCompliance && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Follows journal formatting guidelines
                        </p>
                      </div>

                      {/* Language Quality */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="languageQuality"
                            checked={screeningData.languageQuality}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, languageQuality: !!checked }))
                            }
                          />
                          <Label htmlFor="languageQuality" className="text-sm font-medium">
                            Language Quality
                          </Label>
                          {screeningData.languageQuality && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Language quality acceptable for review
                        </p>
                      </div>

                      {/* Technical Quality */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="technicalQuality"
                            checked={screeningData.technicalQuality}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, technicalQuality: !!checked }))
                            }
                          />
                          <Label htmlFor="technicalQuality" className="text-sm font-medium">
                            Technical Quality
                          </Label>
                          {screeningData.technicalQuality && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Methods and data presentation adequate
                        </p>
                      </div>

                      {/* Data Availability */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="dataAvailability"
                            checked={screeningData.dataAvailability}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, dataAvailability: !!checked }))
                            }
                          />
                          <Label htmlFor="dataAvailability" className="text-sm font-medium">
                            Data Availability
                          </Label>
                          {screeningData.dataAvailability && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Data accessibility statements present
                        </p>
                      </div>

                      {/* Statistical Soundness */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="statisticalSoundness"
                            checked={screeningData.statisticalSoundness}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, statisticalSoundness: !!checked }))
                            }
                          />
                          <Label htmlFor="statisticalSoundness" className="text-sm font-medium">
                            Statistical Soundness
                          </Label>
                          {screeningData.statisticalSoundness && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Statistical methods appropriate
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="editorial" className="space-y-4">
                    <div className="space-y-4">
                      {/* Plagiarism Check */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="plagiarismCheck"
                            checked={screeningData.plagiarismCheck}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, plagiarismCheck: !!checked }))
                            }
                          />
                          <Label htmlFor="plagiarismCheck" className="text-sm font-medium">
                            Plagiarism Check
                          </Label>
                          {screeningData.plagiarismCheck && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Initial plagiarism screening completed
                        </p>
                      </div>

                      {/* Ethical Compliance */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ethicalCompliance"
                            checked={screeningData.ethicalCompliance}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, ethicalCompliance: !!checked }))
                            }
                          />
                          <Label htmlFor="ethicalCompliance" className="text-sm font-medium">
                            Ethical Compliance
                          </Label>
                          {screeningData.ethicalCompliance && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Meets ethical standards and requirements
                        </p>
                      </div>

                      {/* Scope Alignment */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scopeAlignment"
                            checked={screeningData.scopeAlignment}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, scopeAlignment: !!checked }))
                            }
                          />
                          <Label htmlFor="scopeAlignment" className="text-sm font-medium">
                            Journal Scope Alignment
                          </Label>
                          {screeningData.scopeAlignment && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Fits within journal's scope and aims
                        </p>
                      </div>

                      {/* Originality Check */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="originalityCheck"
                            checked={screeningData.originalityCheck}
                            onCheckedChange={(checked) =>
                              setScreeningData(prev => ({ ...prev, originalityCheck: !!checked }))
                            }
                          />
                          <Label htmlFor="originalityCheck" className="text-sm font-medium">
                            Originality Assessment
                          </Label>
                          {screeningData.originalityCheck && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          Novel contribution and significance
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Assessment Summary */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="overallAssessment" className="text-sm font-medium">
                      Overall Assessment <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="overallAssessment"
                      placeholder="Provide an overall assessment of the manuscript's suitability for peer review..."
                      value={screeningData.overallAssessment}
                      onChange={(e) => setScreeningData(prev => ({ ...prev, overallAssessment: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Internal Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any internal notes for the editorial team..."
                      value={screeningData.notes}
                      onChange={(e) => setScreeningData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleScreeningSubmit}
                    disabled={!isScreeningComplete() || submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing Screening...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Screening Assessment
                      </>
                    )}
                  </Button>
                  
                  {!isScreeningComplete() && (
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      <p>Missing requirements:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {!screeningData.fileCompleteness && <Badge variant="outline" className="text-xs">Files</Badge>}
                        {!screeningData.formatCompliance && <Badge variant="outline" className="text-xs">Format</Badge>}
                        {!screeningData.languageQuality && <Badge variant="outline" className="text-xs">Language</Badge>}
                        {!screeningData.technicalQuality && <Badge variant="outline" className="text-xs">Technical</Badge>}
                        {!screeningData.plagiarismCheck && <Badge variant="outline" className="text-xs">Plagiarism</Badge>}
                        {!screeningData.ethicalCompliance && <Badge variant="outline" className="text-xs">Ethics</Badge>}
                        {!screeningData.scopeAlignment && <Badge variant="outline" className="text-xs">Scope</Badge>}
                        {!screeningData.originalityCheck && <Badge variant="outline" className="text-xs">Originality</Badge>}
                        {!screeningData.overallAssessment.trim() && <Badge variant="outline" className="text-xs">Assessment</Badge>}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Save as draft functionality
                      toast.info("Draft saved")
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}