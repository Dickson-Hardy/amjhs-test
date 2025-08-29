import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, MessageSquare, FileText, Users, HelpCircle } from "lucide-react"

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Mail,
      title: "Editorial Office",
      details: ["editor@amhsj.org", "submissions@amhsj.org"],
      description: "For editorial inquiries and submissions",
    },
    {
      icon: Phone,
      title: "Phone Support",
      details: ["+1 (555) 123-4567", "+1 (555) 123-4568"],
      description: "Monday - Friday, 9:00 AM - 5:00 PM EST",
    },
    {
      icon: MapPin,
      title: "Mailing Address",
      details: ["AMHSJ Editorial Office", "123 Research Drive", "Innovation City, IC 12345", "United States"],
      description: "Physical correspondence address",
    },
    {
      icon: Clock,
      title: "Response Time",
      details: ["Email: 24-48 hours", "Submissions: 5-7 days"],
      description: "Typical response timeframes",
    },
  ]

  const departments = [
    {
      icon: FileText,
      title: "Submissions & Manuscripts",
      email: "submissions@amhsj.org",
      description: "Article submissions, revision requests, publication status",
    },
    {
      icon: Users,
      title: "Peer Review",
      email: "reviews@amhsj.org",
      description: "Reviewer assignments, review process, editorial decisions",
    },
    {
      icon: MessageSquare,
      title: "Technical Support",
      email: "support@amhsj.org",
      description: "Website issues, account problems, submission platform",
    },
    {
      icon: HelpCircle,
      title: "General Inquiries",
      email: "info@amhsj.org",
      description: "General questions, partnerships, media inquiries",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact AMHSJ</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our editorial team. We're here to support authors, reviewers, and the global IoT research
            community.
          </p>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <info.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">{info.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-3">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="font-medium text-gray-800">
                      {detail}
                    </p>
                  ))}
                </div>
                <p className="text-sm text-gray-600">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form and Departments */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">First Name *</label>
                    <Input placeholder="Enter your first name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Last Name *</label>
                    <Input placeholder="Enter your last name" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address *</label>
                  <Input type="email" placeholder="Enter your email address" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Affiliation</label>
                  <Input placeholder="Your institution or organization" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Inquiry Type *</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submission">Submission Inquiry</SelectItem>
                      <SelectItem value="review">Peer Review</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="editorial">Editorial Question</SelectItem>
                      <SelectItem value="partnership">Partnership/Collaboration</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Subject *</label>
                  <Input placeholder="Brief subject line" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Message *</label>
                  <Textarea placeholder="Please provide details about your inquiry..." className="min-h-[120px]" />
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Send Message</Button>
              </form>
            </CardContent>
          </Card>

          {/* Department Contacts */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Department Contacts</h2>
              <p className="text-gray-600 mb-6">
                For specific inquiries, contact the appropriate department directly for faster assistance.
              </p>
            </div>

            {departments.map((dept, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <dept.icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{dept.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                      <a
                        href={`process.env.EMAIL_FROM${dept.email}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        {dept.email}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions about AMHSJ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">How long does the review process take?</h3>
                <p className="text-gray-600 text-sm">
                  Our typical review process takes 8-12 weeks from submission to initial decision. IoT-focused papers
                  may receive expedited review due to our specialized editorial board.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">What are the publication fees?</h3>
                <p className="text-gray-600 text-sm">
                  AMHSJ operates on an open-access model with article processing charges (APC) of $1,200 for accepted
                  papers. Discounts available for developing countries and student authors.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Can I track my submission status?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! Log into your author dashboard to track your submission status in real-time, view reviewer
                  comments, and receive notifications about editorial decisions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Do you accept non-IoT research?</h3>
                <p className="text-gray-600 text-sm">
                  While 50% of our focus is on IoT research, we also welcome high-quality submissions in related areas
                  like distributed systems, cybersecurity, and emerging technologies.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/faq">View Complete FAQ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-red-800 mb-2">Urgent Editorial Matters</h3>
            <p className="text-red-700 text-sm mb-3">
              For time-sensitive editorial issues, ethical concerns, or urgent publication matters
            </p>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Contact: +1 (555) 123-URGENT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
