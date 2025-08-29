"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Building, 
  GraduationCap, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Info,
  Clock,
  Award
} from "lucide-react"
import { toast } from "sonner"

interface ApplicationFormData {
  // Personal Information
  position: string
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Professional Information
  currentPosition: string
  institution: string
  department: string
  address: string
  country: string
  
  // Academic Background
  highestDegree: string
  fieldOfStudy: string
  yearsOfExperience: number
  researchInterests: string
  expertiseAreas: string[]
  
  // Professional Experience
  academicPositions: string
  industryExperience: string
  editorialExperience: string
  
  // Publications
  totalPublications: number
  hIndex: number
  majorPublications: string
  awardsHonors: string
  
  // Additional Information
  motivationStatement: string
  availabilityCommitment: string
  languageProficiency: string
  
  // Files
  cvFile: File | null
  coverLetter: string
  additionalDocuments: File[]
}

const expertiseOptions = [
  "Machine Learning", "Artificial Intelligence", "Computer Vision", "Natural Language Processing",
  "Cybersecurity", "Blockchain", "Internet of Things", "Cloud Computing", "Edge Computing",
  "Software Engineering", "Data Science", "Robotics", "Human-Computer Interaction",
  "Computer Networks", "Distributed Systems", "Database Systems", "Web Technologies",
  "Mobile Computing", "Embedded Systems", "Computer Graphics", "Virtual Reality",
  "Quantum Computing", "Bioinformatics", "Scientific Computing", "Other"
]

const availablePositions = [
  { value: "associate_editor", label: "Associate Editor", description: "Assist in peer review and editorial decisions" },
  { value: "editorial_board", label: "Editorial Board Member", description: "Provide expertise in specific research areas" },
  { value: "advisory_board", label: "Advisory Board Member", description: "Provide strategic guidance and oversight" },
  { value: "guest_editor", label: "Guest Editor", description: "Lead special issues and themed publications" }
]

export default function EditorialBoardApplicationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    position: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPosition: "",
    institution: "",
    department: "",
    address: "",
    country: "",
    highestDegree: "",
    fieldOfStudy: "",
    yearsOfExperience: 0,
    researchInterests: "",
    expertiseAreas: [],
    academicPositions: "",
    industryExperience: "",
    editorialExperience: "",
    totalPublications: 0,
    hIndex: 0,
    majorPublications: "",
    awardsHonors: "",
    motivationStatement: "",
    availabilityCommitment: "",
    languageProficiency: "",
    cvFile: null,
    coverLetter: "",
    additionalDocuments: []
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login?callbackUrl=/editorial-board/apply")
      return
    }
    
    // Pre-fill user data
    if (session.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        email: session.user.email || ""
      }))
    }
  }, [session, status, router])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleExpertiseToggle = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(expertise)
        ? prev.expertiseAreas.filter(e => e !== expertise)
        : [...prev.expertiseAreas, expertise]
    }))
  }

  const handleFileUpload = (field: string, file: File) => {
    if (field === "cvFile") {
      setFormData(prev => ({ ...prev, cvFile: file }))
    } else if (field === "additionalDocuments") {
      setFormData(prev => ({ 
        ...prev, 
        additionalDocuments: [...prev.additionalDocuments, file] 
      }))
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        return !!(formData.position && formData.firstName && formData.lastName && formData.email)
      case 2: // Professional Information
        return !!(formData.currentPosition && formData.institution)
      case 3: // Academic Background
        return !!(formData.highestDegree && formData.fieldOfStudy && formData.yearsOfExperience)
      case 4: // Experience & Publications
        return !!(formData.motivationStatement && formData.totalPublications !== null)
      case 5: // Documents & Review
        return !!(formData.cvFile && formData.coverLetter)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      toast.error("Please fill in all required fields before proceeding")
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const submitApplication = async () => {
    if (!validateStep(5)) {
      toast.error("Please complete all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Add all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "expertiseAreas") {
          submitData.append(key, JSON.stringify(value))
        } else if (key === "cvFile" && value) {
          submitData.append(key, value)
        } else if (key === "additionalDocuments") {
          (value as File[]).forEach((file, index) => {
            submitData.append(`additionalDocument_${index}`, file)
          })
        } else if (value !== null && value !== undefined) {
          submitData.append(key, value.toString())
        }
      })

      const response = await fetch("/api/editorial-board/apply", {
        method: "POST",
        body: submitData
      })

      if (!response.ok) {
        throw new AppError("Failed to submit application")
      }

      const result = await response.json()
      
      toast.success("Application submitted successfully!")
      router.push(`/editorial-board/application-status?id=${result.applicationId}`)
      
    } catch (error) {
      logger.error("Application submission error:", error)
      toast.error("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = (step: number) => {
    const titles = [
      "Position & Personal Info",
      "Professional Information", 
      "Academic Background",
      "Experience & Publications",
      "Documents & Review"
    ]
    return titles[step - 1]
  }

  const progress = (currentStep / 5) * 100

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Editorial Board Application
          </h1>
          <p className="text-xl text-gray-600">
            Join our distinguished editorial team and help shape the future of research
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of 5</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {[1, 2, 3, 4, 5].map((step) => (
              <span key={step} className={currentStep >= step ? "text-indigo-600 font-medium" : ""}>
                {getStepTitle(step)}
              </span>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {currentStep === 1 && <User className="h-5 w-5 mr-2" />}
              {currentStep === 2 && <Building className="h-5 w-5 mr-2" />}
              {currentStep === 3 && <GraduationCap className="h-5 w-5 mr-2" />}
              {currentStep === 4 && <Award className="h-5 w-5 mr-2" />}
              {currentStep === 5 && <FileText className="h-5 w-5 mr-2" />}
              {getStepTitle(currentStep)}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select your desired position and provide personal details"}
              {currentStep === 2 && "Tell us about your current professional situation"}
              {currentStep === 3 && "Share your academic background and expertise"}
              {currentStep === 4 && "Describe your experience and publications"}
              {currentStep === 5 && "Upload documents and review your application"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Position & Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="position">Position Applied For *</Label>
                  <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePositions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          <div>
                            <div className="font-medium">{pos.label}</div>
                            <div className="text-sm text-gray-500">{pos.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@institution.edu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="currentPosition">Current Position *</Label>
                  <Input
                    id="currentPosition"
                    value={formData.currentPosition}
                    onChange={(e) => handleInputChange("currentPosition", e.target.value)}
                    placeholder="e.g., Professor, Senior Researcher, etc."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="institution">Institution *</Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) => handleInputChange("institution", e.target.value)}
                      placeholder="University or Organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department/Division</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      placeholder="Department or Division"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Complete address including city, state, postal code"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Academic Background */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highestDegree">Highest Degree *</Label>
                    <Select value={formData.highestDegree} onValueChange={(value) => handleInputChange("highestDegree", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phd">Ph.D.</SelectItem>
                        <SelectItem value="masters">Master's</SelectItem>
                        <SelectItem value="bachelors">Bachelor's</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input
                      id="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={(e) => handleInputChange("fieldOfStudy", e.target.value)}
                      placeholder="e.g., Computer Science, Engineering"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange("yearsOfExperience", parseInt(e.target.value))}
                    placeholder="Years in field"
                    min="0"
                  />
                </div>

                <div>
                  <Label>Research Interests</Label>
                  <Textarea
                    value={formData.researchInterests}
                    onChange={(e) => handleInputChange("researchInterests", e.target.value)}
                    placeholder="Describe your research interests and focus areas"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Areas of Expertise</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all areas that apply to your expertise</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {expertiseOptions.map((expertise) => (
                      <div key={expertise} className="flex items-center space-x-2">
                        <Checkbox
                          id={expertise}
                          checked={formData.expertiseAreas.includes(expertise)}
                          onCheckedChange={() => handleExpertiseToggle(expertise)}
                        />
                        <Label htmlFor={expertise} className="text-sm">{expertise}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Selected areas:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.expertiseAreas.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Experience & Publications */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label>Academic Positions</Label>
                  <Textarea
                    value={formData.academicPositions}
                    onChange={(e) => handleInputChange("academicPositions", e.target.value)}
                    placeholder="List your academic positions (current and previous)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Industry Experience</Label>
                  <Textarea
                    value={formData.industryExperience}
                    onChange={(e) => handleInputChange("industryExperience", e.target.value)}
                    placeholder="Describe relevant industry experience"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Editorial Experience</Label>
                  <Textarea
                    value={formData.editorialExperience}
                    onChange={(e) => handleInputChange("editorialExperience", e.target.value)}
                    placeholder="Previous editorial board memberships, journal reviews, etc."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalPublications">Total Publications *</Label>
                    <Input
                      id="totalPublications"
                      type="number"
                      value={formData.totalPublications}
                      onChange={(e) => handleInputChange("totalPublications", parseInt(e.target.value))}
                      placeholder="Number of publications"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hIndex">H-Index</Label>
                    <Input
                      id="hIndex"
                      type="number"
                      value={formData.hIndex}
                      onChange={(e) => handleInputChange("hIndex", parseInt(e.target.value))}
                      placeholder="H-Index (if known)"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Major Publications</Label>
                  <Textarea
                    value={formData.majorPublications}
                    onChange={(e) => handleInputChange("majorPublications", e.target.value)}
                    placeholder="List 5-10 of your most significant publications"
                    rows={5}
                  />
                </div>

                <div>
                  <Label>Awards & Honors</Label>
                  <Textarea
                    value={formData.awardsHonors}
                    onChange={(e) => handleInputChange("awardsHonors", e.target.value)}
                    placeholder="List relevant awards, honors, and recognitions"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Motivation Statement *</Label>
                  <Textarea
                    value={formData.motivationStatement}
                    onChange={(e) => handleInputChange("motivationStatement", e.target.value)}
                    placeholder="Why do you want to join the editorial board? What can you contribute?"
                    rows={5}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Documents & Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label>CV/Resume Upload *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload your CV/Resume (PDF, DOC, DOCX)
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("cvFile", file)
                      }}
                      className="max-w-xs mx-auto"
                    />
                    {formData.cvFile && (
                      <p className="text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        {formData.cvFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Cover Letter *</Label>
                  <Textarea
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange("coverLetter", e.target.value)}
                    placeholder="Write a cover letter explaining your interest and qualifications"
                    rows={6}
                  />
                </div>

                <div>
                  <Label>Availability & Commitment</Label>
                  <Textarea
                    value={formData.availabilityCommitment}
                    onChange={(e) => handleInputChange("availabilityCommitment", e.target.value)}
                    placeholder="Describe your availability and commitment to editorial duties"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Language Proficiency</Label>
                  <Input
                    value={formData.languageProficiency}
                    onChange={(e) => handleInputChange("languageProficiency", e.target.value)}
                    placeholder="e.g., English (native), Spanish (fluent), etc."
                  />
                </div>

                <div>
                  <Label>Additional Documents</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Optional: Upload additional supporting documents
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(file => handleFileUpload("additionalDocuments", file))
                      }}
                      className="max-w-xs mx-auto"
                    />
                    {formData.additionalDocuments.length > 0 && (
                      <div className="mt-2">
                        {formData.additionalDocuments.map((file, index) => (
                          <p key={index} className="text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            {file.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Application Review Process:</strong> Your application will be reviewed by our editorial committee within 2-3 weeks. You'll receive email updates on the status of your application.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {currentStep < 5 ? (
                  <Button onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={submitApplication} 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
