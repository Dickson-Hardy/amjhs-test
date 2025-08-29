"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageSquare,
  Mail,
  Send,
  Reply,
  Forward,
  Archive,
  Trash2,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Calendar,
  Inbox,
  Send as SendIcon,
  Archive as ArchiveIcon,
  Trash as TrashIcon
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  subject: string
  content: string
  sender: {
    id: string
    name: string
    role: string
    email: string
  }
  recipients: {
    id: string
    name: string
    role: string
    email: string
  }[]
  submissionId?: string
  submissionTitle?: string
  messageType: "editorial" | "review" | "system" | "general"
  priority: "low" | "medium" | "high" | "urgent"
  status: "unread" | "read" | "replied" | "archived"
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  isReply: boolean
  parentMessageId?: string
  thread: Message[]
}

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface MessageStats {
  total: number
  unread: number
  editorial: number
  review: number
  system: number
}

export default function AuthorMessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [composeMode, setComposeMode] = useState(false)
  const [replyMode, setReplyMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    unread: 0,
    editorial: 0,
    review: 0,
    system: 0
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchMessages()
      fetchStats()
    }
  }, [session?.user?.id])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/messages`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/user/messages/stats`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching message stats:", error)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/user/messages/${messageId}/read`, {
        method: "PUT"
      })
      if (response.ok) {
        setMessages(messages.map(msg =>
          msg.id === messageId ? { ...msg, status: "read" } : msg
        ))
        fetchStats()
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const archiveMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/user/messages/${messageId}/archive`, {
        method: "PUT"
      })
      if (response.ok) {
        setMessages(messages.map(msg =>
          msg.id === messageId ? { ...msg, status: "archived" } : msg
        ))
        fetchStats()
        toast({
          title: "Success",
          description: "Message archived"
        })
      }
    } catch (error) {
      console.error("Error archiving message:", error)
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive"
      })
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/user/messages/${messageId}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId))
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null)
        }
        fetchStats()
        toast({
          title: "Success",
          description: "Message deleted"
        })
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      })
    }
  }

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message)
    if (message.status === "unread") {
      markAsRead(message.id)
    }
  }

  const getFilteredMessages = () => {
    let filtered = messages

    if (filterType !== "all") {
      filtered = filtered.filter(msg => msg.messageType === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(msg => msg.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "editorial":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "review":
        return <Eye className="h-4 w-4 text-green-600" />
      case "system":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "read":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "replied":
        return "bg-green-100 text-green-800 border-green-300"
      case "archived":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Editorial Messages</h1>
              <p className="text-slate-600">Communicate with the editorial team and track your submissions</p>
            </div>
            <Button onClick={() => setComposeMode(true)}>
              <Send className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </div>
        </div>

        {/* Message Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Messages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
              <div className="text-sm text-slate-600">Unread</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.editorial}</div>
              <div className="text-sm text-slate-600">Editorial</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.review}</div>
              <div className="text-sm text-slate-600">Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.system}</div>
              <div className="text-sm text-slate-600">System</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <div className="space-y-3">
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="editorial">Editorial</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {getFilteredMessages().length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getFilteredMessages().map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                            selectedMessage?.id === message.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                          }`}
                          onClick={() => handleMessageSelect(message)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getMessageTypeIcon(message.messageType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-slate-900 truncate">
                                  {message.subject}
                                </h4>
                                {message.status === "unread" && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-2 truncate">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{message.sender.name}</span>
                                <span>•</span>
                                <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getPriorityColor(message.priority)} variant="outline" size="sm">
                                  {message.priority}
                                </Badge>
                                <Badge className={getStatusColor(message.status)} variant="outline" size="sm">
                                  {message.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Content */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getMessageTypeIcon(selectedMessage.messageType)}
                        <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>From: {selectedMessage.sender.name} ({selectedMessage.sender.role})</span>
                        <span>•</span>
                        <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(selectedMessage.priority)} variant="outline">
                        {selectedMessage.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedMessage.status)} variant="outline">
                        {selectedMessage.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Submission Info */}
                  {selectedMessage.submissionId && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Related Submission:</strong> {selectedMessage.submissionTitle}
                        <Button variant="link" className="p-0 h-auto ml-2">
                          View Submission
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Message Content */}
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700">
                      {selectedMessage.content}
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedMessage.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{attachment.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                            <Button variant="outline" size="sm" className="ml-auto">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Thread */}
                  {selectedMessage.thread && selectedMessage.thread.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Message Thread</h4>
                      <div className="space-y-3">
                        {selectedMessage.thread.map((threadMessage) => (
                          <div key={threadMessage.id} className="border-l-2 border-slate-200 pl-4">
                            <div className="text-sm text-slate-600 mb-1">
                              {threadMessage.sender.name} • {new Date(threadMessage.createdAt).toLocaleString()}
                            </div>
                            <div className="text-slate-700">{threadMessage.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button onClick={() => setReplyMode(true)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" onClick={() => archiveMessage(selectedMessage.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" onClick={() => deleteMessage(selectedMessage.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Message</h3>
                  <p className="text-slate-600">Choose a message from the list to view its content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Compose Message Modal */}
        {composeMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Enter message subject" />
                </div>
                <div>
                  <Label htmlFor="recipient">To</Label>
                  <Input id="recipient" placeholder="Select recipient" />
                </div>
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    placeholder="Type your message..."
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setComposeMode(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reply Modal */}
        {replyMode && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Reply to Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="replySubject">Subject</Label>
                  <Input
                    id="replySubject"
                    defaultValue={`Re: ${selectedMessage.subject}`}
                  />
                </div>
                <div>
                  <Label htmlFor="replyContent">Message</Label>
                  <Textarea
                    id="replyContent"
                    placeholder="Type your reply..."
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReplyMode(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AuthorLayout>
    </RouteGuard>
  )
}
