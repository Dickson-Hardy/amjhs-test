"use client"

import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Upload, 
  Eye, 
  Download,
  AlertCircle,
  BookOpen,
  Users,
  Mail,
  Globe,
  Shield,
  Award
} from "lucide-react"

export default function AuthorGuidelinesPage() {
  const submissionTypes = [
    {
      type: "Original Research Articles",
      description: "Reports of original medical and health sciences research",
      wordLimit: "3000 words maximum",
      abstractLimit: "300 words",
      references: "Vancouver format",
      figures: "Allow 250 words per table/figure",
      color: "blue"
    },
    {
      type: "Review Articles", 
      description: "Comprehensive reviews of current topics in health sciences",
      wordLimit: "3500 words maximum",
      abstractLimit: "300 words", 
      references: "Vancouver format",
      figures: "Allow 250 words per table/figure",
      color: "green"
    },
    {
      type: "Case/Audit Reports",
      description: "Detailed reports of interesting clinical cases",
      wordLimit: "800 words maximum",
      abstractLimit: "300 words",
      references: "Vancouver format", 
      figures: "Allow 250 words per table/figure",
      color: "purple"
    },
    {
      type: "Letters",
      description: "Brief communications to the editor",
      wordLimit: "As appropriate",
      abstractLimit: "Not required",
      references: "Vancouver format",
      figures: "Minimal", 
      color: "orange"
    }
  ]

  const getColorClass = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50", 
      purple: "border-purple-200 bg-purple-50",
      orange: "border-orange-200 bg-orange-50"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const submissionSteps = [
    {
      step: 1,
      title: "Prepare Your Manuscript",
      description: "Follow our formatting guidelines and prepare all required files",
      icon: <FileText className="h-5 w-5" />,
      details: ["Format according to guidelines", "Prepare figures and tables", "Complete all required forms"]
    },
    {
      step: 2, 
      title: "Submit Online",
      description: "Use our online submission system to upload your manuscript",
      icon: <Upload className="h-5 w-5" />,
      details: ["Create account or login", "Upload manuscript files", "Complete submission forms"]
    },
    {
      step: 3,
      title: "Initial Review",
      description: "Editorial team conducts initial screening for scope and quality",
      icon: <Eye className="h-5 w-5" />,
      details: ["Editorial screening", "Technical check", "Plagiarism detection"]
    },
    {
      step: 4,
      title: "Peer Review",
      description: "Expert reviewers evaluate your manuscript",
      icon: <Users className="h-5 w-5" />,
      details: ["Assigned to reviewers", "Detailed evaluation", "Review reports generated"]
    },
    {
      step: 5,
      title: "Decision & Revision",
      description: "Editorial decision and revision process if needed",
      icon: <CheckCircle className="h-5 w-5" />,
      details: ["Editorial decision", "Revision requests", "Final acceptance"]
    }
  ]

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Author Guidelines
            </h1>
            <p className="text-gray-600">
              Comprehensive guidelines for preparing and submitting your manuscript to AMHSJ
            </p>
          </div>

      {/* Quick Start Alert */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>New to AMHSJ?</strong> Start with our{" "}
          <a href="#submission-types" className="text-blue-600 hover:underline">
            submission types
          </a>{" "}
          and{" "}
          <a href="#submission-steps" className="text-blue-600 hover:underline">
            step-by-step guide
          </a>
          .
        </AlertDescription>
      </Alert>

      {/* Submission Types */}
      <div id="submission-types" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Submission Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissionTypes.map((type, index) => (
            <Card key={index} className={`border-2 ${getColorClass(type.color)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className={`border-${type.color}-500 text-${type.color}-700`}>
                    {type.type}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span><strong>Word Limit:</strong> {type.wordLimit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span><strong>Abstract:</strong> {type.abstractLimit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span><strong>References:</strong> {type.references}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span><strong>Figures:</strong> {type.figures}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Submission Steps */}
      <div id="submission-steps" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Submission Process
        </h2>
        <div className="space-y-6">
          {submissionSteps.map((step, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      {step.icon}
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Formatting Guidelines */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Formatting Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Document Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Microsoft Word (.docx) or LaTeX</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>12-point font (Times New Roman or Arial)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Double-spaced text</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>1-inch margins on all sides</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Ethical Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>IRB approval for human studies</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Animal care committee approval</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Conflict of interest disclosure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Author contribution statements</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Submit Manuscript
        </Button>
        <Button variant="outline" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        <Button variant="outline" size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Contact Editor
        </Button>
      </div>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
