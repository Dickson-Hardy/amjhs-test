"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Eye, 
  FileText, 
  MessageSquare,
  Award,
  Shield,
  Globe,
  BookOpen,
  Mail,
  Star,
  Timer,
  UserCheck,
  Search
} from "lucide-react"

export default function PeerReviewPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleBecomeReviewer = () => {
    if (session) {
      // If logged in, go to reviewer application
      router.push('/reviewer/apply')
    } else {
      // If not logged in, redirect to signup with return URL
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/reviewer/apply'))
    }
  }

  const handleReviewerGuidelines = () => {
    router.push('/reviewer/guidelines')
  }

  const handleApplyToReviewer = () => {
    if (session) {
      router.push('/reviewer/apply')
    } else {
      router.push('/auth/signup?returnUrl=' + encodeURIComponent('/reviewer/apply'))
    }
  }

  const handleReviewerPortalLogin = () => {
    if (session) {
      router.push('/reviewer/dashboard')
    } else {
      router.push('/auth/login?returnUrl=' + encodeURIComponent('/reviewer/dashboard'))
    }
  }
  const reviewStages = [
    {
      stage: 1,
      title: "Initial Submission",
      description: "Author submits manuscript through online system",
      duration: "Immediate",
      icon: <FileText className="h-5 w-5" />,
      color: "blue"
    },
    {
      stage: 2,
      title: "Editorial Screening",
      description: "Editor reviews for scope, quality, and journal fit",
      duration: "3-5 days",
      icon: <Eye className="h-5 w-5" />,
      color: "indigo"
    },
    {
      stage: 3,
      title: "Reviewer Assignment",
      description: "Expert reviewers selected based on expertise",
      duration: "5-7 days",
      icon: <Users className="h-5 w-5" />,
      color: "purple"
    },
    {
      stage: 4,
      title: "Peer Review",
      description: "Reviewers conduct detailed manuscript evaluation",
      duration: "21-45 days",
      icon: <Search className="h-5 w-5" />,
      color: "green"
    },
    {
      stage: 5,
      title: "Editorial Decision",
      description: "Editor makes decision based on reviews",
      duration: "7-10 days",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "orange"
    },
    {
      stage: 6,
      title: "Author Response",
      description: "Revision or resubmission if required",
      duration: "30-60 days",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "red"
    }
  ]

  const reviewCriteria = [
    {
      category: "Scientific Quality",
      weight: "35%",
      aspects: [
        "Research design and methodology",
        "Data quality and statistical analysis", 
        "Validity and reliability of results",
        "Contribution to knowledge"
      ]
    },
    {
      category: "Medical Relevance",
      weight: "25%", 
      aspects: [
        "Clinical significance",
        "Healthcare impact",
        "Patient safety considerations",
        "Practical applications"
      ]
    },
    {
      category: "Presentation Quality",
      weight: "20%",
      aspects: [
        "Clarity of writing",
        "Organization and structure",
        "Figure and table quality",
        "Abstract accuracy"
      ]
    },
    {
      category: "Ethical Standards",
      weight: "20%",
      aspects: [
        "Ethics approval compliance",
        "Informed consent",
        "Data privacy protection",
        "Conflict of interest disclosure"
      ]
    }
  ]

  const getStageColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      green: "bg-green-50 border-green-200 text-green-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      red: "bg-red-50 border-red-200 text-red-700"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Peer Review Process
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Understanding our rigorous peer review system that ensures the highest quality medical and health sciences research
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleBecomeReviewer}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Become a Reviewer
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReviewerGuidelines}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reviewer Guidelines
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">30-45</div>
              <div className="text-sm text-blue-700">Days Average Review</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">3+</div>
              <div className="text-sm text-green-700">Expert Reviewers</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
              <div className="text-sm text-purple-700">Quality Acceptance</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
              <div className="text-sm text-orange-700">Expert Reviewers</div>
            </CardContent>
          </Card>
        </div>

        {/* Review Process Timeline */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review Process Timeline</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewStages.map((stage, index) => (
              <Card key={index} className={`relative ${getStageColor(stage.color)} border-l-4`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                      {stage.stage}
                    </div>
                    <div className="p-2 bg-white rounded-lg">
                      {stage.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{stage.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {stage.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-2" />
                    <span className="font-semibold">{stage.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Review Criteria */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review Criteria</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {reviewCriteria.map((criteria, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{criteria.category}</CardTitle>
                    <Badge className="bg-indigo-100 text-indigo-800">{criteria.weight}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {criteria.aspects.map((aspect, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                        {aspect}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quality Assurance */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Quality Assurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Double-Blind Review</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Authors and reviewers remain anonymous throughout the process to ensure unbiased evaluation.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Multi-Stage Review</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Initial editorial screening</li>
                  <li>• Minimum 2-3 expert reviewers</li>
                  <li>• Statistical review for research articles</li>
                  <li>• Ethics compliance verification</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Conflict of Interest</h4>
                <p className="text-sm text-gray-600">
                  All reviewers declare potential conflicts and recuse themselves when appropriate.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Reviewer Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Expert Selection</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• PhD or MD with relevant expertise</li>
                  <li>• Published research in the field</li>
                  <li>• International reviewer network</li>
                  <li>• Continuous training and updates</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recognition Program</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Annual reviewer awards</li>
                  <li>• Certificate of appreciation</li>
                  <li>• Professional development opportunities</li>
                  <li>• Priority publication for own work</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviewer Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              For Potential Reviewers
            </CardTitle>
            <CardDescription>
              Join our expert reviewer network and contribute to advancing medical science
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Reviewer Requirements</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Advanced degree in relevant field
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Current research activity
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Publication track record
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Commitment to timely reviews
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Ethical review practices
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Review Expectations</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    Complete reviews within 21 days
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 text-purple-600 mr-2" />
                    Provide detailed, constructive feedback
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 text-green-600 mr-2" />
                    Maintain confidentiality
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Suggest improvements when possible
                  </li>
                  <li className="flex items-center">
                    <Eye className="h-4 w-4 text-red-600 mr-2" />
                    Identify any ethical concerns
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleApplyToReviewer}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Apply to Become a Reviewer
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReviewerPortalLogin}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Reviewer Portal Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Editorial Decisions</CardTitle>
            <CardDescription>Possible outcomes after peer review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <strong className="text-green-800">Accept</strong>
                </div>
                <p className="text-sm text-green-700">
                  Manuscript meets all standards and is accepted for publication
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                  <strong className="text-blue-800">Minor Revision</strong>
                </div>
                <p className="text-sm text-blue-700">
                  Small changes required before acceptance
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-orange-600 mr-2" />
                  <strong className="text-orange-800">Major Revision</strong>
                </div>
                <p className="text-sm text-orange-700">
                  Significant changes needed with re-review
                </p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-red-600 mr-2" />
                  <strong className="text-red-800">Reject</strong>
                </div>
                <p className="text-sm text-red-700">
                  Manuscript does not meet journal standards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Editorial Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">For Authors</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Questions about the review process or your submission
                </p>
                <p className="text-sm"><strong>Email:</strong> editorial@amhsj.org</p>
                <p className="text-sm"><strong>Response:</strong> Within 48 hours</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">For Reviewers</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Technical support and reviewer questions
                </p>
                <p className="text-sm"><strong>Email:</strong> reviewers@amhsj.org</p>
                <p className="text-sm"><strong>Response:</strong> Within 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
