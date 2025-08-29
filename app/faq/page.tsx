"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, HelpCircle, FileText, Users, Clock, Award, Mail, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const faqCategories = [
    {
      category: "Submission Process",
      icon: FileText,
      color: "bg-blue-100 text-blue-800",
      faqs: [
        {
          question: "How do I submit a manuscript to AMHSJ?",
          answer:
            "To submit a manuscript, create an account on our submission platform, prepare your manuscript according to our guidelines, and upload all required files through the online system. The process typically takes 15-20 minutes.",
        },
        {
          question: "What file formats do you accept?",
          answer:
            "We accept DOC, DOCX, and PDF for manuscripts. Figures should be in TIFF, EPS, or high-resolution JPEG format. Tables should be in editable format (Word or Excel). Maximum file size is 50MB per file.",
        },
        {
          question: "Can I submit my manuscript if it's under review elsewhere?",
          answer:
            "No, we do not accept manuscripts that are currently under review at another journal. However, you may submit after receiving a rejection or withdrawing from another journal.",
        },
        {
          question: "What happens after I submit my manuscript?",
          answer:
            "After submission, you'll receive an automated confirmation email. Your manuscript undergoes initial editorial screening (5-7 days), followed by peer review (6-8 weeks), and then a final editorial decision.",
        },
      ],
    },
    {
      category: "Review Process",
      icon: Users,
      color: "bg-green-100 text-green-800",
      faqs: [
        {
          question: "How long does the review process take?",
          answer:
            "Our typical review process takes 8-12 weeks from submission to initial decision. This includes editorial screening (5-7 days) and peer review (6-8 weeks). Expedited review is available for time-sensitive research.",
        },
        {
          question: "What type of peer review does AMHSJ use?",
          answer:
            "We use double-blind peer review, where both authors and reviewers remain anonymous. Each manuscript is typically reviewed by 2-3 experts in the relevant field.",
        },
        {
          question: "Can I suggest reviewers for my manuscript?",
          answer:
            "Yes, you can suggest up to 3 potential reviewers during submission. However, the final selection of reviewers is at the editor's discretion. You may also request to exclude specific reviewers.",
        },
        {
          question: "What are the possible editorial decisions?",
          answer:
            "Possible decisions include: Accept, Minor Revisions, Major Revisions, or Reject. Each decision comes with detailed reviewer comments and editorial guidance.",
        },
      ],
    },
    {
      category: "Publication & Fees",
      icon: Award,
      color: "bg-purple-100 text-purple-800",
      faqs: [
        {
          question: "What are the publication fees?",
          answer:
            "AMHSJ charges an Article Processing Charge (APC) of $1,200 for accepted papers. This covers open access publication, DOI assignment, and unlimited downloads. Discounts are available for developing countries and student authors.",
        },
        {
          question: "When do I need to pay the publication fee?",
          answer:
            "Payment is only required after your manuscript is accepted for publication. You'll receive an invoice with payment instructions and have 30 days to complete payment before publication.",
        },
        {
          question: "Do you offer fee waivers or discounts?",
          answer:
            "Yes, we offer 50% discounts for authors from developing countries and 25% discounts for student first authors. Complete fee waivers are available in cases of financial hardship upon request.",
        },
        {
          question: "How long until my article is published online?",
          answer:
            "Accepted articles are typically published online within 2-3 weeks after final acceptance and fee payment. Print publication follows in the next scheduled issue.",
        },
      ],
    },
    {
      category: "Technical Support",
      icon: HelpCircle,
      color: "bg-orange-100 text-orange-800",
      faqs: [
        {
          question: "I'm having trouble with the submission system. What should I do?",
          answer:
            "First, try clearing your browser cache and cookies. If problems persist, contact our technical support team at support@amhsj.org with details about your browser, operating system, and the specific error message.",
        },
        {
          question: "Can I update my manuscript after submission?",
          answer:
            "Minor updates (like correcting typos) can be made during the review process. For major changes, contact the editorial office. Once accepted, only essential corrections are allowed.",
        },
        {
          question: "How do I track my submission status?",
          answer:
            "Log into your author dashboard to view real-time submission status, reviewer comments, and editorial correspondence. You'll also receive email notifications for status changes.",
        },
        {
          question: "I forgot my login credentials. How can I recover them?",
          answer:
            "Use the 'Forgot Password' link on the login page. If you don't remember your username, contact support@amhsj.org with your email address and manuscript details.",
        },
      ],
    },
  ]

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const filteredFAQs = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about submitting to AMHSJ, our review process, and publication policies.
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search FAQs..."
                className="pl-10 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">8-12</div>
              <div className="text-sm text-gray-600">Weeks Review Time</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">$1,200</div>
              <div className="text-sm text-gray-600">Publication Fee</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">2-3</div>
              <div className="text-sm text-gray-600">Peer Reviewers</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">50MB</div>
              <div className="text-sm text-gray-600">Max File Size</div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        {filteredFAQs.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                {category.category}
                <Badge variant="secondary" className="ml-auto">
                  {category.faqs.length} questions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex
                  const isExpanded = expandedItems.includes(globalIndex)

                  return (
                    <div key={faqIndex} className="border rounded-lg">
                      <button
                        onClick={() => toggleExpanded(globalIndex)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-gray-600 border-t bg-gray-50">
                          <p className="pt-4">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* No Results */}
        {searchTerm && filteredFAQs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any FAQs matching "{searchTerm}". Try different keywords or contact us directly.
              </p>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Still Need Help?</CardTitle>
            <CardDescription className="text-center">
              Can't find the answer you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Email Support</h3>
                <p className="text-sm text-gray-600">support@amhsj.org</p>
                <p className="text-xs text-gray-500">Response within 24 hours</p>
              </div>
              <div>
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Editorial Office</h3>
                <p className="text-sm text-gray-600">editor@amhsj.org</p>
                <p className="text-xs text-gray-500">For editorial inquiries</p>
              </div>
              <div>
                <HelpCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Technical Help</h3>
                <p className="text-sm text-gray-600">tech@amhsj.org</p>
                <p className="text-xs text-gray-500">For platform issues</p>
              </div>
            </div>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              <Mail className="mr-2 h-5 w-5" />
              Contact Support Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
