"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Clock, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  FileText,
  Shield,
  Users,
  Settings,
  ExternalLink,
  Copy,
  CheckCircle,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SupportContact {
  type: string
  email: string
  description: string
  responseTime: string
  resolutionTime: string
  icon: React.ReactNode
  priority: 'low' | 'medium' | 'high' | 'emergency'
  examples: string[]
  whenToUse: string
}

const supportContacts: SupportContact[] = [
  {
    type: "Technical Issues",
    email: "system@amhsj.org",
    description: "Platform bugs, login problems, file upload issues, system errors",
    responseTime: "4 hours",
    resolutionTime: "24-48 hours",
    icon: <Settings className="h-5 w-5 text-blue-600" />,
    priority: "high",
    examples: [
      "Unable to upload manuscript files",
      "Login or authentication errors",
      "Page loading or display issues",
      "System crashes or error messages"
    ],
    whenToUse: "When experiencing technical problems with the journal platform"
  },
  {
    type: "Editorial Queries",
    email: "editorial@amhsj.org",
    description: "Manuscript status, review process, publication guidelines",
    responseTime: "24 hours",
    resolutionTime: "3-5 days",
    icon: <FileText className="h-5 w-5 text-green-600" />,
    priority: "medium",
    examples: [
      "Questions about manuscript status",
      "Clarification on review feedback",
      "Publication timeline inquiries",
      "Formatting and style guidelines"
    ],
    whenToUse: "For questions about the editorial process and manuscript handling"
  },
  {
    type: "General Support",
    email: "info@amhsj.org",
    description: "Account setup, general inquiries, policy questions",
    responseTime: "12 hours",
    resolutionTime: "1-3 days",
    icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
    priority: "medium",
    examples: [
      "Account registration help",
      "General policy questions",
      "Journal scope inquiries",
      "Author guidelines clarification"
    ],
    whenToUse: "For general questions and non-urgent support needs"
  },
  {
    type: "Emergency Issues",
    email: "emergency@amhsj.org",
    description: "Critical system failures, urgent publication issues",
    responseTime: "1 hour",
    resolutionTime: "4-8 hours",
    icon: <Zap className="h-5 w-5 text-red-600" />,
    priority: "emergency",
    examples: [
      "Complete system outage",
      "Critical publication deadlines at risk",
      "Security breaches or data concerns",
      "Urgent editorial decisions needed"
    ],
    whenToUse: "Only for genuine emergencies that cannot wait for normal support"
  },
  {
    type: "Appeals Process",
    email: "editor-in-chief@amhsj.org",
    description: "Editorial decision appeals, policy disputes, ethics concerns",
    responseTime: "48 hours",
    resolutionTime: "14-21 days",
    icon: <Shield className="h-5 w-5 text-orange-600" />,
    priority: "high",
    examples: [
      "Appeal editorial rejection decisions",
      "Dispute review process outcomes",
      "Report ethics violations",
      "Challenge policy interpretations"
    ],
    whenToUse: "For formal appeals and serious editorial concerns"
  }
]

export default function SupportContacts() {
  const { toast } = useToast()
  const [selectedContact, setSelectedContact] = useState<SupportContact | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      toast({
        title: "Email Copied",
        description: `${email} has been copied to your clipboard.`
      })
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Unable to copy email to clipboard."
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getResponseTimeColor = (responseTime: string) => {
    if (responseTime.includes('1 hour')) return 'text-red-600'
    if (responseTime.includes('4 hours')) return 'text-orange-600'
    if (responseTime.includes('12 hours')) return 'text-blue-600'
    return 'text-green-600'
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Support & Contact Information</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get help when you need it. Our support team is committed to providing timely assistance 
          for all your journal platform needs.
        </p>
      </div>

      {/* Quick Response Times Overview */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>Emergency:</strong> 1 hour response</span>
            <span><strong>Technical:</strong> 4 hours response</span>
            <span><strong>General:</strong> 12 hours response</span>
            <span><strong>Editorial:</strong> 24 hours response</span>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contact Directory</TabsTrigger>
          <TabsTrigger value="guidelines">Contact Guidelines</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Process</TabsTrigger>
        </TabsList>

        {/* Contact Directory */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="grid gap-6">
            {supportContacts.map((contact, index) => (
              <Card key={index} className="border-l-4 border-l-gray-200 hover:border-l-blue-500 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {contact.icon}
                      <div>
                        <CardTitle className="text-lg">{contact.type}</CardTitle>
                        <CardDescription className="mt-1">{contact.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(contact.priority)}>
                      {contact.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Contact Information */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span className="font-mono text-sm">{contact.email}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyEmail(contact.email)}
                          className="h-8"
                        >
                          {copiedEmail === contact.email ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Response Times */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">RESPONSE</span>
                          </div>
                          <p className={`font-bold ${getResponseTimeColor(contact.responseTime)}`}>
                            {contact.responseTime}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">RESOLUTION</span>
                          </div>
                          <p className="font-bold text-green-600">{contact.resolutionTime}</p>
                        </div>
                      </div>

                      {/* Quick Contact Button */}
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(`process.env.EMAIL_FROM${contact.email}`, '_blank')}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* When to Use */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">When to Use:</h4>
                        <p className="text-sm text-gray-600">{contact.whenToUse}</p>
                      </div>

                      {/* Examples */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Common Issues:</h4>
                        <ul className="space-y-1">
                          {contact.examples.map((example, exIndex) => (
                            <li key={exIndex} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contact Guidelines */}
        <TabsContent value="guidelines" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Effective Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Include These Details:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Your full name and email address</li>
                    <li>• Manuscript ID (if applicable)</li>
                    <li>• Clear description of the issue</li>
                    <li>• Steps you've already tried</li>
                    <li>• Screenshots or error messages</li>
                    <li>• Urgency level and deadlines</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Subject Line Format:</h4>
                  <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                    [Issue Type] - Brief Description
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: [Technical] - Unable to upload manuscript files
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Response Expectations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Response Times:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Emergency Issues:</span>
                      <Badge variant="destructive">1 hour</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Technical Issues:</span>
                      <Badge variant="secondary">4 hours</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>General Support:</span>
                      <Badge variant="secondary">12 hours</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Editorial Queries:</span>
                      <Badge variant="secondary">24 hours</Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Response times are calculated during business hours (Monday-Friday, 9 AM - 5 PM GMT). 
                    Emergency issues receive 24/7 attention.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Before Contacting Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Check Documentation</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Review user guides</li>
                    <li>• Check FAQ sections</li>
                    <li>• Search help articles</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Try process.env.AUTH_TOKEN_PREFIX + ' 'Solutions</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Clear browser cache</li>
                    <li>• Try different browser</li>
                    <li>• Check internet connection</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Gather Information</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Note error messages</li>
                    <li>• Record steps to reproduce</li>
                    <li>• Take screenshots</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Process */}
        <TabsContent value="escalation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Issue Escalation Process
              </CardTitle>
              <CardDescription>
                What to do when your issue needs additional attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium mb-2">Initial Contact</h4>
                    <p className="text-sm text-gray-600">
                      Contact appropriate support team based on issue type
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-orange-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium mb-2">Follow Up</h4>
                    <p className="text-sm text-gray-600">
                      If no response within expected timeframe, send follow-up
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-red-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium mb-2">Escalate</h4>
                    <p className="text-sm text-gray-600">
                      Contact editor-in-chief@amhsj.org for unresolved issues
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>When to Escalate:</strong> If you haven't received a response within 
                    double the stated response time, or if you're not satisfied with the resolution 
                    provided. Include your original correspondence and ticket numbers.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Escalation Contact:</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="font-mono">editor-in-chief@amhsj.org</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyEmail('editor-in-chief@amhsj.org')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>True Emergencies Only:</strong> System outages, security breaches, 
                      or issues threatening immediate publication deadlines.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <p className="font-medium">Emergency Contact:</p>
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-red-600" />
                        <span className="font-mono">emergency@amhsj.org</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">24/7 Response - 1 hour guaranteed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Level Agreement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Our Commitments:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Acknowledge all emails within stated timeframes</li>
                      <li>• Provide regular updates on complex issues</li>
                      <li>• Escalate internally when needed</li>
                      <li>• Follow up to ensure satisfaction</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Business Hours:</h4>
                    <p className="text-sm text-gray-600">
                      Monday - Friday: 9:00 AM - 5:00 PM (GMT)<br/>
                      Emergency support: 24/7/365
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
