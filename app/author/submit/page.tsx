"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Upload, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react"

interface Author {
  firstName: string
  lastName: string
  email: string
  affiliation: string
  isCorresponding: boolean
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  fileId: string
}

export default function SubmitPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submissionData, setSubmissionData] = useState({
    title: "",
    abstract: "",
    category: "",
    keywords: "",
    authors: [] as Author[],
    manuscriptFile: null as File | null,
    coverLetter: null as File | null,
    supplementaryFiles: [] as File[],
    uploadedFiles: [] as UploadedFile[],
    ethicalApproval: false,
    conflictOfInterest: false,
    dataAvailability: false,
    funding: "",
    acknowledgments: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    "Original Research",
    "Review Article", 
    "Case Report",
    "Letter to Editor",
    "Short Communication",
    "Editorial"
  ]

  const addAuthor = () => {
    const newAuthor: Author = {
      firstName: "",
      lastName: "",
      email: "",
      affiliation: "",
      isCorresponding: false
    }
    setSubmissionData(prev => ({
      ...prev,
      authors: [...prev.authors, newAuthor]
    }))
  }

  const removeAuthor = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }))
  }

  const updateAuthor = (index: number, field: keyof Author, value: string | boolean) => {
    setSubmissionData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => 
        i === index ? { ...author, [field]: value } : author
      )
    }))
  }

  const uploadFile = async (file: File, category: string): Promise<UploadedFile | null> => {
    try {
      setUploading(true)
      
      // Client-side file size validation
      const maxSizes = {
        manuscript: 10 * 1024 * 1024, // 10MB
        supplementary: 50 * 1024 * 1024, // 50MB
        cover_letter: 5 * 1024 * 1024, // 5MB
        ethics_approval: 5 * 1024 * 1024, // 5MB
        conflict_disclosure: 2 * 1024 * 1024 // 2MB
      }
      
      const maxSize = maxSizes[category as keyof typeof maxSizes] || 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB for ${category}`)
      }
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const uploadPayload = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,
        category,
        description: `${category} file for submission`
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload)
      })

      // Handle non-JSON responses (like nginx error pages)
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        
        // Check for common nginx/server errors
        if (textResponse.includes('Request Entity Too Large') || textResponse.includes('413')) {
          throw new Error('File too large. Please choose a smaller file (max 50MB for supplementary files).')
        } else if (textResponse.includes('timeout') || textResponse.includes('504') || textResponse.includes('502')) {
          throw new Error('Upload timeout. Please try again with a smaller file or check your connection.')
        } else {
          throw new Error('Server error. Please try again later.')
        }
      }

      const result = await response.json()

      if (response.ok && result.success) {
        return {
          id: result.file.id,
          name: result.file.originalName,
          url: result.file.url,
          type: category,
          fileId: result.file.id
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error(`Error uploading ${category}:`, error)
      alert(`Failed to upload ${category}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (field: string, file: File | null) => {
    if (!file) {
      setSubmissionData(prev => ({ ...prev, [field]: null }))
      return
    }

    const category = field === 'manuscriptFile' ? 'manuscript' : 'cover_letter'
    const uploadedFile = await uploadFile(file, category)
    
    if (uploadedFile) {
      setSubmissionData(prev => ({
        ...prev,
        [field]: file,
        uploadedFiles: [...prev.uploadedFiles.filter(f => f.type !== category), uploadedFile]
      }))
    }
  }

  const handleMultipleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const uploadPromises = fileArray.map(file => uploadFile(file, 'supplementary'))
    
    try {
      setUploading(true)
      const uploadedFiles = await Promise.all(uploadPromises)
      const successfulUploads = uploadedFiles.filter(file => file !== null) as UploadedFile[]
      
      setSubmissionData(prev => ({
        ...prev,
        supplementaryFiles: [...prev.supplementaryFiles, ...fileArray],
        uploadedFiles: [...prev.uploadedFiles, ...successfulUploads]
      }))
    } catch (error) {
      console.error('Error uploading supplementary files:', error)
      alert('Some files failed to upload. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!submissionData.title.trim()) newErrors.title = "Title is required"
      if (!submissionData.abstract.trim()) {
        newErrors.abstract = "Abstract is required"
      } else if (submissionData.abstract.trim().length < 100) {
        newErrors.abstract = "Abstract must be at least 100 characters"
      }
      if (!submissionData.category) newErrors.category = "Category is required"
      if (!submissionData.keywords.trim()) {
        newErrors.keywords = "Keywords are required"
      } else {
        const keywordArray = submissionData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        if (keywordArray.length < 3) {
          newErrors.keywords = "At least 3 keywords are required"
        }
      }
    }

    if (step === 2) {
      if (submissionData.authors.length === 0) {
        newErrors.authors = "At least one author is required"
      } else {
        submissionData.authors.forEach((author, index) => {
          if (!author.firstName.trim()) newErrors[`author${index}FirstName`] = "First name is required"
          if (!author.lastName.trim()) newErrors[`author${index}LastName`] = "Last name is required"
          if (!author.email.trim()) newErrors[`author${index}Email`] = "Email is required"
          if (!author.affiliation.trim()) newErrors[`author${index}Affiliation`] = "Affiliation is required"
        })
      }
    }

    if (step === 3) {
      // Files are optional according to the API, but we can still encourage them
      // if (!submissionData.manuscriptFile) newErrors.manuscriptFile = "Manuscript file is required"
      // if (!submissionData.coverLetter) newErrors.coverLetter = "Cover letter is required"
    }

    if (step === 4) {
      if (!submissionData.ethicalApproval) newErrors.ethicalApproval = "Ethical approval confirmation is required"
      if (!submissionData.conflictOfInterest) newErrors.conflictOfInterest = "Conflict of interest declaration is required"
      if (!submissionData.dataAvailability) newErrors.dataAvailability = "Data availability statement is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    try {
      setLoading(true)
      
      // Prepare submission data in the format expected by the API
      const submissionPayload = {
        articleData: {
          title: submissionData.title,
          abstract: submissionData.abstract,
          keywords: submissionData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
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
            fileId: file.fileId
          })),
          funding: submissionData.funding,
          ethicalApproval: submissionData.ethicalApproval,
          conflictOfInterest: submissionData.conflictOfInterest,
          coverLetter: submissionData.acknowledgments // Use acknowledgments as cover letter for now
        },
        submissionType: "new" as const
      }

      const response = await fetch('/api/workflow/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`Submission successful! Your manuscript has been submitted for review. Submission ID: ${result.data.submissionId}`)
        router.push("/author/submissions")
      } else {
        throw new Error(result.message || 'Submission failed')
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Manuscript Title *</Label>
        <Input
          id="title"
          value={submissionData.title}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter the title of your manuscript"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="category">Manuscript Category *</Label>
        <Select value={submissionData.category} onValueChange={(value) => setSubmissionData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger className={errors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select manuscript category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="abstract">Abstract *</Label>
        <Textarea
          id="abstract"
          value={submissionData.abstract}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, abstract: e.target.value }))}
          placeholder="Enter the abstract of your manuscript (minimum 100 characters)"
          rows={6}
          className={errors.abstract ? "border-red-500" : ""}
        />
        {errors.abstract && <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>}
        <p className="text-sm text-gray-500 mt-1">
          {submissionData.abstract.length}/100 characters minimum
        </p>
      </div>

      <div>
        <Label htmlFor="keywords">Keywords *</Label>
        <Input
          id="keywords"
          value={submissionData.keywords}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, keywords: e.target.value }))}
          placeholder="Enter at least 3 keywords separated by commas"
          className={errors.keywords ? "border-red-500" : ""}
        />
        {errors.keywords && <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Authors</h3>
        <Button onClick={addAuthor} type="button">
          <Plus className="h-4 w-4 mr-2" />
          Add Author
        </Button>
      </div>

      {errors.authors && <p className="text-red-500 text-sm">{errors.authors}</p>}

      {submissionData.authors.map((author, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Author {index + 1}</h4>
            {submissionData.authors.length > 1 && (
              <Button
                onClick={() => removeAuthor(index)}
                variant="outline"
                size="sm"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`firstName${index}`}>First Name *</Label>
              <Input
                id={`firstName${index}`}
                value={author.firstName}
                onChange={(e) => updateAuthor(index, "firstName", e.target.value)}
                className={errors[`author${index}FirstName`] ? "border-red-500" : ""}
              />
              {errors[`author${index}FirstName`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`author${index}FirstName`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`lastName${index}`}>Last Name *</Label>
              <Input
                id={`lastName${index}`}
                value={author.lastName}
                onChange={(e) => updateAuthor(index, "lastName", e.target.value)}
                className={errors[`author${index}LastName`] ? "border-red-500" : ""}
              />
              {errors[`author${index}LastName`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`author${index}LastName`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`email${index}`}>Email *</Label>
              <Input
                id={`email${index}`}
                type="email"
                value={author.email}
                onChange={(e) => updateAuthor(index, "email", e.target.value)}
                className={errors[`author${index}Email`] ? "border-red-500" : ""}
              />
              {errors[`author${index}Email`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`author${index}Email`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`affiliation${index}`}>Affiliation *</Label>
              <Input
                id={`affiliation${index}`}
                value={author.affiliation}
                onChange={(e) => updateAuthor(index, "affiliation", e.target.value)}
                className={errors[`author${index}Affiliation`] ? "border-red-500" : ""}
              />
              {errors[`author${index}Affiliation`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`author${index}Affiliation`]}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`corresponding${index}`}
                checked={author.isCorresponding}
                onCheckedChange={(checked) => updateAuthor(index, "isCorresponding", checked as boolean)}
              />
              <Label htmlFor={`corresponding${index}`}>Corresponding Author</Label>
            </div>
          </div>
        </Card>
      ))}

      {submissionData.authors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Plus className="h-12 w-12 mx-auto mb-4" />
          <p>Click "Add Author" to add the first author</p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {uploading && (
        <Alert>
          <AlertDescription>
            Uploading files... Please wait.
          </AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="manuscript">Manuscript File (Optional)</Label>
        <div className="mt-2">
          <Input
            id="manuscript"
            type="file"
            accept=".doc,.docx,.pdf"
            onChange={(e) => handleFileUpload("manuscriptFile", e.target.files?.[0] || null)}
            className={errors.manuscriptFile ? "border-red-500" : ""}
            disabled={uploading}
          />
        </div>
        {errors.manuscriptFile && <p className="text-red-500 text-sm mt-1">{errors.manuscriptFile}</p>}
        <p className="text-sm text-gray-500 mt-1">Accepted formats: .doc, .docx, .pdf</p>
        {submissionData.manuscriptFile && (
          <p className="text-sm text-green-600 mt-1">✓ {submissionData.manuscriptFile.name} uploaded</p>
        )}
      </div>

      <div>
        <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
        <div className="mt-2">
          <Input
            id="coverLetter"
            type="file"
            accept=".doc,.docx,.pdf"
            onChange={(e) => handleFileUpload("coverLetter", e.target.files?.[0] || null)}
            className={errors.coverLetter ? "border-red-500" : ""}
            disabled={uploading}
          />
        </div>
        {errors.coverLetter && <p className="text-red-500 text-sm mt-1">{errors.coverLetter}</p>}
        <p className="text-sm text-gray-500 mt-1">Include a cover letter explaining your submission</p>
        {submissionData.coverLetter && (
          <p className="text-sm text-green-600 mt-1">✓ {submissionData.coverLetter.name} uploaded</p>
        )}
      </div>

      <div>
        <Label htmlFor="supplementary">Supplementary Files</Label>
        <div className="mt-2">
          <Input
            id="supplementary"
            type="file"
            multiple
            accept=".doc,.docx,.pdf,.xls,.xlsx,.zip"
            onChange={(e) => handleMultipleFileUpload(e.target.files)}
            disabled={uploading}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Optional: Additional files, figures, data sets, etc.</p>
        
        {submissionData.uploadedFiles.filter(f => f.type === 'supplementary').length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Uploaded Files:</h4>
            <div className="space-y-2">
              {submissionData.uploadedFiles.filter(f => f.type === 'supplementary').map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">✓ {file.name}</span>
                  <Button
                    onClick={() => setSubmissionData(prev => ({
                      ...prev,
                      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
                    }))}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="funding">Funding Information</Label>
        <Textarea
          id="funding"
          value={submissionData.funding}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, funding: e.target.value }))}
          placeholder="Describe any funding sources for this research"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="acknowledgments">Acknowledgments</Label>
        <Textarea
          id="acknowledgments"
          value={submissionData.acknowledgments}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, acknowledgments: e.target.value }))}
          placeholder="Acknowledge individuals or organizations who contributed to this work"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Required Declarations</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ethicalApproval"
              checked={submissionData.ethicalApproval}
              onCheckedChange={(checked) => setSubmissionData(prev => ({ ...prev, ethicalApproval: checked as boolean }))}
            />
            <Label htmlFor="ethicalApproval" className="text-sm">
              I confirm that this research has received appropriate ethical approval where required
            </Label>
          </div>
          {errors.ethicalApproval && <p className="text-red-500 text-sm">{errors.ethicalApproval}</p>}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="conflictOfInterest"
              checked={submissionData.conflictOfInterest}
              onCheckedChange={(checked) => setSubmissionData(prev => ({ ...prev, conflictOfInterest: checked as boolean }))}
            />
            <Label htmlFor="conflictOfInterest" className="text-sm">
              I declare no conflicts of interest, or I have disclosed all relevant conflicts
            </Label>
          </div>
          {errors.conflictOfInterest && <p className="text-red-500 text-sm">{errors.conflictOfInterest}</p>}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dataAvailability"
              checked={submissionData.dataAvailability}
              onCheckedChange={(checked) => setSubmissionData(prev => ({ ...prev, dataAvailability: checked as boolean }))}
            />
            <Label htmlFor="dataAvailability" className="text-sm">
              I confirm that data availability statements are accurate and complete
            </Label>
          </div>
          {errors.dataAvailability && <p className="text-red-500 text-sm">{errors.dataAvailability}</p>}
        </div>
      </div>
    </div>
  )

  const steps = [
    { number: 1, title: "Manuscript Details", icon: <FileText className="h-5 w-5" /> },
    { number: 2, title: "Authors", icon: <Plus className="h-5 w-5" /> },
    { number: 3, title: "Files", icon: <Upload className="h-5 w-5" /> },
    { number: 4, title: "Declarations", icon: <CheckCircle className="h-5 w-5" /> }
  ]

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submit Manuscript
            </h1>
            <p className="text-gray-600">
              Complete the form below to submit your manuscript for review
            </p>
          </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "border-gray-300 text-gray-500"
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Step {step.number}</p>
                <p className="text-xs text-gray-500">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? "bg-blue-600" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep - 1].icon}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1 || loading || uploading}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button onClick={nextStep} disabled={loading || uploading}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading || uploading}
                >
                  {loading ? "Submitting..." : uploading ? "Uploading Files..." : "Submit Manuscript"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
