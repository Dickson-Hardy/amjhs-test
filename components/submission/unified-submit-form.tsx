"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { uploadFileChunked } from "@/lib/chunked-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Upload, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  User,
  AlertTriangle,
  Info
} from "lucide-react"

interface Author {
  firstName: string
  lastName: string
  email: string
  affiliation: string
  isCorresponding: boolean
}

interface RecommendedReviewer {
  name: string
  email: string
  affiliation: string
  expertise: string
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  fileId: string
  size?: number
}

interface SubmissionData {
  title: string
  abstract: string
  keywords: string
  category: string
  authors: Author[]
  uploadedFiles: UploadedFile[]
  recommendedReviewers: RecommendedReviewer[]
  coverLetter: string
  ethicalApproval: boolean
  conflictOfInterest: boolean
  termsAccepted: boolean
  guidelinesAccepted: boolean
}

const CATEGORIES = [
  'Clinical Research',
  'Basic Science Research', 
  'Public Health',
  'Medical Education',
  'Case Studies',
  'Review Articles',
  'Editorial',
  'Commentary',
  'Letter to Editor'
]

const FILE_TYPES = [
  { value: 'manuscript', label: 'Manuscript' },
  { value: 'figure', label: 'Figure' },
  { value: 'table', label: 'Table' },
  { value: 'supplementary', label: 'Supplementary Material' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'ethics_approval', label: 'Ethics Approval' }
]

interface UnifiedSubmitFormProps {
  initialData?: Partial<SubmissionData>
  onSuccess?: (submissionId: string) => void
  variant?: 'full' | 'compact'
}

export function UnifiedSubmitForm({ 
  initialData = {},
  onSuccess,
  variant = 'full'
}: UnifiedSubmitFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    title: '',
    abstract: '',
    keywords: '',
    category: '',
    authors: [{
      firstName: session?.user?.name?.split(' ')[0] || '',
      lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
      email: session?.user?.email || '',
      affiliation: '',
      isCorresponding: true
    }],
    uploadedFiles: [],
    recommendedReviewers: [],
    coverLetter: '',
    ethicalApproval: false,
    conflictOfInterest: false,
    termsAccepted: false,
    guidelinesAccepted: false,
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1: // Article Details
        if (!submissionData.title || submissionData.title.length < 10) {
          newErrors.title = 'Title must be at least 10 characters'
        }
        if (!submissionData.abstract || submissionData.abstract.length < 100) {
          newErrors.abstract = 'Abstract must be at least 100 characters'
        }
        if (!submissionData.keywords) {
          newErrors.keywords = 'Keywords are required'
        } else {
          const keywordArray = submissionData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          if (keywordArray.length < 3) {
            newErrors.keywords = 'At least 3 keywords are required'
          }
        }
        if (!submissionData.category) {
          newErrors.category = 'Category is required'
        }
        break
        
      case 2: // Authors
        if (submissionData.authors.length === 0) {
          newErrors.authors = 'At least one author is required'
        } else {
          submissionData.authors.forEach((author, index) => {
            if (!author.firstName) newErrors[`author_${index}_firstName`] = 'First name required'
            if (!author.lastName) newErrors[`author_${index}_lastName`] = 'Last name required'
            if (!author.email) newErrors[`author_${index}_email`] = 'Email required'
            if (!author.affiliation) newErrors[`author_${index}_affiliation`] = 'Affiliation required'
          })
        }
        break
        
      case 3: // Files
        if (submissionData.uploadedFiles.length === 0) {
          newErrors.files = 'At least one file must be uploaded'
        }
        break
        
      case 4: // Final validation
        if (!submissionData.termsAccepted) {
          newErrors.terms = 'You must accept the terms and conditions'
        }
        if (!submissionData.guidelinesAccepted) {
          newErrors.guidelines = 'You must accept the submission guidelines'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFileUpload = async (file: File, type: string) => {
    try {
      setUploadProgress(0)
      
      const result = await uploadFileChunked(
        file,
        type,
        `${type} file for submission`,
        {
          onProgress: (progress) => setUploadProgress(progress.percentage)
        }
      )
      
      if (result.success && result.file) {
        const newFile: UploadedFile = {
          id: result.file.id,
          name: result.file.originalName,
          url: result.file.url,
          type: type,
          fileId: result.file.id,
          size: file.size
        }
        
        setSubmissionData(prev => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, newFile]
        }))
        
        toast({
          title: "File uploaded successfully",
          description: file.name,
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setUploadProgress(0)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setSubmissionData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.id !== fileId)
    }))
  }

  const handleAddAuthor = () => {
    setSubmissionData(prev => ({
      ...prev,
      authors: [...prev.authors, {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        isCorresponding: false
      }]
    }))
  }

  const handleRemoveAuthor = (index: number) => {
    if (submissionData.authors.length > 1) {
      setSubmissionData(prev => ({
        ...prev,
        authors: prev.authors.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    try {
      setIsSubmitting(true)
      
      // Prepare submission data
      const submissionPayload = {
        articleData: {
          title: submissionData.title,
          abstract: submissionData.abstract,
          keywords: submissionData.keywords.split(',').map(k => k.trim()).filter(Boolean),
          category: submissionData.category,
          authors: submissionData.authors.map(author => ({
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            affiliation: author.affiliation,
            isCorrespondingAuthor: author.isCorresponding
          })),
          files: submissionData.uploadedFiles.map(file => ({
            url: file.url,
            type: file.type,
            name: file.name,
            fileId: file.fileId,
            size: file.size
          })),
          recommendedReviewers: submissionData.recommendedReviewers,
          coverLetter: submissionData.coverLetter,
          ethicalApproval: submissionData.ethicalApproval,
          conflictOfInterest: submissionData.conflictOfInterest
        }
      }

      const response = await fetch('/api/workflow/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Submission failed')
      }

      const result = await response.json()
      
      toast({
        title: "Submission successful!",
        description: "Your manuscript has been submitted for review.",
      })

      if (onSuccess) {
        onSuccess(result.submissionId)
      } else {
        router.push('/author/submissions')
      }
      
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                value={submissionData.title}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your article title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                value={submissionData.abstract}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="Enter your abstract (minimum 100 characters)"
                rows={6}
                className={errors.abstract ? "border-red-500" : ""}
              />
              <div className="text-sm text-gray-500 mt-1">
                {submissionData.abstract.length}/100 minimum characters
              </div>
              {errors.abstract && <p className="text-sm text-red-500 mt-1">{errors.abstract}</p>}
            </div>

            <div>
              <Label htmlFor="keywords">Keywords *</Label>
              <Input
                id="keywords"
                value={submissionData.keywords}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Enter keywords separated by commas (minimum 3)"
                className={errors.keywords ? "border-red-500" : ""}
              />
              {errors.keywords && <p className="text-sm text-red-500 mt-1">{errors.keywords}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={submissionData.category} onValueChange={(value) => 
                setSubmissionData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select article category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Authors</h3>
              <Button onClick={handleAddAuthor} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Author
              </Button>
            </div>

            {submissionData.authors.map((author, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Author {index + 1}</h4>
                  {submissionData.authors.length > 1 && (
                    <Button
                      onClick={() => handleRemoveAuthor(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={author.firstName}
                      onChange={(e) => {
                        const newAuthors = [...submissionData.authors]
                        newAuthors[index].firstName = e.target.value
                        setSubmissionData(prev => ({ ...prev, authors: newAuthors }))
                      }}
                      className={errors[`author_${index}_firstName`] ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={author.lastName}
                      onChange={(e) => {
                        const newAuthors = [...submissionData.authors]
                        newAuthors[index].lastName = e.target.value
                        setSubmissionData(prev => ({ ...prev, authors: newAuthors }))
                      }}
                      className={errors[`author_${index}_lastName`] ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={author.email}
                      onChange={(e) => {
                        const newAuthors = [...submissionData.authors]
                        newAuthors[index].email = e.target.value
                        setSubmissionData(prev => ({ ...prev, authors: newAuthors }))
                      }}
                      className={errors[`author_${index}_email`] ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label>Affiliation *</Label>
                    <Input
                      value={author.affiliation}
                      onChange={(e) => {
                        const newAuthors = [...submissionData.authors]
                        newAuthors[index].affiliation = e.target.value
                        setSubmissionData(prev => ({ ...prev, authors: newAuthors }))
                      }}
                      className={errors[`author_${index}_affiliation`] ? "border-red-500" : ""}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`corresponding-${index}`}
                      checked={author.isCorresponding}
                      onCheckedChange={(checked) => {
                        const newAuthors = [...submissionData.authors]
                        // Ensure only one corresponding author
                        newAuthors.forEach((a, i) => {
                          a.isCorresponding = i === index ? !!checked : false
                        })
                        setSubmissionData(prev => ({ ...prev, authors: newAuthors }))
                      }}
                    />
                    <Label htmlFor={`corresponding-${index}`}>Corresponding Author</Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">File Upload</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload files
                      </span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(file => handleFileUpload(file, 'manuscript'))
                      }}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.svg,.csv,.xls,.xlsx"
                    />
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {submissionData.uploadedFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Uploaded Files</h4>
                <div className="space-y-2">
                  {submissionData.uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.type}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveFile(file.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.files && <p className="text-sm text-red-500">{errors.files}</p>}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={submissionData.coverLetter}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Enter your cover letter"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ethical"
                  checked={submissionData.ethicalApproval}
                  onCheckedChange={(checked) => 
                    setSubmissionData(prev => ({ ...prev, ethicalApproval: !!checked }))
                  }
                />
                <Label htmlFor="ethical">
                  This research has received ethical approval where required
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conflict"
                  checked={submissionData.conflictOfInterest}
                  onCheckedChange={(checked) => 
                    setSubmissionData(prev => ({ ...prev, conflictOfInterest: !!checked }))
                  }
                />
                <Label htmlFor="conflict">
                  I declare any conflicts of interest
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={submissionData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setSubmissionData(prev => ({ ...prev, termsAccepted: !!checked }))
                  }
                />
                <Label htmlFor="terms">
                  I accept the terms and conditions *
                </Label>
              </div>
              {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="guidelines"
                  checked={submissionData.guidelinesAccepted}
                  onCheckedChange={(checked) => 
                    setSubmissionData(prev => ({ ...prev, guidelinesAccepted: !!checked }))
                  }
                />
                <Label htmlFor="guidelines">
                  I have read and accept the submission guidelines *
                </Label>
              </div>
              {errors.guidelines && <p className="text-sm text-red-500">{errors.guidelines}</p>}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center ${
                step < 4 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-1 ml-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span>Article Details</span>
          <span>Authors</span>
          <span>Files</span>
          <span>Review & Submit</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {
              currentStep === 1 ? 'Article Details' :
              currentStep === 2 ? 'Authors' :
              currentStep === 3 ? 'File Upload' :
              'Review & Submit'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Manuscript"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}