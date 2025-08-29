"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  Mail,
  User,
  Zap
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SupportTicketFormProps {
  onTicketSubmitted?: (ticketId: string) => void
  defaultType?: string
  defaultSubject?: string
  manuscriptId?: string
}

const supportTypes = [
  {
    value: 'technical',
    label: 'Technical Issues',
    description: 'Platform bugs, login problems, file upload issues',
    responseTime: '4 hours',
    icon: '🔧',
    examples: ['Cannot upload files', 'Login errors', 'Page not loading']
  },
  {
    value: 'editorial',
    label: 'Editorial Queries',
    description: 'Manuscript status, review process, publication guidelines',
    responseTime: '24 hours', 
    icon: '📝',
    examples: ['Manuscript status inquiry', 'Review process questions', 'Publication guidelines']
  },
  {
    value: 'general',
    label: 'General Support',
    description: 'Account setup, general inquiries, policy questions',
    responseTime: '12 hours',
    icon: '💬',
    examples: ['Account registration help', 'Policy questions', 'General inquiries']
  },
  {
    value: 'emergency',
    label: 'Emergency Issues',
    description: 'Critical system failures, urgent publication issues',
    responseTime: '1 hour',
    icon: '🚨',
    examples: ['System outage', 'Critical publication deadline', 'Security concern']
  },
  {
    value: 'appeals',
    label: 'Appeals Process',
    description: 'Editorial decision appeals, policy disputes, ethics concerns',
    responseTime: '48 hours',
    icon: '⚖️',
    examples: ['Appeal editorial decision', 'Policy dispute', 'Ethics violation report']
  }
]

export default function SupportTicketForm({ 
  onTicketSubmitted, 
  defaultType = '',
  defaultSubject = '',
  manuscriptId = ''
}: SupportTicketFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [submittedTicketId, setSubmittedTicketId] = useState('')
  
  const [formData, setFormData] = useState({
    type: defaultType,
    subject: defaultSubject,
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'emergency',
    manuscriptId: manuscriptId
  })

  const selectedType = supportTypes.find(type => type.value === formData.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit a support ticket."
      })
      return
    }

    if (!formData.type || !formData.subject || !formData.message) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields."
      })
      return
    }

    setIsSubmitting(true)

    try {
      const ticketData = {
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        userInfo: {
          name: session.user.name || 'Unknown',
          email: session.user.email || '',
          manuscriptId: formData.manuscriptId || undefined
        }
      }

      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData)
      })

      const result = await response.json()

      if (result.success) {
        setSubmittedTicketId(result.ticketId)
        setTicketSubmitted(true)
        
        toast({
          title: "Ticket Submitted Successfully",
          description: `Your support ticket ${result.ticketId} has been created. Expected response: ${result.expectedResponse}`
        })

        onTicketSubmitted?.(result.ticketId)
      } else {
        throw new AppError(result.message || 'Failed to submit ticket')
      }

    } catch (error: unknown) {
      logger.error('Support ticket submission error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit support ticket. Please try again."
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTicketSubmitted(false)
    setSubmittedTicketId('')
    setFormData({
      type: '',
      subject: '',
      message: '',
      priority: 'medium',
      manuscriptId: ''
    })
  }

  if (ticketSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-700">Ticket Submitted Successfully!</CardTitle>
          <CardDescription>Your support request has been received and assigned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="font-medium text-green-800">Ticket ID</p>
              <p className="text-lg font-mono text-green-700">{submittedTicketId}</p>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>What's next?</strong> You'll receive an initial response within {selectedType?.responseTime || '24 hours'}. 
              We've also sent a confirmation email with your ticket details.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Submit Another Ticket
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} className="flex-1">
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Submit Support Ticket
        </CardTitle>
        <CardDescription>
          Get help from our support team. Choose the appropriate category for faster assistance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Support Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Support Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the type of support you need" />
              </SelectTrigger>
              <SelectContent>
                {supportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-gray-500">Response: {type.responseTime}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedType && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{selectedType.label}</h4>
                  <Badge variant="outline" className="text-blue-700">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedType.responseTime}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 mb-2">{selectedType.description}</p>
                <div className="text-xs text-blue-600">
                  <strong>Examples:</strong> {selectedType.examples.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Low - Can wait a few days</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Medium - Normal business priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span>High - Blocks my work</span>
                  </div>
                </SelectItem>
                <SelectItem value="emergency">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Emergency - Critical issue</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          {/* Manuscript ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="manuscriptId">Manuscript ID (Optional)</Label>
            <Input
              id="manuscriptId"
              value={formData.manuscriptId}
              onChange={(e) => setFormData(prev => ({ ...prev, manuscriptId: e.target.value }))}
              placeholder="Enter manuscript ID if applicable"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Detailed Description *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please provide detailed information about your issue including:
- What you were trying to do
- What happened instead
- Any error messages you saw
- Steps you've already tried"
              rows={6}
              required
            />
            <p className="text-xs text-gray-500">
              Be as specific as possible to help us resolve your issue quickly
            </p>
          </div>

          {/* User Information Display */}
          {session?.user && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{session.user.name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{session.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Warning */}
          {formData.priority === 'emergency' && (
            <Alert variant="destructive">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Emergency Priority Selected:</strong> Please ensure this is a genuine emergency 
                that requires immediate attention (system outage, security breach, critical deadline at risk). 
                Misuse of emergency priority may delay response to actual emergencies.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.type || !formData.subject || !formData.message}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Ticket...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Support Ticket
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You'll receive a confirmation email with your ticket ID and expected response time.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
