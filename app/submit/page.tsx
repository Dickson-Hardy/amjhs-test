"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus, Image, Table, FileSpreadsheet, Mail, Shield, Award, Globe, User, AlertTriangle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import AuthorLayout from "@/components/layouts/author-layout"

import { FileUploadSection } from "@/components/file-upload-section"
import { FormValidationIndicator } from "@/components/form-validation-indicator"
import { validateCurrentStep, type SubmissionFormData } from "@/lib/form-validation"

function SubmitPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState("")
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<unknown>(null)
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({
    manuscript: [],
    figures: [],
    tables: [],
    supplementary: [],
    coverLetter: [],
    ethicsApproval: [],
    copyrightForm: []
  })

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    abstract: "",
    keywords: "",
    funding: "",
    conflicts: "",
    authors: [
      {
        firstName: "",
        lastName: "",
        email: "",
        orcid: "",
        institution: "",
        department: "",
        country: "",
        affiliation: "",
        isCorrespondingAuthor: true,
      }
    ],
    recommendedReviewers: [
      {
        name: "",
        email: "",
        affiliation: "",
        expertise: "",
      },
      {
        name: "",
        email: "",
        affiliation: "",
        expertise: "",
      },
      {
        name: "",
        email: "",
        affiliation: "",
        expertise: "",
      }
    ],
    termsAccepted: false,
    guidelinesAccepted: false,
  })

  // Pre-fill first author with session data
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || []
      setFormData(prev => ({
        ...prev,
        authors: [
          {
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(' ') || "",
            email: session.user.email || "",
            orcid: "",
            institution: "",
            department: "",
            country: "",
            affiliation: "",
            isCorrespondingAuthor: true,
          }
        ]
      }))
    }
  }, [session])

  // Check profile completeness and submission eligibility
  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return
      
      try {
        setProfileLoading(true)
        
        // Check submission eligibility first
        const eligibilityResponse = await fetch('/api/submission/eligibility')
        if (eligibilityResponse.ok) {
          const eligibilityData = await eligibilityResponse.json()
          if (eligibilityData.success) {
            setProfileCompleteness(eligibilityData.eligibility.score)
          }
        }
        
        // Also fetch full profile data for display
        const profileResponse = await fetch('/api/user/profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.success) {
            setProfileData(profileData.profile)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch profile data:', error)
        }
      } finally {
        setProfileLoading(false)
      }
    }

    checkProfile()
  }, [session?.user?.id])

  const handleAddAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, {
        firstName: "",
        lastName: "",
        email: "",
        orcid: "",
        institution: "",
        department: "",
        country: "",
        affiliation: "",
        isCorrespondingAuthor: false,
      }]
    }))
  }

  const handleUpdateAuthor = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => 
        i === index ? { ...author, [field]: value } : author
      )
    }))
  }

  const handleSetCorrespondingAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => ({
        ...author,
        isCorrespondingAuthor: i === index
      }))
    }))
  }

  const handleRemoveAuthor = (index: number) => {
    if (formData.authors.length > 1) {
      setFormData(prev => {
        const newAuthors = prev.authors.filter((_, i) => i !== index)
        // If removing corresponding author, make first author corresponding
        if (prev.authors[index].isCorrespondingAuthor && newAuthors.length > 0) {
          newAuthors[0].isCorrespondingAuthor = true
        }
        return {
          ...prev,
          authors: newAuthors
        }
      })
    }
  }

  // Recommended Reviewers Management Functions
  const handleAddRecommendedReviewer = () => {
    setFormData(prev => ({
      ...prev,
      recommendedReviewers: [...prev.recommendedReviewers, {
        name: "",
        email: "",
        affiliation: "",
        expertise: "",
      }]
    }))
  }

  const handleUpdateRecommendedReviewer = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      recommendedReviewers: prev.recommendedReviewers.map((reviewer, i) => 
        i === index ? { ...reviewer, [field]: value } : reviewer
      )
    }))
  }

  const handleRemoveRecommendedReviewer = (index: number) => {
    if (formData.recommendedReviewers.length > 3) {
      setFormData(prev => ({
        ...prev,
        recommendedReviewers: prev.recommendedReviewers.filter((_, i) => i !== index)
      }))
    }
  }

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChooseFiles = (category: string, accept?: string, multiple = true) => {
    // Create file input and trigger click
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept || '.doc,.docx'
    input.multiple = multiple
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        handleFileUpload(files, category)
      }
    }
    input.click()
  }

  const handleFileUpload = (files: FileList, category: string) => {
    // Simulate file upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          
          // Add files to the uploaded files state
          setUploadedFiles(prev => ({
            ...prev,
            [category]: [...prev[category], ...Array.from(files)]
          }))
          
          toast({
            title: "Files Uploaded Successfully",
            description: `${files.length} file(s) uploaded to ${category}.`,
          })
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const removeFile = (category: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [category]: prev[category].filter((_, index) => index !== fileIndex)
    }))
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNextStep = () => {
    // Use consolidated validation
    const validation = validateCurrentStep(currentStep, formData as SubmissionFormData)
    
    if (!validation.isValid) {
      const firstError = validation.errors[0]
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError,
      })
      return
    }
    
    setSubmissionError("") // Clear any previous errors
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmitManuscript = async () => {
    // Check profile completeness before submission - TEMPORARILY DISABLED
    /*
    try {
      const eligibilityResponse = await fetch('/api/submission/eligibility')
      if (eligibilityResponse.ok) {
        const eligibilityData = await eligibilityResponse.json()
        if (eligibilityData.success && !eligibilityData.eligibility.canSubmit) {
          toast({
            variant: "destructive",
            title: "Profile Incomplete",
            description: `Your profile is only ${eligibilityData.eligibility.score}% complete. You need at least 80% to submit articles.`,
          })
          return
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to check eligibility:', error)
      }
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Unable to verify profile completion. Please try again.",
      })
      return
    }
    */

    // Use consolidated validation for final submission
    const validation = validateCurrentStep(5, formData as SubmissionFormData)
    
    if (!validation.isValid) {
      const firstError = validation.errors[0]
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: firstError,
      })
      return
    }

    setIsSubmitting(true)
    setSubmissionError("")

    try {
      // Prepare submission data according to the schema
      const keywordArray = formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
      
      const submissionData = {
        articleData: {
          title: formData.title,
          abstract: formData.abstract,
          keywords: keywordArray,
          category: formData.category,
          authors: formData.authors.map(author => ({
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            orcid: author.orcid || undefined,
            affiliation: author.affiliation || `${author.institution}, ${author.department}, ${author.country}`.replace(/^, |, $|,\s*,/g, '').trim(),
            isCorrespondingAuthor: author.isCorrespondingAuthor,
          })),
          files: [], // TODO: Add uploaded files integration with Cloudinary
          recommendedReviewers: formData.recommendedReviewers
            .filter(reviewer => reviewer.name.trim() && reviewer.email.trim() && reviewer.affiliation.trim())
            .map(reviewer => ({
              name: reviewer.name.trim(),
              email: reviewer.email.trim(),
              affiliation: reviewer.affiliation.trim(),
              expertise: reviewer.expertise?.trim() || "General expertise",
            })),
          coverLetter: undefined, // TODO: Add cover letter field to form
          ethicalApproval: uploadedFiles.ethicsApproval && uploadedFiles.ethicsApproval.length > 0,
          conflictOfInterest: false, // TODO: Add conflict of interest field to form
          funding: formData.funding || undefined,
        },
        submissionType: "new",
      }

      const response = await fetch('/api/workflow/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Article Submitted Successfully!",
          description: "Your article has been submitted for review. You will receive a confirmation email shortly.",
        })
        // Redirect to success page or dashboard
        router.push(`/dashboard?submitted=true&articleId=${result.article?.id}`)
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: result.error || 'Submission failed. Please try again.',
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Submission error:', error)
      }
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      // Redirect to signup with return URL
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/submit'))
    }
  }, [session, status, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <AuthorLayout>
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submission form...</p>
          </div>
        </div>
      </AuthorLayout>
    )
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to submit an article. Please create an account or sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/auth/signup">Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { number: 1, title: "Article Information", description: "process.env.AUTH_TOKEN_PREFIX + ' 'details about your submission" },
    { number: 2, title: "Authors & Affiliations", description: "Author information and institutional details" },
    { number: 3, title: "Recommended Reviewers", description: "Suggest qualified reviewers for your manuscript" },
    { number: 4, title: "Files & Documents", description: "Upload your manuscript and supporting files" },
    { number: 5, title: "Review & Submit", description: "Final review before submission" },
  ]

  const categories = [
    // Applied Sciences
    "Chemical Engineering", "Materials Science", "Bioengineering", "Food Science", "Applied Physics",
    "Industrial Engineering", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering",
    
    // Life Sciences
    "Biology", "Molecular Biology", "Cell Biology", "Genetics", "Biochemistry", "Microbiology",
    "Ecology", "Botany", "Zoology", "Marine Biology", "Evolutionary Biology", "Neuroscience",
    
    // Medicine & Health Sciences
    "Clinical Medicine", "Public Health", "Biomedical Sciences", "Healthcare Technology",
    "Medical Education", "Global Health", "Preventive Medicine", "Medical Ethics",
    "Cardiology", "Oncology", "Neurology", "Pediatrics", "Surgery", "Internal Medicine",
    
    // Physical Sciences
    "Physics", "Chemistry", "Astronomy", "Geology", "Meteorology", "Oceanography",
    "Materials Physics", "Theoretical Physics", "Quantum Physics", "Nuclear Physics",
    
    // Engineering & Technology
    "Software Engineering", "Computer Engineering", "Aerospace Engineering", "Environmental Engineering",
    "Petroleum Engineering", "Mining Engineering", "Nuclear Engineering", "Robotics",
    
    // Social Sciences
    "Psychology", "Sociology", "Anthropology", "Political Science", "Economics", "Geography",
    "Linguistics", "Archaeology", "Criminology", "International Relations",
    
    // Humanities
    "History", "Philosophy", "Literature", "Art History", "Cultural Studies", "Religious Studies",
    "Ethics", "Comparative Literature", "Classical Studies", "Modern Languages",
    
    // Business & Economics
    "Finance", "Marketing", "Management", "Accounting", "Operations Research", "Entrepreneurship",
    "Business Strategy", "Human Resources", "Supply Chain Management", "International Business",
    
    // Environmental Sciences
    "Environmental Chemistry", "Conservation Biology", "Climate Science", "Environmental Policy",
    "Sustainable Development", "Renewable Energy", "Waste Management",
    
    // Computer Science
    "Artificial Intelligence", "Machine Learning", "Data Science", "Cybersecurity", "Software Development",
    "Human-Computer Interaction", "Computer Graphics", "Database Systems", "Network Security",
    
    // Mathematics
    "Pure Mathematics", "Applied Mathematics", "Statistics", "Mathematical Modeling", "Operations Research",
    "Numerical Analysis", "Probability Theory", "Discrete Mathematics", "Computational Mathematics",
    
    // Education
    "Educational Psychology", "Curriculum Development", "Educational Technology", "Special Education",
    "Higher Education", "Early Childhood Education", "Educational Policy", "Language Education",
    
    // Fine Arts & Architecture
    "Visual Arts", "Performing Arts", "Music Theory", "Art History", "Architecture", "Urban Planning",
    "Interior Design", "Landscape Architecture", "Digital Arts", "Film Studies"
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Submit Your Article</h1>
          <p className="text-gray-600">Share your research with the global academic community</p>
        </div>

        {/* Profile Completeness Warning */}
        {!profileLoading && false && ( /* TEMPORARILY DISABLED: profileCompleteness < 80 */
          <div className="mb-8">
            <Alert className="border-orange-200 bg-orange-50">
              <User className="h-5 w-5 text-orange-600" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Complete Your Profile Before Submitting
                </h3>
                <div className="text-orange-700 space-y-3">
                  <p>
                    Your profile is only <span className="font-bold">{profileCompleteness}% complete</span>. 
                    You need at least 80% profile completion to submit articles.
                  </p>
                  
                  <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold mb-3">Complete these profile sections:</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {!profileData?.name && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Full name required</span>
                        </div>
                      )}
                      {!profileData?.affiliation && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Institutional affiliation</span>
                        </div>
                      )}
                      {(!profileData?.bio || profileData.bio.length < 50) && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Professional biography (50+ chars)</span>
                        </div>
                      )}
                      {!profileData?.orcid && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>ORCID identifier</span>
                        </div>
                      )}
                      {(!profileData?.expertise || profileData.expertise.length === 0) && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Areas of expertise</span>
                        </div>
                      )}
                      {(!profileData?.specializations || profileData.specializations.length === 0) && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Academic specializations</span>
                        </div>
                      )}
                      {(!profileData?.researchInterests || profileData.researchInterests.length === 0) && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Research interests</span>
                        </div>
                      )}
                      {(!profileData?.languagesSpoken || profileData.languagesSpoken.length === 0) && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>Languages spoken</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Button 
                      onClick={() => router.push('/dashboard/profile')}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Complete Profile Now
                    </Button>
                    <Button 
                      onClick={() => {
                        setProfileLoading(true)
                        // Refresh profile completeness
                        fetch('/api/submission/eligibility')
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              setProfileCompleteness(data.eligibility.score)
                            }
                          })
                          .finally(() => setProfileLoading(false))
                      }}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-orange-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${profileCompleteness}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{profileCompleteness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Disable form if profile incomplete */}
        {!profileLoading && false && ( /* TEMPORARILY DISABLED: profileCompleteness < 80 */
          <div className="mb-8 p-6 bg-gray-100 border border-gray-300 rounded-lg text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Submission Temporarily Disabled</h3>
            <p className="text-gray-600">
              Please complete your profile to enable article submissions. This ensures we have all 
              necessary information for the peer review process and author communications.
            </p>
          </div>
        )}

        {/* Show form only if profile is complete enough */}
        {(profileLoading || true) && (
          <>
            {/* Submission Guidelines Warning */}
            <div className="mb-8">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ Important: Submission Guidelines Compliance Required
                  </h3>
              <div className="text-red-700 space-y-2">
                <p className="font-medium">
                  Manuscripts that do not follow the submission guidelines and formatting requirements will be rejected without review.
                </p>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold mb-2">Before submitting, ensure your manuscript includes:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Proper formatting according to journal standards</li>
                    <li>✓ Complete author information for all contributors</li>
                    <li>✓ Abstract at least 250 words minimum</li>
                    <li>✓ Appropriate keywords (4-8 keywords)</li>
                    <li>✓ Proper citation format and reference list</li>
                    <li>✓ Required sections: Introduction, Methods, Results, Discussion, Conclusion</li>
                    <li>✓ High-quality figures and tables with proper captions</li>
                    <li>✓ Ethics approval documentation (if applicable)</li>
                    <li>✓ Conflict of interest declaration</li>
                    <li>✓ Funding information</li>
                  </ul>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Link 
                    href="/submission-guidelines" 
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Read Full Guidelines
                  </Link>
                  <Link 
                    href="/manuscript-template" 
                    className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template
                  </Link>
                </div>
              </div>
            </div>
          </Alert>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${currentStep > step.number ? "bg-blue-600" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center max-w-[200px]">
                <div className="font-medium text-sm text-gray-800">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submissionError && currentStep < 5 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            )}
            
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Manuscript Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="Enter your manuscript title (min. 10 characters)" 
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      <span className={formData.title.length >= 10 ? "text-green-600" : "text-red-500"}>
                        {formData.title.length}/10 characters minimum
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Research Field *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select research field" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, "-")}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abstract">Abstract *</Label>
                  <Textarea
                    id="abstract"
                    placeholder="Provide a structured abstract (minimum 250 words)"
                    className="min-h-[120px]"
                    value={formData.abstract}
                    onChange={(e) => handleFormChange('abstract', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    <span className={formData.abstract.length >= 1250 ? "text-green-600" : "text-red-500"}>
                      {Math.round(formData.abstract.length / 5)} words (minimum 250 words required)
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords *</Label>
                  <Input 
                    id="keywords" 
                    placeholder="Enter at least 3 keywords separated by commas" 
                    value={formData.keywords}
                    onChange={(e) => handleFormChange('keywords', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    <span className={
                      formData.keywords 
                        ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean).length >= 3 
                          ? "text-green-600" 
                          : "text-red-500"
                        : "text-red-500"
                    }>
                      {formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean).length : 0}/4 keywords minimum
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="funding">Grant Information</Label>
                    <Input 
                      id="funding" 
                      placeholder="Grant numbers, sponsoring organizations" 
                      value={formData.funding}
                      onChange={(e) => handleFormChange('funding', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conflicts">Conflicts of Interest</Label>
                    <Select value={formData.conflicts} onValueChange={(value) => handleFormChange('conflicts', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No conflicts to declare</SelectItem>
                        <SelectItem value="financial">Financial conflicts</SelectItem>
                        <SelectItem value="other">Other conflicts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please provide comprehensive information for all authors. Exactly one author must be designated as the corresponding author who will receive all communications.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {formData.authors.map((author, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${author.isCorrespondingAuthor ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          Author {index + 1}
                          {author.isCorrespondingAuthor && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Corresponding Author
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!author.isCorrespondingAuthor && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetCorrespondingAuthor(index)}
                            >
                              Set as Corresponding
                            </Button>
                          )}
                          {formData.authors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAuthor(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-first`}>First Name *</Label>
                          <Input 
                            id={`author${index}-first`} 
                            value={author.firstName}
                            onChange={(e) => handleUpdateAuthor(index, 'firstName', e.target.value)}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-last`}>Last Name *</Label>
                          <Input 
                            id={`author${index}-last`} 
                            value={author.lastName}
                            onChange={(e) => handleUpdateAuthor(index, 'lastName', e.target.value)}
                            placeholder="Enter last name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-email`}>Email Address *</Label>
                          <Input 
                            id={`author${index}-email`} 
                            type="email" 
                            value={author.email}
                            onChange={(e) => handleUpdateAuthor(index, 'email', e.target.value)}
                            placeholder="author@institution.edu"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-orcid`}>ORCID ID</Label>
                          <Input 
                            id={`author${index}-orcid`} 
                            placeholder="0000-0000-0000-0000" 
                            value={author.orcid}
                            onChange={(e) => handleUpdateAuthor(index, 'orcid', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-institution`}>Institution *</Label>
                          <Input 
                            id={`author${index}-institution`} 
                            value={author.institution}
                            onChange={(e) => handleUpdateAuthor(index, 'institution', e.target.value)}
                            placeholder="University or Research Institution"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-department`}>Department *</Label>
                          <Input 
                            id={`author${index}-department`} 
                            value={author.department}
                            onChange={(e) => handleUpdateAuthor(index, 'department', e.target.value)}
                            placeholder="Department or School"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-country`}>Country *</Label>
                          <Select 
                            value={author.country} 
                            onValueChange={(value) => handleUpdateAuthor(index, 'country', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                              <SelectItem value="Albania">Albania</SelectItem>
                              <SelectItem value="Algeria">Algeria</SelectItem>
                              <SelectItem value="Argentina">Argentina</SelectItem>
                              <SelectItem value="Australia">Australia</SelectItem>
                              <SelectItem value="Austria">Austria</SelectItem>
                              <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                              <SelectItem value="Belgium">Belgium</SelectItem>
                              <SelectItem value="Brazil">Brazil</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="China">China</SelectItem>
                              <SelectItem value="Denmark">Denmark</SelectItem>
                              <SelectItem value="Egypt">Egypt</SelectItem>
                              <SelectItem value="Finland">Finland</SelectItem>
                              <SelectItem value="France">France</SelectItem>
                              <SelectItem value="Germany">Germany</SelectItem>
                              <SelectItem value="Ghana">Ghana</SelectItem>
                              <SelectItem value="Greece">Greece</SelectItem>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="Indonesia">Indonesia</SelectItem>
                              <SelectItem value="Ireland">Ireland</SelectItem>
                              <SelectItem value="Israel">Israel</SelectItem>
                              <SelectItem value="Italy">Italy</SelectItem>
                              <SelectItem value="Japan">Japan</SelectItem>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="Malaysia">Malaysia</SelectItem>
                              <SelectItem value="Mexico">Mexico</SelectItem>
                              <SelectItem value="Netherlands">Netherlands</SelectItem>
                              <SelectItem value="New Zealand">New Zealand</SelectItem>
                              <SelectItem value="Nigeria">Nigeria</SelectItem>
                              <SelectItem value="Norway">Norway</SelectItem>
                              <SelectItem value="Pakistan">Pakistan</SelectItem>
                              <SelectItem value="Poland">Poland</SelectItem>
                              <SelectItem value="Portugal">Portugal</SelectItem>
                              <SelectItem value="Russia">Russia</SelectItem>
                              <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                              <SelectItem value="Singapore">Singapore</SelectItem>
                              <SelectItem value="South Africa">South Africa</SelectItem>
                              <SelectItem value="South Korea">South Korea</SelectItem>
                              <SelectItem value="Spain">Spain</SelectItem>
                              <SelectItem value="Sweden">Sweden</SelectItem>
                              <SelectItem value="Switzerland">Switzerland</SelectItem>
                              <SelectItem value="Thailand">Thailand</SelectItem>
                              <SelectItem value="Turkey">Turkey</SelectItem>
                              <SelectItem value="Ukraine">Ukraine</SelectItem>
                              <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                              <SelectItem value="United States">United States</SelectItem>
                              <SelectItem value="Vietnam">Vietnam</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author${index}-affiliation`}>Full Affiliation *</Label>
                          <Input 
                            id={`author${index}-affiliation`} 
                            value={author.affiliation}
                            onChange={(e) => handleUpdateAuthor(index, 'affiliation', e.target.value)}
                            placeholder="Complete institutional affiliation"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full" onClick={handleAddAuthor}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Author
                  </Button>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Author Summary</h4>
                    <div className="text-sm text-gray-600">
                      <p>Total Authors: {formData.authors.length}</p>
                      <p>Corresponding Author: {formData.authors.find(a => a.isCorrespondingAuthor)?.firstName} {formData.authors.find(a => a.isCorrespondingAuthor)?.lastName || "Not designated"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <AlertDescription>
                      <div className="text-blue-800">
                        <h4 className="font-semibold mb-2">📝 Recommended Reviewers Guidelines</h4>
                        <p className="text-sm mb-2">
                          Please suggest a minimum of <strong>3 qualified reviewers</strong> who can evaluate your manuscript. 
                          These should be experts in your field who are not co-authors and have no conflicts of interest.
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>• Choose reviewers who are familiar with your research area</li>
                          <li>• Ensure suggested reviewers have recent publications in relevant journals</li>
                          <li>• Avoid recommending close collaborators or colleagues from your institution</li>
                          <li>• Include reviewers from different institutions and countries when possible</li>
                          <li>• Provide accurate contact information and affiliations</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Recommended Reviewers
                        <Badge variant="secondary">Minimum 3 Required</Badge>
                      </CardTitle>
                      <CardDescription>
                        Suggest qualified experts to review your manuscript
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {formData.recommendedReviewers.map((reviewer, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Reviewer {index + 1}</CardTitle>
                              {formData.recommendedReviewers.length > 3 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveRecommendedReviewer(index)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`reviewer-${index}-name`} className="text-sm font-medium">
                                  Full Name *
                                </Label>
                                <Input
                                  id={`reviewer-${index}-name`}
                                  value={reviewer.name}
                                  onChange={(e) => handleUpdateRecommendedReviewer(index, 'name', e.target.value)}
                                  placeholder="Dr. John Smith"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`reviewer-${index}-email`} className="text-sm font-medium">
                                  Email Address *
                                </Label>
                                <Input
                                  id={`reviewer-${index}-email`}
                                  type="email"
                                  value={reviewer.email}
                                  onChange={(e) => handleUpdateRecommendedReviewer(index, 'email', e.target.value)}
                                  placeholder="john.smith@university.edu"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`reviewer-${index}-affiliation`} className="text-sm font-medium">
                                Affiliation *
                              </Label>
                              <Input
                                id={`reviewer-${index}-affiliation`}
                                value={reviewer.affiliation}
                                onChange={(e) => handleUpdateRecommendedReviewer(index, 'affiliation', e.target.value)}
                                placeholder="Department of Medicine/Engineering/Science, University of Excellence, Country"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`reviewer-${index}-expertise`} className="text-sm font-medium">
                                Area of Expertise (Optional)
                              </Label>
                              <Input
                                id={`reviewer-${index}-expertise`}
                                value={reviewer.expertise}
                                onChange={(e) => handleUpdateRecommendedReviewer(index, 'expertise', e.target.value)}
                                placeholder="Medicine, Computer Science, Physics, etc."
                                className="mt-1"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddRecommendedReviewer}
                        className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Reviewer
                      </Button>

                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>Important:</strong> The editorial team reserves the right to use additional reviewers 
                          beyond those you recommend. Your suggestions will be considered but are not guaranteed to be selected.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <FormValidationIndicator
                  title={formData.title}
                  abstract={formData.abstract}
                  category={formData.category}
                  keywords={formData.keywords}
                  authors={formData.authors}
                  currentStep={currentStep}
                />
                
                <FileUploadSection
                  uploadedFiles={uploadedFiles}
                  onFileUpload={handleFileUpload}
                  onFileRemove={removeFile}
                  uploadProgress={uploadProgress}
                />
              </div>
            )}

            {currentStep === 5 && (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please review all information before submitting. You will receive a confirmation email once your
                    submission is processed.
                  </AlertDescription>
                </Alert>

                {submissionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submissionError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Submission Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">
                          {formData.title || "Not provided"}
                          {formData.title && (
                            <span className={`ml-2 text-xs ${formData.title.length >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                              ({formData.title.length} chars)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Abstract:</span>
                        <span className="font-medium">
                          {formData.abstract ? `${formData.abstract.substring(0, 30)}...` : "Not provided"}
                          {formData.abstract && (
                            <span className={`ml-2 text-xs ${formData.abstract.length >= 1250 ? 'text-green-600' : 'text-red-500'}`}>
                              ({Math.round(formData.abstract.length / 5)} words)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{formData.category || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Authors:</span>
                        <span className="font-medium">{formData.authors.length} author{formData.authors.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Corresponding Author:</span>
                        <span className="font-medium">
                          {(() => {
                            const correspondingAuthor = formData.authors.find(a => a.isCorrespondingAuthor)
                            return correspondingAuthor 
                              ? `${correspondingAuthor.firstName} ${correspondingAuthor.lastName} (${correspondingAuthor.email})`
                              : "Not designated"
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Keywords:</span>
                        <span className="font-medium">
                          {formData.keywords ? formData.keywords.split(',').length : 0} keywords
                          {formData.keywords && (
                            <span className={`ml-2 text-xs ${
                              formData.keywords.split(',').map(k => k.trim()).filter(Boolean).length >= 3 
                                ? 'text-green-600' 
                                : 'text-red-500'
                            }`}>
                              ({formData.keywords.split(',').map(k => k.trim()).filter(Boolean).length} valid)
                            </span>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => handleFormChange('termsAccepted', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/ethics" className="text-blue-600 hover:underline">
                        Publication Ethics
                      </Link>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guidelines" 
                      checked={formData.guidelinesAccepted}
                      onCheckedChange={(checked) => handleFormChange('guidelinesAccepted', checked)}
                    />
                    <Label htmlFor="guidelines" className="text-sm font-medium">
                      <span className="text-red-600">*</span> I confirm that my manuscript follows all{" "}
                      <Link href="/submission-guidelines" className="text-blue-600 hover:underline font-semibold">
                        submission guidelines and formatting requirements
                      </Link>
                      . I understand that manuscripts not meeting these requirements will be rejected without review.
                    </Label>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50" 
                  onClick={handleSubmitManuscript}
                  disabled={
                    isSubmitting || 
                    !formData.termsAccepted ||
                    !formData.guidelinesAccepted ||
                    formData.title.length < 10 ||
                    formData.abstract.length < 100 ||
                    !formData.category ||
                    (formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean).length < 3 : true)
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Article"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default function SubmitPage() {
  return (
    <AuthorLayout>
      <SubmitPageContent />
    </AuthorLayout>
  )
}
