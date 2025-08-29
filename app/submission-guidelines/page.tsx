"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, CheckCircle, AlertCircle, Download, Clock, Users, Award, BookOpen, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SubmissionGuidelinesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleStartSubmission = () => {
    router.push('/submit')
  }

  const handleDownloadResource = (resourceName: string) => {
    // In a real implementation, these would link to actual downloadable files
    const downloadLinks = {
      'Author Checklist': '/downloads/author-checklist.pdf',
      'Manuscript Template': '/downloads/manuscript-template.docx',
      'Figure Guidelines': '/downloads/figure-guidelines.pdf',
      'Reference Style Guide': '/downloads/reference-style-guide.pdf'
    }
    
    const link = downloadLinks[resourceName as keyof typeof downloadLinks]
    if (link) {
      toast({
        title: "Download Starting",
        description: `Download would start for: ${resourceName}`,
      })
      // In production: window.open(link, '_blank')
    }
  }

  const handleContactEditorial = () => {
    router.push('/contact')
  }
  const articleTypes = [
    {
      type: "Original Research Articles",
      description: "Reports of original medical and health sciences research",
      wordLimit: "3000 words maximum",
      abstractLimit: "300 words maximum",
      references: "APA format",
      figures: "Allow 250 words per table/figure"
    },
    {
      type: "Review Articles", 
      description: "Comprehensive reviews of current topics in health sciences",
      wordLimit: "3500 words maximum",
      abstractLimit: "300 words maximum", 
      references: "APA format",
      figures: "Allow 250 words per table/figure"
    },
    {
      type: "Case/Audit Reports",
      description: "Detailed reports of interesting clinical cases",
      wordLimit: "800 words maximum",
      abstractLimit: "300 words maximum",
      references: "APA format", 
      figures: "Allow 250 words per table/figure"
    },
    {
      type: "Letters",
      description: "Brief communications to the editor",
      wordLimit: "As appropriate",
      abstractLimit: "Not required",
      references: "APA format",
      figures: "Minimal"
    }
  ]

  const submissionSteps = [
    {
      step: 1,
      title: "Prepare Your Manuscript",
      description: "Format according to guidelines and prepare all required files",
      icon: FileText,
    },
    {
      step: 2,
      title: "Create Account",
      description: "Register on our submission platform with ORCID integration",
      icon: Users,
    },
    {
      step: 3,
      title: "Upload Files",
      description: "Submit manuscript, figures, and supplementary materials",
      icon: Upload,
    },
    {
      step: 4,
      title: "Review & Submit",
      description: "Review all information and complete submission",
      icon: CheckCircle,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Submission Guidelines</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            African Medical and Health Sciences Journal (AMHSJ) submission guidelines. Please read carefully before submission.
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-lg font-semibold text-blue-800 mb-2">
              Submit manuscripts to: <span className="text-blue-600">editor@amhsjournal.org</span>
            </p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Peer-review timeframe: <strong>14 days</strong></p>
              <p>• Publication timeline: <strong>4-6 weeks after submission</strong></p>
              <p>• ISSN: Print 2672-4588 | Online 2672-4596</p>
            </div>
          </div>
        </div>

        {/* Rejection Warning */}
        <Alert className="mb-8 border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <div className="text-red-800">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2" />
                ⚠️ CRITICAL: Compliance Required for Review
              </h3>
              <div className="bg-red-100 p-4 rounded-lg border border-red-200 mb-4">
                <p className="font-semibold text-lg mb-2">
                  Manuscripts that do not follow these submission guidelines and formatting requirements will be REJECTED without review.
                </p>
                <p className="mb-3">
                  To avoid rejection, ensure your manuscript meets ALL requirements listed in these guidelines before submission.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Common Rejection Reasons:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Incorrect formatting or template use</li>
                      <li>Incomplete author information</li>
                      <li>Missing ethics approvals</li>
                      <li>Improper reference formatting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Before Submission:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use the official manuscript template</li>
                      <li>Complete the author checklist</li>
                      <li>Verify all required sections</li>
                      <li>Check figure and table quality</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-center">
                <strong>Take time to review these guidelines thoroughly - it will save time and ensure faster review.</strong>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Quick Start */}
        <Alert className="mb-8 border-indigo-200 bg-indigo-50">
          <AlertCircle className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>Quick Start:</strong> New to AMHSJ? Download our{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-indigo-600 underline"
              onClick={() => handleDownloadResource('Author Checklist')}
            >
              Author Checklist
            </Button>{" "}
            and{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-indigo-600 underline"
              onClick={() => handleDownloadResource('Manuscript Template')}
            >
              Manuscript Template
            </Button>{" "}
            to get started quickly. All submissions must not have been published previously in any printed or electronic media.
          </AlertDescription>
        </Alert>

        {/* Article Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Article Types</CardTitle>
            <CardDescription>AMHSJ accepts the following types of submissions. All papers will be peer-reviewed by at least three independent referees.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {articleTypes.map((article, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{article.type}</h3>
                  <p className="text-gray-600 mb-4">{article.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Word Limit:</span>
                      <span className="font-medium">{article.wordLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Abstract:</span>
                      <span className="font-medium">{article.abstractLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">References:</span>
                      <span className="font-medium">{article.references}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Figures:</span>
                      <span className="font-medium">{article.figures}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Important Note:</h4>
              <p className="text-sm text-amber-700">
                Allow 250 words for each table, figure or group of eight references when calculating total word count.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submission Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Submission Process</CardTitle>
            <CardDescription>Follow these steps to submit your manuscript</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {submissionSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="bg-indigo-600 text-white rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleStartSubmission}
              >
                <Upload className="mr-2 h-5 w-5" />
                Start Submission
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manuscript Preparation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Manuscript Preparation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Requirements</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Font: Times New Roman, size 12, double-spaced
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Single column format using Microsoft Word
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Pages numbered consecutively
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Word count provided (excluding references, tables, legends)
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    References in APA format
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Title Page Requirements</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Full title of the article
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Names and up to 2 degrees of all authors
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Department(s) and institution(s)
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Five keywords
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Corresponding author name, email and postal address
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manuscript Structure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Abstract Structure</CardTitle>
            <CardDescription>Required structure for abstracts (maximum 300 words)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  section: "Background",
                  description: "Study rationale, context, and what was previously known",
                },
                {
                  section: "Objectives",
                  description: "Clear statement of study aims and research questions",
                },
                { section: "Methods", description: "Study design, participants, procedures, and analytical methods" },
                { section: "Results", description: "Main findings with key data and statistical significance" },
                { section: "Conclusion", description: "Principal conclusions and their clinical/scientific implications" }
              ].map((item, index) => (
                <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                  <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.section}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Note for Original Articles:</h4>
              <p className="text-sm text-blue-700">
                All original article contributions should contain a structured abstract not exceeding 300 words following the Background, Objectives, Methods, Results, and Conclusion format.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Covering Letter & Submission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Covering Letter & Submission Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Covering Letter</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Must identify the corresponding author</li>
                  <li>• Must be signed by all co-authors</li>
                  <li>• Only those who have contributed significantly should be included as authors</li>
                  <li>• Corresponding author should explain any authors unable to sign</li>
                  <li>• All authors must sign declaration and copyright form when manuscript is accepted</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Process</h3>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-800 mb-2">Email Submission</h4>
                  <p className="text-blue-700 text-lg font-semibold mb-2">editor@amhsjournal.org</p>
                  <div className="text-sm text-blue-600 space-y-1">
                    <p>• Peer-review timeframe: <strong>14 days</strong></p>
                    <p>• Manuscripts are anonymized including peer-reviewer comments</p>
                    <p>• Publication target: <strong>4-6 weeks after submission</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peer Review Criteria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Peer Review Criteria</CardTitle>
            <CardDescription>Criteria used by reviewers to evaluate manuscripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Structure & Content</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Does the title reflect the contents of the article?</li>
                  <li>• Does abstract reflect all study aspects (background, objectives, methods, results, conclusions)?</li>
                  <li>• Is study rationale adequately described?</li>
                  <li>• Are objectives clearly stated and defined?</li>
                  <li>• Do results justify the conclusions?</li>
                  <li>• Is the paper clearly written with logical flow?</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Methodology & Analysis</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Is study design appropriate for objectives?</li>
                  <li>• Is sample size appropriate and justified?</li>
                  <li>• Are data collection methods well described?</li>
                  <li>• Are bias minimization techniques documented?</li>
                  <li>• Are data analysis methods appropriate?</li>
                  <li>• Is statistical significance well documented?</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Discussion & References</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Are key findings clearly stated?</li>
                  <li>• Are differences with other studies discussed?</li>
                  <li>• Are implications clearly explained?</li>
                  <li>• Are references appropriate, relevant and up-to-date?</li>
                  <li>• Do references follow APA style correctly?</li>
                  <li>• Any obvious important references missing?</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Ethics & Quality</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Are ethical considerations adequately described?</li>
                  <li>• Is ethics approval documented (for human studies)?</li>
                  <li>• Are results credible and findings presented logically?</li>
                  <li>• Are there grammar/spelling/language problems?</li>
                  <li>• Is interpretation warranted by the data?</li>
                  <li>• Are conflicts of interest declared?</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authorship & Publication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Authorship & Publication Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ICMJE Authorship Criteria</h3>
                <p className="text-sm text-gray-600 mb-3">All authors must meet ALL four criteria:</p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Substantial contributions to conception/design OR data acquisition/analysis/interpretation</li>
                  <li>• Drafting the work OR revising it critically for important intellectual content</li>
                  <li>• Final approval of the version to be published</li>
                  <li>• Agreement to be accountable for all aspects of the work</li>
                </ul>
                
                <h4 className="font-semibold text-gray-800 mt-6 mb-2">Conflicts of Interest</h4>
                <p className="text-sm text-gray-600">Financial conflicts of interest must be declared.</p>
                
                <h4 className="font-semibold text-gray-800 mt-4 mb-2">ORCID Support</h4>
                <p className="text-sm text-gray-600">AMHSJ supports ORCID. Authors encouraged to use ORCID iDs during peer review.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Publication Details</h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Open Access Policy</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    AMHSJ provides free, unrestricted online access. Published under Creative Commons Attribution-NonCommercial-NoDerivs (CC BY-NC-ND) license.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Publication Fee</h4>
                  <p className="text-yellow-700 text-sm mb-2">
                    <strong>US $100.00</strong> payable upon acceptance to Medical & Dental Consultants Association of Nigeria (MDCAN), NDUTH Chapter.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Copyright & Citation</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• AMHSJ retains copyright of all published work</li>
                    <li>• Citation format: Nig Del Med J 2017; 2: 1-5</li>
                    <li>• ISSN: Print 2672-4588 | Online 2672-4596</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editorial Contact & Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manuscript Submission</h3>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                  <p className="text-blue-700 font-semibold text-lg mb-2">editor@amhsjournal.org</p>
                  <div className="text-sm text-blue-600 space-y-1">
                    <p>• Peer-review: 14 days</p>
                    <p>• Publication: 4-6 weeks after submission</p>
                    <p>• Manuscripts anonymized including reviewer comments</p>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-800 mb-2">Report Issues</h4>
                <p className="text-sm text-gray-600">
                  Plagiarism & Research Fraud should be reported to the Editor-in-Chief.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Journal Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>ISSN:</strong>
                    <p className="text-gray-600">Print: 2672-4588 | Online: 2672-4596</p>
                  </div>
                  <div>
                    <strong>License:</strong>
                    <p className="text-gray-600">CC BY-NC-ND (Open Access)</p>
                  </div>
                  <div>
                    <strong>Reference Style:</strong>
                    <p className="text-gray-600">APA format</p>
                  </div>
                  <div>
                    <strong>Citation Example:</strong>
                    <p className="text-gray-600">Nig Del Med J 2017; 2: 1-5</p>
                  </div>
                  <div>
                    <strong>Publication Fee:</strong>
                    <p className="text-gray-600">US $100.00 upon acceptance</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
