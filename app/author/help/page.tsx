"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  HelpCircle, 
  FileText, 
  Upload, 
  Clock, 
  MessageCircle, 
  BookOpen,
  Download,
  Mail,
  Phone,
  Globe,
  Users,
  Shield
} from "lucide-react"

export default function AuthorHelpPage() {
  const helpCategories = [
    {
      title: "Submission Process",
      description: "Get help with manuscript submission",
      icon: <Upload className="h-6 w-6" />,
      color: "blue",
      items: [
        "How to submit a manuscript",
        "File format requirements",
        "Submission checklist",
        "Common submission errors"
      ]
    },
    {
      title: "Manuscript Preparation",
      description: "Guidelines for preparing your manuscript",
      icon: <FileText className="h-6 w-6" />,
      color: "green",
      items: [
        "Formatting guidelines",
        "Reference styles",
        "Figure and table preparation",
        "Ethical requirements"
      ]
    },
    {
      title: "Review Process",
      description: "Understanding the peer review process",
      icon: <Clock className="h-6 w-6" />,
      color: "purple",
      items: [
        "Review timeline",
        "Reviewer comments",
        "Revision process",
        "Decision types"
      ]
    },
    {
      title: "Account & Profile",
      description: "Managing your author account",
      icon: <Users className="h-6 w-6" />,
      color: "orange",
      items: [
        "Profile updates",
        "Password changes",
        "Email preferences",
        "Account security"
      ]
    }
  ]

  const faqs = [
    {
      question: "How long does the review process take?",
      answer: "The initial editorial review typically takes 1-2 weeks. Full peer review usually takes 4-8 weeks, depending on reviewer availability and manuscript complexity."
    },
    {
      question: "Can I submit multiple manuscripts at once?",
      answer: "Yes, you can submit multiple manuscripts. Each submission is processed independently and requires a separate submission form."
    },
    {
      question: "What file formats are accepted?",
      answer: "We accept Microsoft Word (.docx) and LaTeX files for manuscripts. Figures should be in high-resolution formats (TIFF, PNG, JPEG)."
    },
    {
      question: "How do I track my submission status?",
      answer: "You can track your submission status through your author dashboard. You'll also receive email notifications at key stages of the process."
    },
    {
      question: "What happens if my manuscript is rejected?",
      answer: "If your manuscript is rejected, you'll receive detailed feedback from the editors and reviewers. You can address these comments and submit a revised version."
    }
  ]

  const getColorClass = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50 text-blue-700",
      green: "border-green-200 bg-green-50 text-green-700",
      purple: "border-purple-200 bg-purple-50 text-purple-700",
      orange: "border-orange-200 bg-orange-50 text-orange-700"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Author Help & Resources
        </h1>
        <p className="text-gray-600">
          Find answers to common questions and get support for your manuscript submission
        </p>
      </div>

      {/* Quick Help Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Help Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColorClass(category.color)}`}>
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Get in Touch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send us an email for general inquiries and support
              </p>
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Chat with our support team during business hours
              </p>
              <Button className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-600" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Call us for urgent technical issues
              </p>
              <Button className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Additional Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Author Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Comprehensive guidelines for manuscript preparation and submission
              </p>
              <Button variant="outline" className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                View Guidelines
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                Templates & Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Download manuscript templates and required submission forms
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support Status */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Support Hours</h3>
              <p className="text-blue-700 text-sm">
                Monday - Friday: 9:00 AM - 6:00 PM (GMT) | 
                Weekend: 10:00 AM - 4:00 PM (GMT)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
