"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Clock,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  Eye,
  Reply,
  Loader2,
} from "lucide-react"

interface Message {
  id: string
  from: {
    id: string
    name: string
    role: string
    email: string
  }
  to: {
    id: string
    name: string
    role: string
    email: string
  }
  subject: string
  content: string
  type: "submission" | "review" | "editorial" | "system"
  relatedId?: string // article or review ID
  isRead: boolean
  timestamp: string
  attachments?: { name: string; url: string }[]
}

interface Conversation {
  id: string
  participants: { id: string; name: string; role: string }[]
  subject: string
  lastMessage: string
  lastActivity: string
  unreadCount: number
  type: "submission" | "review" | "editorial"
  relatedTitle?: string
}

export default function CommunicationCenter() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [composeDialog, setComposeDialog] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newRecipient, setNewRecipient] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    async function fetchMessages() {
      if (!session?.user?.id) return

      logger.info("Fetching conversations for user:", session.user.id)

      try {
        const conversationsRes = await fetch(`/api/messages/conversations`)
        logger.api("Conversations response status:", conversationsRes.status)
        
        const conversationsData = await conversationsRes.json()
        logger.info("Conversations data:", conversationsData)

        if (conversationsData.success) {
          setConversations(conversationsData.conversations)
          logger.error("Set conversations:", conversationsData.conversations.length)
        } else {
          logger.error("Failed to fetch conversations:", conversationsData.error)
        }
      } catch (error) {
        logger.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [session])

  // Fetch messages for selected conversation
  useEffect(() => {
    async function fetchConversationMessages() {
      if (!selectedConversation) {
        setMessages([])
        return
      }

      try {
        const response = await fetch(`/api/messages?conversationId=${selectedConversation}`)
        const data = await response.json()

        if (data.success) {
          setMessages(data.messages)
        }
      } catch (error) {
        logger.error("Error fetching conversation messages:", error)
      }
    }

    fetchConversationMessages()
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) {
      logger.info("Cannot send message: missing content, conversation, or already sending")
      return
    }

    logger.info("Sending message:", { conversationId: selectedConversation, content: newMessage.trim() })
    
    setSendingMessage(true)

    try {
      const response = await fetch(`/api/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
        }),
      })

      logger.info("Response status:", response.status)
      
      const data = await response.json()
      logger.info("Response data:", data)

      if (response.ok && data.success) {
        logger.info("Message sent successfully!")
        setNewMessage("")
        
        // Refresh messages
        try {
          const updatedResponse = await fetch(`/api/messages?conversationId=${selectedConversation}`)
          const updatedData = await updatedResponse.json()
          
          if (updatedData.success) {
            setMessages(updatedData.messages)
            logger.error("Messages refreshed")
          }
        } catch (refreshError) {
          logger.error("Error refreshing messages:", refreshError)
        }
        
        // Refresh conversations list
        try {
          const conversationsRes = await fetch(`/api/messages/conversations`)
          const conversationsData = await conversationsRes.json()
          
          if (conversationsData.success) {
            setConversations(conversationsData.conversations)
            logger.error("Conversations refreshed")
          }
        } catch (refreshError) {
          logger.error("Error refreshing conversations:", refreshError)
        }
      } else {
        logger.error("Failed to send message:", data.error || "Unknown error")
        alert(`Failed to send message: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      logger.error("Error sending message:", error)
      alert("Error sending message. Please check your connection and try again.")
    } finally {
      setSendingMessage(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "submission":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-green-100 text-green-800"
      case "editorial":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "editor":
        return "bg-purple-100 text-purple-800"
      case "reviewer":
        return "bg-green-100 text-green-800"
      case "author":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // No need to filter messages as they're already fetched for the selected conversation
  const conversationMessages = messages

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button size="sm" onClick={() => setComposeDialog(true)}>
                <Send className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                    selectedConversation === conversation.id
                      ? "bg-blue-50 border-l-blue-500"
                      : "border-l-transparent"
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate max-w-[150px]">
                        {conversation.subject}
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-red-100 text-red-800 text-xs px-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <Badge className={getTypeColor(conversation.type)} variant="secondary">
                      {conversation.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 truncate mb-2">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-1">
                      {conversation.participants.slice(0, 3).map((participant, index) => (
                        <Avatar key={index} className="h-6 w-6 border-2 border-white">
                          <AvatarFallback className="text-xs">
                            {participant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                  {conversation.relatedTitle && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Re: {conversation.relatedTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.id === selectedConversation)?.subject}
                    </CardTitle>
                    <CardDescription>
                      {conversations.find(c => c.id === selectedConversation)?.participants
                        .map(p => `${p.name} (${p.role})`)
                        .join(", ")}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Mark All Read
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[650px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {conversationMessages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.from.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{message.from.name}</span>
                            <Badge className={getRoleColor(message.from.role)} variant="secondary">
                              {message.from.role}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {!message.isRead && (
                          <Badge className="bg-blue-100 text-blue-800">New</Badge>
                        )}
                      </div>
                      <div className="ml-10 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-600 mb-1">Attachments:</p>
                            {message.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={attachment.url}
                                className="text-xs text-blue-600 hover:underline block"
                              >
                                📎 {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="border-t pt-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      logger.info("Message input changed:", e.target.value);
                      setNewMessage(e.target.value);
                    }}
                    placeholder="Type your message..."
                    rows={3}
                    className="mb-3"
                  />
                  <div className="mb-2 text-xs text-gray-500">
                    Debug: Selected Conversation: {selectedConversation || "None"} | 
                    Message Length: {newMessage.trim().length} | 
                    Button Enabled: {!(!newMessage.trim() || !selectedConversation) ? "Yes" : "No"}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        📎 Attach
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => logger.info("Test button clicked!")}
                      >
                        Test Click
                      </Button>
                    </div>
                    <Button 
                      onClick={() => {
                        logger.info("Button clicked!"); // Debug
                        handleSendMessage();
                      }} 
                      disabled={!newMessage.trim() || !selectedConversation || sendingMessage}
                      type="button"
                    >
                      {sendingMessage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Compose Dialog */}
      {composeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">New Message</h2>
                <Button variant="outline" onClick={() => setComposeDialog(false)}>
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <Select value={newRecipient} onValueChange={setNewRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setComposeDialog(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-1" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
