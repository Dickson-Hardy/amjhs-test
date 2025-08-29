"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, AlertCircle, Eye, EyeOff, Cpu, Wifi } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/toast-provider"
import { 
  RegistrationData, 
  BasicUserInfo, 
  ReviewerRegistration, 
  EditorRegistration,
  Qualification,
  Publication,
  Reference
} from "@/types/registration"

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const { success, error: showErrorToast } = useToast()

  // process.env.AUTH_TOKEN_PREFIX + ' 'Info State
  const [basicInfo, setBasicInfo] = useState<BasicUserInfo>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "author",
    affiliation: "",
    orcid: "",
    bio: "",
    expertise: [],
    specializations: [],
    languagesSpoken: [],
    researchInterests: []
  })

  // Role-specific state
  const [reviewerData, setReviewerData] = useState<ReviewerRegistration>({
    researchAreas: [],
    qualifications: [],
    publications: [],
    references: [],
    maxReviewsPerMonth: 3,
    availabilityStatus: "available"
  })

  const [editorData, setEditorData] = useState<EditorRegistration>({
    editorType: "associate",
    editorialExperience: "",
    preferredSections: [],
    qualifications: [],
    publications: [],
    references: [],
    maxWorkload: 10
  })

  const handleBasicInfoChange = (field: keyof BasicUserInfo, value: unknown) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayFieldAdd = (field: keyof BasicUserInfo, value: string) => {
    if (value.trim()) {
      setBasicInfo(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
    }
  }

  const removeArrayItem = (field: keyof BasicUserInfo, index: number) => {
    setBasicInfo(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const validateStep1 = () => {
    if (!basicInfo.email || !basicInfo.password || !basicInfo.name || !basicInfo.role) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return false
    }
    if (basicInfo.password !== basicInfo.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return false
    }
    if (basicInfo.password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return false
    }
    setMessage(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) return

    setIsLoading(true)
    setMessage(null)

    try {
      const registrationData: RegistrationData = {
        basicInfo,
        roleSpecificData: selectedRole === "reviewer" ? reviewerData : 
                         selectedRole === "editor" ? editorData : null
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new AppError(data.error || "Registration failed")
      }

      success(
        "Registration Successful!",
        data.message
      )
      
      // Redirect based on role
      setTimeout(() => {
        if (data.requiresApproval) {
          router.push("/auth/success?type=pending")
        } else {
          router.push("/auth/success")
        }
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed"
      setMessage({ type: "error", text: errorMessage })
      showErrorToast("Registration Failed", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setSelectedRole(basicInfo.role)
      setCurrentStep(2)
      setMessage(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Cpu className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="font-bold text-2xl text-gray-800">AMHSJ</div>
              <div className="text-sm text-gray-600 flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                Medical Research Journal
              </div>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {currentStep === 1 ? "Join AMHSJ" : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Application`}
            </CardTitle>
            <div className="flex justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            </div>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={basicInfo.name}
                        onChange={(e) => handleBasicInfoChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={basicInfo.email}
                        onChange={(e) => handleBasicInfoChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={basicInfo.password}
                          onChange={(e) => handleBasicInfoChange("password", e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={basicInfo.confirmPassword}
                          onChange={(e) => handleBasicInfoChange("confirmPassword", e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={basicInfo.role} onValueChange={(value) => handleBasicInfoChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    {basicInfo.role !== "author" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {basicInfo.role === "reviewer" ? "Reviewer applications require approval by our editorial team." : "Editor applications require approval by our editorial board."}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="affiliation">Affiliation</Label>
                      <Input
                        id="affiliation"
                        value={basicInfo.affiliation}
                        onChange={(e) => handleBasicInfoChange("affiliation", e.target.value)}
                        placeholder="University or Institution"
                      />
                    </div>
                    <div>
                      <Label htmlFor="orcid">ORCID ID</Label>
                      <Input
                        id="orcid"
                        placeholder="0000-0000-0000-0000"
                        value={basicInfo.orcid}
                        onChange={(e) => handleBasicInfoChange("orcid", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your research background and interests..."
                      value={basicInfo.bio}
                      onChange={(e) => handleBasicInfoChange("bio", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Research Interests */}
                  <ResearchFieldsInput 
                    label="Research Interests"
                    field="researchInterests"
                    values={basicInfo.researchInterests}
                    onChange={handleArrayFieldAdd}
                    onRemove={removeArrayItem}
                    placeholder="e.g., Cardiology, Oncology, Neuroscience"
                  />

                  {/* Expertise */}
                  <ResearchFieldsInput 
                    label="Areas of Expertise"
                    field="expertise"
                    values={basicInfo.expertise}
                    onChange={handleArrayFieldAdd}
                    onRemove={removeArrayItem}
                    placeholder="e.g., Clinical Research, Biostatistics"
                  />

                  <div className="flex justify-center space-x-4">
                    {basicInfo.role === "author" ? (
                      <Button type="submit" disabled={isLoading} className="px-8">
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    ) : (
                      <Button type="button" onClick={nextStep} className="px-8">
                        Continue to Application
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && selectedRole === "reviewer" && (
                <ReviewerApplicationForm
                  data={reviewerData}
                  setData={setReviewerData}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 2 && selectedRole === "editor" && (
                <EditorApplicationForm
                  data={editorData}
                  setData={setEditorData}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  onBack={() => setCurrentStep(1)}
                />
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Research Fields Input Component
function ResearchFieldsInput({ 
  label, 
  field, 
  values, 
  onChange, 
  onRemove, 
  placeholder 
}: {
  label: string
  field: keyof BasicUserInfo
  values: string[]
  onChange: (field: keyof BasicUserInfo, value: string) => void
  onRemove: (field: keyof BasicUserInfo, index: number) => void
  placeholder: string
}) {
  const [inputValue, setInputValue] = useState("")

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange(field, inputValue)
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex space-x-2 mb-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
        />
        <Button type="button" onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
            <span>{value}</span>
            <button
              type="button"
              onClick={() => onRemove(field, index)}
              className="ml-1 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

// Reviewer Application Form Component
function ReviewerApplicationForm({ 
  data, 
  setData, 
  onSubmit, 
  isLoading, 
  onBack 
}: {
  data: ReviewerRegistration
  setData: (data: ReviewerRegistration) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Complete Your Reviewer Application</h3>
        <p className="text-sm text-muted-foreground">
          Please provide additional information to help us evaluate your application.
        </p>
      </div>

      <div>
        <Label htmlFor="maxReviews">Maximum Reviews Per Month</Label>
        <Select 
          value={data.maxReviewsPerMonth.toString()} 
          onValueChange={(value) => setData({...data, maxReviewsPerMonth: parseInt(value)})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 review</SelectItem>
            <SelectItem value="2">2 reviews</SelectItem>
            <SelectItem value="3">3 reviews</SelectItem>
            <SelectItem value="4">4 reviews</SelectItem>
            <SelectItem value="5">5+ reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Thank you for your interest in becoming a reviewer. Our editorial team will review your application and contact you within 5-7 business days.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Submitting Application..." : "Submit Application"}
        </Button>
      </div>
    </div>
  )
}

// Editor Application Form Component  
function EditorApplicationForm({ 
  data, 
  setData, 
  onSubmit, 
  isLoading, 
  onBack 
}: {
  data: EditorRegistration
  setData: (data: EditorRegistration) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Complete Your Editor Application</h3>
        <p className="text-sm text-muted-foreground">
          Please provide additional information about your editorial experience.
        </p>
      </div>

      <div>
        <Label htmlFor="editorType">Editor Type</Label>
        <Select value={data.editorType} onValueChange={(value) => setData({...data, editorType: value as unknown})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="associate">Associate Editor</SelectItem>
            <SelectItem value="section">Section Editor</SelectItem>
            <SelectItem value="guest">Guest Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="editorialExperience">Editorial Experience</Label>
        <Textarea
          id="editorialExperience"
          placeholder="Describe your previous editorial experience, including journals, years of service, and types of manuscripts handled..."
          value={data.editorialExperience}
          onChange={(e) => setData({...data, editorialExperience: e.target.value})}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="maxWorkload">Maximum Manuscripts Per Month</Label>
        <Select 
          value={data.maxWorkload.toString()} 
          onValueChange={(value) => setData({...data, maxWorkload: parseInt(value)})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 manuscripts</SelectItem>
            <SelectItem value="10">10 manuscripts</SelectItem>
            <SelectItem value="15">15 manuscripts</SelectItem>
            <SelectItem value="20">20+ manuscripts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Thank you for your interest in joining our editorial team. Your application will be reviewed by our editorial board and you will be contacted within 7-10 business days.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Submitting Application..." : "Submit Application"}
        </Button>
      </div>
    </div>
  )
}
