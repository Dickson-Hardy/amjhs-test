"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  Download,
  Eye,
  Clock,
  FileCheck,
  Files
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RevisionSubmissionFormProps {
  articleId: string
  articleTitle: string
  onSubmissionComplete: (versionNumber: number, revisionId: string) => void
  onCancel: () => void
}

interface UploadedFile {
  file: File
  progress: number
  uploaded: boolean
}

export default function RevisionSubmissionForm({
  articleId,
  articleTitle,
  onSubmissionComplete,
  onCancel
}: RevisionSubmissionFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // File states
  const [revisedManuscript, setRevisedManuscript] = useState<UploadedFile | null>(null)
  const [cleanCopyManuscript, setCleanCopyManuscript] = useState<UploadedFile | null>(null)
  const [responseLetter, setResponseLetter] = useState<UploadedFile | null>(null)
  const [changeTrackingDoc, setChangeTrackingDoc] = useState<UploadedFile | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([])
  
  // Form data
  const [changeLog, setChangeLog] = useState('')
  const [authorNotes, setAuthorNotes] = useState('')
  
  // Validation states
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [showCleanCopyGuide, setShowCleanCopyGuide] = useState(false)

  const handleFileUpload = (
    files: FileList | null, 
    fileType: 'revised' | 'clean' | 'response' | 'tracking' | 'additional'
  ) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const allowedFormats = ['.pdf', '.doc', '.docx']
    const fileName = file.name.toLowerCase()
    
    if (!allowedFormats.some(format => fileName.endsWith(format))) {
      toast({
        variant: "destructive",
        title: "Invalid File Format",
        description: "Please upload PDF, DOC, or DOCX files only."
      })
      return
    }

    const uploadedFile: UploadedFile = {
      file,
      progress: 0,
      uploaded: false
    }

    // Simulate upload progress
    const interval = setInterval(() => {
      uploadedFile.progress += 10
      if (uploadedFile.progress >= 100) {
        uploadedFile.uploaded = true
        clearInterval(interval)
        
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully.`
        })
      }
      
      // Force re-render by updating state
      switch (fileType) {
        case 'revised':
          setRevisedManuscript({...uploadedFile})
          break
        case 'clean':
          setCleanCopyManuscript({...uploadedFile})
          break
        case 'response':
          setResponseLetter({...uploadedFile})
          break
        case 'tracking':
          setChangeTrackingDoc({...uploadedFile})
          break
        case 'additional':
          setAdditionalFiles(prev => [...prev, uploadedFile])
          break
      }
    }, 200)

    // Initial state update
    switch (fileType) {
      case 'revised':
        setRevisedManuscript(uploadedFile)
        break
      case 'clean':
        setCleanCopyManuscript(uploadedFile)
        break
      case 'response':
        setResponseLetter(uploadedFile)
        break
      case 'tracking':
        setChangeTrackingDoc(uploadedFile)
        break
      case 'additional':
        setAdditionalFiles(prev => [...prev, uploadedFile])
        break
    }
  }

  const removeFile = (fileType: 'revised' | 'clean' | 'response' | 'tracking', index?: number) => {
    switch (fileType) {
      case 'revised':
        setRevisedManuscript(null)
        break
      case 'clean':
        setCleanCopyManuscript(null)
        break
      case 'response':
        setResponseLetter(null)
        break
      case 'tracking':
        setChangeTrackingDoc(null)
        break
    }

    if (fileType === 'additional' && index !== undefined) {
      setAdditionalFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  const validateSubmission = () => {
    const newErrors: string[] = []
    const newWarnings: string[] = []

    // Required files
    if (!revisedManuscript?.uploaded) {
      newErrors.push("Revised manuscript is required")
    }
    if (!responseLetter?.uploaded) {
      newErrors.push("Response letter to reviewers is required")
    }
    if (!changeLog.trim()) {
      newErrors.push("Change log summary is required")
    }

    // Recommendations
    if (!cleanCopyManuscript?.uploaded) {
      newWarnings.push("Clean copy manuscript (without track changes) is strongly recommended")
    }
    if (!changeTrackingDoc?.uploaded) {
      newWarnings.push("Change tracking document is recommended for comprehensive review")
    }

    setErrors(newErrors)
    setWarnings(newWarnings)
    
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateSubmission()) {
      setCurrentStep(3) // Show validation step
      return
    }

    setIsSubmitting(true)
    setCurrentStep(4) // Processing step

    try {
      const revisionData = {
        articleId,
        revisedManuscript: {
          file: revisedManuscript!.file,
          cleanCopyFile: cleanCopyManuscript?.file || null
        },
        responseLetterFile: responseLetter!.file,
        changeTrackingDocument: changeTrackingDoc?.file || null,
        additionalFiles: additionalFiles.map(af => af.file),
        changeLog,
        authorNotes
      }

      const response = await fetch('/api/manuscripts/revisions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revisionData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Revision Submitted Successfully",
          description: `Version ${result.versionNumber} has been submitted for editorial review.`
        })
        onSubmissionComplete(result.versionNumber, result.revisionId)
      } else {
        throw new AppError(result.message || 'Failed to submit revision')
      }

    } catch (error: unknown) {
      logger.error('Revision submission error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit revision. Please try again."
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMessage
      })
      setCurrentStep(3)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFileUploadCard = (
    title: string,
    description: string,
    file: UploadedFile | null,
    fileType: 'revised' | 'clean' | 'response' | 'tracking',
    required: boolean = false,
    icon: React.ReactNode = <FileText className="h-4 w-4" />
  ) => (
    <Card className={`${required && !file?.uploaded ? 'border-red-200' : file?.uploaded ? 'border-green-200' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
          {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          {file?.uploaded && <Badge variant="default" className="text-xs bg-green-100 text-green-800">✓ Uploaded</Badge>}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!file?.uploaded ? (
          <div className="space-y-3">
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files, fileType)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX (Max 25MB)</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{file.file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(fileType)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {file.progress < 100 && (
              <Progress value={file.progress} className="w-full" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Submit Manuscript Revision</h1>
        <p className="text-gray-600">{articleTitle}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Article ID: {articleId}</Badge>
          <Badge variant="outline">Step {currentStep} of 4</Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {['Files', 'Details', 'Review', 'Submit'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">{step}</span>
            {index < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      <Tabs value={`step${currentStep}`} className="space-y-6">
        {/* Step 1: File Uploads */}
        <TabsContent value="step1" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please upload all required files for your revision. Clean copies (without track changes) are required for final publication.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revised Manuscript */}
            {renderFileUploadCard(
              "Revised Manuscript",
              "Updated manuscript with all changes incorporated",
              revisedManuscript,
              'revised',
              true,
              <FileText className="h-4 w-4 text-blue-600" />
            )}

            {/* Clean Copy Manuscript */}
            <div className="space-y-2">
              {renderFileUploadCard(
                "Clean Copy Manuscript",
                "Manuscript without track changes (recommended)",
                cleanCopyManuscript,
                'clean',
                false,
                <FileCheck className="h-4 w-4 text-green-600" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCleanCopyGuide(!showCleanCopyGuide)}
                className="w-full text-xs"
              >
                <Info className="h-3 w-3 mr-1" />
                How to create clean copy
              </Button>
            </div>

            {/* Response Letter */}
            {renderFileUploadCard(
              "Response Letter",
              "Point-by-point response to reviewer comments",
              responseLetter,
              'response',
              true,
              <Files className="h-4 w-4 text-purple-600" />
            )}

            {/* Change Tracking Document */}
            {renderFileUploadCard(
              "Change Tracking Document",
              "Document highlighting all modifications made",
              changeTrackingDoc,
              'tracking',
              false,
              <Eye className="h-4 w-4 text-orange-600" />
            )}
          </div>

          {/* Clean Copy Guide */}
          {showCleanCopyGuide && (
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">How to Create a Clean Copy (Microsoft Word):</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open your revised manuscript with track changes</li>
                    <li>Go to <strong>Review → Accept → Accept All Changes</strong></li>
                    <li>Go to <strong>Review → Delete → Delete All Comments</strong></li>
                    <li>Save with a new name (e.g., "Manuscript_Clean_Copy.docx")</li>
                    <li>Upload this clean version alongside your tracked version</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={!revisedManuscript?.uploaded || !responseLetter?.uploaded}
            >
              Continue to Details
            </Button>
          </div>
        </TabsContent>

        {/* Step 2: Change Log and Notes */}
        <TabsContent value="step2" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Summary</CardTitle>
                <CardDescription>
                  Provide a comprehensive summary of all changes made to the manuscript
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the major changes you made in response to reviewer comments..."
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about sections modified, figures updated, analysis added, etc.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes (Optional)</CardTitle>
                <CardDescription>
                  Any additional information for the editorial team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any additional notes, concerns, or explanations..."
                  value={authorNotes}
                  onChange={(e) => setAuthorNotes(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back to Files
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)}
              disabled={!changeLog.trim()}
            >
              Review Submission
            </Button>
          </div>
        </TabsContent>

        {/* Step 3: Review and Validation */}
        <TabsContent value="step3" className="space-y-6">
          {/* Validation Results */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Please fix the following issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submission Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Summary</CardTitle>
              <CardDescription>Review your revision before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Files Included:</p>
                  <ul className="space-y-1 mt-1">
                    <li className={revisedManuscript?.uploaded ? 'text-green-600' : 'text-red-600'}>
                      {revisedManuscript?.uploaded ? '✓' : '✗'} Revised Manuscript
                    </li>
                    <li className={cleanCopyManuscript?.uploaded ? 'text-green-600' : 'text-gray-500'}>
                      {cleanCopyManuscript?.uploaded ? '✓' : '○'} Clean Copy
                    </li>
                    <li className={responseLetter?.uploaded ? 'text-green-600' : 'text-red-600'}>
                      {responseLetter?.uploaded ? '✓' : '✗'} Response Letter
                    </li>
                    <li className={changeTrackingDoc?.uploaded ? 'text-green-600' : 'text-gray-500'}>
                      {changeTrackingDoc?.uploaded ? '✓' : '○'} Change Tracking
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Change Summary:</p>
                  <p className="text-gray-600 mt-1 text-xs">
                    {changeLog.length > 100 ? `${changeLog.substring(0, 100)}...` : changeLog || 'No summary provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back to Details
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={errors.length > 0 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Revision'}
            </Button>
          </div>
        </TabsContent>

        {/* Step 4: Processing */}
        <TabsContent value="step4" className="space-y-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Revision</h3>
            <p className="text-gray-600">Please wait while we process your submission...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
