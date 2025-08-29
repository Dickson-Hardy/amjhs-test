"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Calendar,
  Reply,
  AlertCircle,
  CheckCircle,
  Clock,
  Paperclip,
  Search,
} from "lucide-react"

interface Message {
  id: string;
  submissionId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  threadId?: string;
  parentMessageId?: string;
  attachments?: { name: string; url: string; type: string }[];
}

interface NewMessage {
  recipientType: 'editor' | 'reviewer' | 'admin';
  subject: string;
  content: string;
}

export default function SubmissionMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [submissionTitle, setSubmissionTitle] = useState("")
  const [newMessage, setNewMessage] = useState<NewMessage>({
    recipientType: 'editor',
    subject: '',
    content: '',
  })
  const [showCompose, setShowCompose] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (params.id && session?.user?.id) {
      fetchMessages()
      fetchSubmissionTitle()
    }
  }, [params.id, session])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/manuscripts/${params.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      handleError(error, { 
        component: 'submission-messages', 
        action: 'fetch_messages'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissionTitle = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/submissions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const submission = data.submissions.find((s: unknown) => s.id === params.id)
          if (submission) {
            setSubmissionTitle(submission.title)
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching submission title:', error)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.content.trim() || !newMessage.subject.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message content.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/manuscripts/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMessage,
          parentMessageId: replyTo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(prev => [data.message, ...prev])
          setNewMessage({
            recipientType: 'editor',
            subject: '',
            content: '',
          })
          setShowCompose(false)
          setReplyTo(null)
          toast({
            title: "Message sent",
            description: "Your message has been sent successfully.",
          })
        }
      } else {
        throw new AppError('Failed to send message')
      }
    } catch (error) {
      handleError(error, { 
        component: 'submission-messages', 
        action: 'send_message'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = (messageId: string, originalSubject: string) => {
    setReplyTo(messageId)
    setNewMessage(prev => ({
      ...prev,
      subject: originalSubject.startsWith('Re: ') ? originalSubject : `Re: ${originalSubject}`,
    }))
    setShowCompose(true)
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/manuscripts/${params.id}/messages/${messageId}/read`, {
        method: 'PATCH',
      })
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      )
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking message as read:', error)
      }
    }
  }

  const filteredMessages = messages.filter(message =>
    searchTerm === "" || 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const threadId = message.threadId || message.id
    if (!groups[threadId]) {
      groups[threadId] = []
    }
    groups[threadId].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'editor':
        return 'bg-purple-100 text-purple-800'
      case 'reviewer':
        return 'bg-blue-100 text-blue-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'author':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-600">
              {submissionTitle || `Manuscript ${params.id}`}
            </p>
          </div>
          <Button 
            onClick={() => setShowCompose(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Compose Message
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compose Message */}
        {showCompose && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {replyTo ? 'Reply to Message' : 'Compose New Message'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Type</Label>
                  <Select 
                    value={newMessage.recipientType} 
                    onValueChange={(value: 'editor' | 'reviewer' | 'admin') => 
                      setNewMessage(prev => ({ ...prev, recipientType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter message subject"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSendMessage}
                  disabled={submitting || !newMessage.content.trim() || !newMessage.subject.trim()}
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
                  onClick={() => {
                    setShowCompose(false)
                    setReplyTo(null)
                    setNewMessage({
                      recipientType: 'editor',
                      subject: '',
                      content: '',
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading messages...</p>
            </div>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
                <p className="text-slate-600 mb-4">
                  Start a conversation about your submission with the editorial team.
                </p>
                <Button onClick={() => setShowCompose(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send First Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedMessages).map(([threadId, threadMessages]) => {
              const firstMessage = threadMessages[0]
              const lastMessage = threadMessages[threadMessages.length - 1]
              const unreadCount = threadMessages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length

              return (
                <Card key={threadId} className="overflow-hidden">
                  <CardHeader className="bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{firstMessage.subject}</h3>
                          {unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white">
                              {unreadCount} unread
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(lastMessage.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {threadMessages
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((message, index) => (
                        <div 
                          key={message.id} 
                          className={`p-6 border-b border-slate-100 last:border-b-0 ${
                            !message.isRead && message.senderId !== session?.user?.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!message.isRead && message.senderId !== session?.user?.id) {
                              markAsRead(message.id)
                            }
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full">
                              <User className="h-5 w-5 text-slate-600" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-slate-900">{message.senderName}</span>
                                  <Badge variant="outline" className={getRoleColor(message.senderRole)}>
                                    {message.senderRole}
                                  </Badge>
                                  {!message.isRead && message.senderId !== session?.user?.id && (
                                    <Badge className="bg-blue-500 text-white text-xs">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Clock className="h-4 w-4" />
                                  {new Date(message.createdAt).toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="prose prose-sm max-w-none">
                                <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
                              </div>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-slate-700">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.attachments.map((attachment, attachIndex) => (
                                      <div key={attachIndex} className="flex items-center gap-2 p-2 bg-slate-100 rounded text-sm">
                                        <Paperclip className="h-4 w-4 text-slate-500" />
                                        <span>{attachment.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleReply(message.id, message.subject)}
                                >
                                  <Reply className="h-4 w-4 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
