"use client"
   
import  { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, AlertCircle, CheckCircle, FileSpreadsheet, Image, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ManuscriptTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleDownloadTemplate = (templateName: string) => {
    // In a real implementation, these would link to actual downloadable files
    const downloadLinks = {
      'Word Template': '/downloads/amhsj-manuscript-template.docx',
      'LaTeX Template': '/downloads/amhsj-manuscript-template.zip',
      'Author Checklist': '/downloads/amhsj-author-checklist.pdf',
      'Reference Guide': '/downloads/apa-style-guide.pdf',
      'Copyright Form': '/downloads/amhsj-copyright-form.pdf'
    }
    
    const link = downloadLinks[templateName as keyof typeof downloadLinks]
    if (link) {
      toast({
        title: "Download Starting",
        description: `Downloading: ${templateName}`,
      })
      // In production: window.open(link, '_blank')
    }
  }

  const templateResources = [
    {
      name: "Word Template",
      description: "Official AMHSJ manuscript template for Microsoft Word",
      icon: FileText,
      size: "125 KB",
      version: "v2.1",
      required: true
    },
    {
      name: "Author Checklist",
      description: "Pre-submission checklist to ensure compliance",
      icon: CheckCircle,
      size: "85 KB", 
      version: "v2.1",
      required: true
    },
    {
      name: "Reference Guide",
      description: "APA style reference formatting guide",
      icon: BookOpen,
      size: "95 KB",
      version: "v2.1",
      required: false
    },
    {
      name: "Copyright Form",
      description: "Copyright transfer and author declaration form",
      icon: FileSpreadsheet,
      size: "75 KB",
      version: "v2.1", 
      required: true
    },
    {
      name: "Author Checklist",
      description: "Pre-submission checklist to ensure compliance",
      icon: CheckCircle,
      size: "85 KB",
      version: "v1.3",
      required: true
    },
    {
      name: "Figure Guidelines",
      description: "Detailed guidelines for figure preparation and formatting",
      icon: Image,
      size: "2.1 MB",
      version: "v1.2",
      required: true
    },
    {
      name: "Reference Style",
      description: "AMHSJ reference formatting guide with Vancouver style examples",
      icon: BookOpen,
      size: "320 KB",
      version: "v1.4",
      required: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Manuscript Templates & Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Download official templates and guidelines to ensure your manuscript meets African Medical and Health Sciences Journal (AMHSJ) standards.
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-lg font-semibold text-blue-800 mb-2">
              Submit to: <span className="text-blue-600">editor@amhsjournal.org</span>
            </p>
            <div className="text-sm text-blue-700">
              <p>ISSN: Print 2789-4567 | Online 2789-4568</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <div className="text-red-800">
              <h3 className="text-lg font-bold mb-2">⚠️ Template Usage Required</h3>
              <p className="font-medium mb-2">
                All manuscripts MUST follow AMHSJ formatting requirements. Submissions not meeting these standards will be rejected without review.
              </p>
              <div className="bg-red-100 p-3 rounded border border-red-200">
                <p className="text-sm">
                  <strong>Before starting:</strong> Download the Word template and author checklist below. 
                  Use Times New Roman 12pt, double-spaced, single column format. Follow APA reference style.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Template Downloads */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Download className="h-6 w-6 mr-2" />
              Template Downloads
            </CardTitle>
            <CardDescription>
              Choose your preferred format and download the complete template package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {templateResources.map((resource, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <resource.icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-800">{resource.name}</h3>
                          {resource.required && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                            {resource.version}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{resource.description}</p>
                        <p className="text-sm text-gray-500 mt-2">Size: {resource.size}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadTemplate(resource.name)}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Template Usage Instructions</CardTitle>
            <CardDescription>
              Follow these steps to ensure proper template usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Template Usage Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Download the Word template (.docx file)</li>
                  <li>Open the template in Microsoft Word 2016 or later</li>
                  <li>Replace placeholder text with your content</li>
                  <li>Use built-in styles (Heading 1, Heading 2, etc.)</li>
                  <li>Follow APA reference style (author-date format)</li>
                  <li>Do not modify fonts, margins, or spacing</li>
                  <li>Save as .docx format for submission</li>
                  <li>Complete the author checklist before submission</li>
                </ol>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pro Tip:</strong> Use the Author Checklist before submission to verify that your manuscript follows all template requirements and guidelines.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Template Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Template Requirements</CardTitle>
            <CardDescription>
              Mandatory formatting requirements that cannot be modified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Document Structure</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Title page with all author information
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Abstract (250 words max)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Keywords (3-8 terms)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Introduction, Methods, Results, Discussion
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    References in APA style
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Formatting Specs</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Times New Roman, 12pt font
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Double spacing throughout
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    1-inch margins on all sides
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Page numbers in top right
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Line numbers (if required)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button
              onClick={() => router.push('/submission-guidelines')}
              variant="outline"
              className="text-lg px-8 py-3"
            >
              View Full Guidelines
            </Button>
            <Button
              onClick={() => router.push('/submit')}
              className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700"
            >
              Start Submission
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Questions about templates? <Button variant="link" onClick={() => router.push('/contact')} className="p-0 h-auto">Contact our editorial office</Button>
          </p>
        </div>
      </div>
    </div>
  )
}
