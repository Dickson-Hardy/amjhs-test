"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  UserCheck, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  User,
  Mail,
  BookOpen,
  Award,
  Clock
} from "lucide-react"

export default function ReviewerApplicationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    orcid: "",
    
    // Professional Information
    currentPosition: "",
    institution: "",
    department: "",
    yearsExperience: "",
    
    // Expertise Areas
    primarySpecialty: "",
    secondarySpecialties: [] as string[],
    researchAreas: "",
    
    // Qualifications
    highestDegree: "",
    graduationYear: "",
    publications: "",
    previousReviewExperience: "",
    
    // Preferences
    reviewFrequency: "",
    conflictInstitutions: "",
    languageProficiency: [] as string[],
    
    // Agreements
    agreeToTerms: false,
    agreeToConfidentiality: false,
    agreeToTimelines: false,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/reviewer/apply'))
    } else {
      // Pre-fill form with session data if available
      setFormData(prev => ({
        ...prev,
        firstName: session.user?.name?.split(' ')[0] || '',
        lastName: session.user?.name?.split(' ').slice(1).join(' ') || '',
        email: session.user?.email || '',
      }))
    }
  }, [session, status, router])

  const specialties = [
    // Applied Sciences
    "Chemical Engineering", "Materials Science", "Bioengineering", "Food Science", "Applied Physics",
    "Industrial Engineering", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering",
    
    // Life Sciences
    "Biology", "Molecular Biology", "Cell Biology", "Genetics", "Biochemistry", "Microbiology",
    "Ecology", "Botany", "Zoology", "Marine Biology", "Evolutionary Biology", "Neuroscience",
    
    // Medicine & Health Sciences
    "Cardiology", "Oncology", "Neurology", "Pediatrics", "Surgery", "Internal Medicine",
    "Emergency Medicine", "Psychiatry", "Radiology", "Pathology", "Anesthesiology",
    "Dermatology", "Orthopedics", "Obstetrics & Gynecology", "Ophthalmology",
    "Otolaryngology (ENT)", "Urology", "Public Health", "Epidemiology", "Health Policy",
    "Medical Education", "Global Health", "Infectious Diseases", "Tropical Medicine",
    "Family Medicine", "Preventive Medicine", "Rehabilitation Medicine", "Geriatrics",
    
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
    "Sustainable Development", "Environmental Engineering", "Renewable Energy", "Waste Management",
    
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

  const languages = ["English", "French", "Arabic", "Portuguese", "Swahili", "Hausa", "Amharic"]

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      secondarySpecialties: prev.secondarySpecialties.includes(specialty)
        ? prev.secondarySpecialties.filter(s => s !== specialty)
        : [...prev.secondarySpecialties, specialty]
    }))
  }

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languageProficiency: prev.languageProficiency.includes(language)
        ? prev.languageProficiency.filter(l => l !== language)
        : [...prev.languageProficiency, language]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms || !formData.agreeToConfidentiality || !formData.agreeToTimelines) {
      setMessage({ type: "error", text: "Please agree to all terms and conditions" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/reviewer/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "Application submitted successfully! We'll review your application and contact you within 5-7 business days." 
        })
        // Redirect after success
        setTimeout(() => {
          router.push('/reviewer/application-submitted')
        }, 3000)
      } else {
        setMessage({ type: "error", text: result.message || "Failed to submit application" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <UserCheck className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Become a Reviewer
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Join our expert reviewer network and contribute to advancing medical science in Africa. 
                Help maintain the highest standards of research publication.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  10-15 minutes
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Application form
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Response in 5-7 days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Overview */}
        <Alert className="mb-8 border-indigo-200 bg-indigo-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-indigo-800">
            <strong>Requirements:</strong> Advanced degree (MD, PhD, or equivalent), current research activity, 
            publication track record, and commitment to timely reviews (21 days maximum).
          </AlertDescription>
        </Alert>

        {message && (
          <Alert className={`mb-8 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>process.env.AUTH_TOKEN_PREFIX + ' 'contact and identification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="orcid">ORCID ID</Label>
                <Input
                  id="orcid"
                  value={formData.orcid}
                  onChange={(e) => handleInputChange('orcid', e.target.value)}
                  placeholder="0000-0000-0000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Professional Information
              </CardTitle>
              <CardDescription>Current position and institutional affiliation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPosition">Current Position *</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                  placeholder="Professor, Senior Researcher, Attending Physician, etc."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => handleInputChange('institution', e.target.value)}
                    placeholder="University, Hospital, Research Center"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department/Division</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department of Medicine, Surgery, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Research Experience *</Label>
                <Select value={formData.yearsExperience} onValueChange={(value) => handleInputChange('yearsExperience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-5">2-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10-15">10-15 years</SelectItem>
                    <SelectItem value="15-20">15-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Expertise Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Areas of Expertise
              </CardTitle>
              <CardDescription>Your specialized knowledge and research interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primarySpecialty">Primary Medical Specialty *</Label>
                <Select value={formData.primarySpecialty} onValueChange={(value) => handleInputChange('primarySpecialty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Secondary Specialties (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {specialties.filter(s => s !== formData.primarySpecialty).map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.secondarySpecialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty)}
                      />
                      <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="researchAreas">Specific Research Areas *</Label>
                <Textarea
                  id="researchAreas"
                  value={formData.researchAreas}
                  onChange={(e) => handleInputChange('researchAreas', e.target.value)}
                  placeholder="Describe your specific research interests, methodologies, and areas of expertise..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Qualifications</CardTitle>
              <CardDescription>Educational background and research experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="highestDegree">Highest Degree *</Label>
                  <Select value={formData.highestDegree} onValueChange={(value) => handleInputChange('highestDegree', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MD">MD</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="MD-PhD">MD-PhD</SelectItem>
                      <SelectItem value="MPH">MPH</SelectItem>
                      <SelectItem value="MSc">MSc</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="graduationYear">Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    value={formData.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                    placeholder="YYYY"
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="publications">Recent Publications (Last 5 years) *</Label>
                <Textarea
                  id="publications"
                  value={formData.publications}
                  onChange={(e) => handleInputChange('publications', e.target.value)}
                  placeholder="List your most relevant recent publications, including first-author and senior-author papers..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="previousReviewExperience">Previous Review Experience</Label>
                <Textarea
                  id="previousReviewExperience"
                  value={formData.previousReviewExperience}
                  onChange={(e) => handleInputChange('previousReviewExperience', e.target.value)}
                  placeholder="Describe your previous peer review experience, including journals and approximate number of reviews..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Review Preferences</CardTitle>
              <CardDescription>Your availability and preferences for reviewing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reviewFrequency">Preferred Review Frequency *</Label>
                <Select value={formData.reviewFrequency} onValueChange={(value) => handleInputChange('reviewFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-3/year">2-3 reviews per year</SelectItem>
                    <SelectItem value="4-6/year">4-6 reviews per year</SelectItem>
                    <SelectItem value="6-10/year">6-10 reviews per year</SelectItem>
                    <SelectItem value="10+/year">10+ reviews per year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language Proficiency (Select all that apply) *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {languages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={formData.languageProficiency.includes(language)}
                        onCheckedChange={() => handleLanguageToggle(language)}
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="conflictInstitutions">Conflict of Interest Institutions</Label>
                <Textarea
                  id="conflictInstitutions"
                  value={formData.conflictInstitutions}
                  onChange={(e) => handleInputChange('conflictInstitutions', e.target.value)}
                  placeholder="List any institutions where you have conflicts of interest (current/former employers, collaborators, etc.)"
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Agreements */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Agreements</CardTitle>
              <CardDescription>Please review and agree to the following terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                    I agree to the <Link href="/reviewer/guidelines" className="text-indigo-600 hover:underline">Reviewer Guidelines</Link> and 
                    understand my responsibilities as a peer reviewer for AJRS.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToConfidentiality"
                    checked={formData.agreeToConfidentiality}
                    onCheckedChange={(checked) => handleInputChange('agreeToConfidentiality', checked)}
                  />
                  <Label htmlFor="agreeToConfidentiality" className="text-sm leading-relaxed">
                    I agree to maintain strict confidentiality of all manuscripts and review materials, 
                    and will not share or discuss them with unauthorized parties.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTimelines"
                    checked={formData.agreeToTimelines}
                    onCheckedChange={(checked) => handleInputChange('agreeToTimelines', checked)}
                  />
                  <Label htmlFor="agreeToTimelines" className="text-sm leading-relaxed">
                    I commit to completing assigned reviews within 21 days and will request extensions 
                    promptly if circumstances prevent timely completion.
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Application...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
