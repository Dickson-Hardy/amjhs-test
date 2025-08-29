"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Eye, 
  FileText, 
  MessageSquare,
  Shield,
  Download,
  AlertCircle,
  User,
  Mail,
  Star
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReviewerGuidelinesPage() {
  const { toast } = useToast()
  
  const downloadGuideline = (type: string) => {
    // This would trigger a download of the PDF guidelines
    if (process.env.NODE_ENV === 'development') {
      console.log(`Downloading ${type} guidelines...`)
    }
    toast({
      title: "Download Starting",
      description: `${type} guidelines download is starting...`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Reviewer Guidelines
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Comprehensive guidelines for peer reviewers to ensure high-quality, ethical, and constructive manuscript evaluation
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  onClick={() => downloadGuideline('Complete')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Guidelines
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/reviewer/apply">Become a Reviewer</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <Alert className="mb-8 border-indigo-200 bg-indigo-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-indigo-800">
            <strong>Key Deadlines:</strong> Complete reviews within 21 days of assignment. 
            Request extensions early if needed. Contact editorial@amhsj.org for support.
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Overview</CardTitle>
            <CardDescription>
              Our peer review process maintains the highest standards of medical publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                As a peer reviewer for the African Medical and Health Sciences Journal (AMHSJ), you play a crucial 
                role in maintaining the quality and integrity of medical literature. Your expertise helps ensure 
                that published research meets the highest scientific standards and contributes meaningfully to 
                advancing healthcare in Africa and globally.
              </p>
              <p className="text-gray-700">
                This comprehensive guide outlines expectations, processes, and best practices for conducting 
                thorough, fair, and constructive peer reviews.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reviewer Responsibilities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Reviewer Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-700">Primary Duties</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Evaluate scientific quality and methodology
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Assess clinical relevance and significance
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Review ethical compliance and standards
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Provide constructive feedback to authors
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Recommend editorial decisions
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-blue-700">Ethical Obligations</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Maintain strict confidentiality
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Declare conflicts of interest
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Provide objective, unbiased reviews
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Report suspected misconduct
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Respect intellectual property
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Review Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold mb-2">1. Assignment Notification</h4>
                <p className="text-sm text-gray-700 mb-2">
                  You'll receive an email invitation with manuscript details and deadline. 
                  Respond within 48 hours to accept or decline.
                </p>
                <p className="text-xs text-gray-600">⏱️ Response time: 48 hours</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">2. Initial Assessment</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Download and review the manuscript, checking for scope fit, 
                  ethical approval, and basic quality standards.
                </p>
                <p className="text-xs text-gray-600">⏱️ Timeline: 2-3 days</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold mb-2">3. Detailed Review</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Conduct thorough evaluation using our structured review form. 
                  Focus on methodology, results, and clinical significance.
                </p>
                <p className="text-xs text-gray-600">⏱️ Timeline: 14-18 days</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold mb-2">4. Report Submission</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Submit your completed review through the online portal with 
                  recommendation and detailed comments.
                </p>
                <p className="text-xs text-gray-600">⏱️ Deadline: 21 days total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Criteria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              Review Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-indigo-700">Scientific Quality (35%)</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Research design appropriateness</li>
                    <li>• Sample size and statistical power</li>
                    <li>• Data collection methods</li>
                    <li>• Statistical analysis validity</li>
                    <li>• Result interpretation accuracy</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-green-700">Clinical Relevance (25%)</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Patient care implications</li>
                    <li>• Healthcare system impact</li>
                    <li>• African health priorities</li>
                    <li>• Practical applicability</li>
                    <li>• Cost-effectiveness considerations</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">Presentation Quality (20%)</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Writing clarity and flow</li>
                    <li>• Logical organization</li>
                    <li>• Figure and table quality</li>
                    <li>• Abstract accuracy</li>
                    <li>• Reference completeness</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-700">Ethical Standards (20%)</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Ethics committee approval</li>
                    <li>• Informed consent procedures</li>
                    <li>• Data privacy protection</li>
                    <li>• Conflict of interest disclosure</li>
                    <li>• Plagiarism and originality</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Writing Effective Reviews */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              Writing Effective Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Structure Your Review</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 text-green-700">Summary</h5>
                    <p className="text-sm text-gray-700">
                      Brief overview of the study's main findings and contribution
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 text-blue-700">Major Issues</h5>
                    <p className="text-sm text-gray-700">
                      Significant methodological or interpretive concerns
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 text-purple-700">Minor Issues</h5>
                    <p className="text-sm text-gray-700">
                      Editorial suggestions and clarifications needed
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Best Practices</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2 text-green-700">Do:</h5>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Be specific and provide examples</li>
                      <li>• Suggest constructive improvements</li>
                      <li>• Reference relevant literature</li>
                      <li>• Maintain professional tone</li>
                      <li>• Focus on the science, not the author</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2 text-red-700">Don't:</h5>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Make personal attacks</li>
                      <li>• Promote your own work unnecessarily</li>
                      <li>• Provide overly brief comments</li>
                      <li>• Request unreasonable additional work</li>
                      <li>• Reveal your identity to authors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Decision Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-800 mb-2">Accept</h5>
                <p className="text-sm text-green-700">
                  Meets all standards, minor editorial changes only
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Minor Revision</h5>
                <p className="text-sm text-blue-700">
                  Good quality, needs small improvements
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-orange-800 mb-2">Major Revision</h5>
                <p className="text-sm text-orange-700">
                  Significant issues requiring substantial changes
                </p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-semibold text-red-800 mb-2">Reject</h5>
                <p className="text-sm text-red-700">
                  Fundamental flaws or inappropriate for journal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2 text-indigo-600" />
              Resources & Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center"
                onClick={() => downloadGuideline('Review Form')}
              >
                <FileText className="h-8 w-8 mb-2 text-purple-600" />
                <span className="font-medium">Review Form Template</span>
                <span className="text-sm text-gray-600">Structured evaluation form</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center"
                onClick={() => downloadGuideline('Ethics')}
              >
                <Shield className="h-8 w-8 mb-2 text-green-600" />
                <span className="font-medium">Ethics Checklist</span>
                <span className="text-sm text-gray-600">Ethical review guidelines</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center"
                onClick={() => downloadGuideline('Statistical')}
              >
                <Eye className="h-8 w-8 mb-2 text-blue-600" />
                <span className="font-medium">Statistical Review Guide</span>
                <span className="text-sm text-gray-600">Data analysis evaluation</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Support & Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Editorial Support</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Questions about specific manuscripts or review process
                </p>
                <p className="text-sm"><strong>Email:</strong> editorial@amhsj.org</p>
                <p className="text-sm"><strong>Response:</strong> Within 24 hours</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Technical Support</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Portal access, login issues, and technical problems
                </p>
                <p className="text-sm"><strong>Email:</strong> support@amhsj.org</p>
                <p className="text-sm"><strong>Response:</strong> Within 12 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
