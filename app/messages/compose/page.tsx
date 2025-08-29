"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Mail,
  FileText,
} from "lucide-react"

interface ComposeMessage {
  recipientType: 'editor' | 'admin' | 'support';
  subject: string;
  content: string;
  submissionId?: string;
}

export default function ComposeMessagePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<ComposeMessage>({
    recipientType: 'editor',
    subject: '',
    content: '',
    submissionId: '',
  })

  const handleSendMessage = async () => {
    if (!message.content.trim() || !message.subject.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message content.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      
      let endpoint = '/api/messages'
      let body = message

      // If submissionId is provided, use the manuscript-specific endpoint
      if (message.submissionId?.trim()) {
        endpoint = `/api/manuscripts/${message.submissionId}/messages`
        body = {
          ...message,
          recipientType: message.recipientType,
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Message sent",
            description: "Your message has been sent successfully.",
          })
          router.push('/dashboard?tab=messages')
        }
      } else {
        throw new AppError('Failed to send message')
      }
    } catch (error) {
      handleError(error, { 
        component: 'compose-message', 
        action: 'send_message'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Compose Message</h1>
            <p className="text-slate-600">Send a message to the editorial team or administrators</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Compose Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    New Message
                  </CardTitle>
                  <CardDescription>
                    Compose your message to the appropriate recipient
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recipient Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Type</Label>
                      <Select 
                        value={message.recipientType} 
                        onValueChange={(value: 'editor' | 'admin' | 'support') => 
                          setMessage(prev => ({ ...prev, recipientType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editorial Team</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submission">Related Submission (Optional)</Label>
                      <Input
                        id="submission"
                        value={message.submissionId}
                        onChange={(e) => setMessage(prev => ({ ...prev, submissionId: e.target.value }))}
                        placeholder="Enter submission ID if applicable"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={message.subject}
                      onChange={(e) => setMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter message subject"
                    />
                  </div>

                  {/* Message Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Message</Label>
                    <Textarea
                      id="content"
                      value={message.content}
                      onChange={(e) => setMessage(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Type your message here..."
                      rows={10}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSendMessage}
                      disabled={submitting || !message.content.trim() || !message.subject.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {submitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recipient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recipient Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {message.recipientType === 'editor' && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-800 mb-1">Editorial Team</h4>
                      <p className="text-sm text-purple-700">
                        Your message will be sent to the appropriate editor for your submission category.
                      </p>
                    </div>
                  )}

                  {message.recipientType === 'admin' && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-1">Administrator</h4>
                      <p className="text-sm text-blue-700">
                        Contact administrators for account issues, policy questions, or general inquiries.
                      </p>
                    </div>
                  )}

                  {message.recipientType === 'support' && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-1">Technical Support</h4>
                      <p className="text-sm text-green-700">
                        Get help with technical issues, file uploads, or system problems.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Response Time</h4>
                    <p>We aim to respond to all messages within 1-2 business days.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Be Specific</h4>
                    <p>Include relevant details like submission IDs or specific issues to help us assist you better.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Professional Tone</h4>
                    <p>Please maintain a professional and respectful tone in all communications.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                    onClick={() => setMessage(prev => ({
                      ...prev,
                      subject: "Inquiry about submission status",
                      content: "Dear Editor,\n\nI hope this message finds you well. I am writing to inquire about the status of my submission...\n\nBest regards,\n" + (session?.user?.name || "")
                    }))}
                  >
                    Status Inquiry
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                    onClick={() => setMessage(prev => ({
                      ...prev,
                      subject: "Technical issue with submission",
                      content: "Dear Support Team,\n\nI am experiencing a technical issue with...\n\nPlease assist me with this matter.\n\nBest regards,\n" + (session?.user?.name || "")
                    }))}
                  >
                    Technical Issue
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                    onClick={() => setMessage(prev => ({
                      ...prev,
                      subject: "General inquiry",
                      content: "Dear Team,\n\nI have a general inquiry regarding...\n\nThank you for your time.\n\nBest regards,\n" + (session?.user?.name || "")
                    }))}
                  >
                    General Inquiry
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
