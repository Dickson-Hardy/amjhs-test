/**
 * Real-Time Collaboration Editor Component
 * Provides live collaborative editing with operational transformation
 */

"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  MessageSquare, 
  History, 
  Save, 
  Share,
  Eye,
  Edit,
  Clock,
  User,
  Send,
  Paperclip,
  X,
  Plus,
  GitBranch,
  Download,
  RefreshCw
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface CollaborationSession {
  id: string
  manuscriptId: string
  sessionType: 'review' | 'edit' | 'comment'
  title: string
  createdBy: string
  createdAt: string
  participants: Array<{
    id: string
    name: string
    email: string
    role: string
    status: 'active' | 'idle' | 'away' | 'offline'
    cursor?: {
      position: number
      selection?: { start: number; end: number }
    }
    color: string
  }>
  permissions: {
    canEdit: boolean
    canComment: boolean
    canViewHistory: boolean
    canManageUsers: boolean
  }
  content: string
  version: number
  lastModified: string
}

interface Comment {
  id: string
  sessionId: string
  userId: string
  userName: string
  content: string
  position: {
    start: number
    end: number
  }
  parentId?: string
  mentions: string[]
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  createdAt: string
  replies?: Comment[]
  resolved?: boolean
}

interface EditOperation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  attributes?: Record<string, string | number | boolean>
}

interface RealTimeCollaborationEditorProps {
  manuscriptId: string
  sessionId?: string
  onSessionCreated?: (session: CollaborationSession) => void
  className?: string
}

export function RealTimeCollaborationEditor({ 
  manuscriptId, 
  sessionId,
  onSessionCreated,
  className 
}: RealTimeCollaborationEditorProps) {
  const { data: session } = useSession()
  const [collaborationSession, setCollaborationSession] = useState<CollaborationSession | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null)
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  
  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const versionRef = useRef(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (session?.user && manuscriptId) {
      if (sessionId) {
        loadSession(sessionId)
      } else {
        initializeCollaboration()
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [session, manuscriptId, sessionId])

  const initializeCollaboration = async () => {
    try {
      setLoading(true)
      setError(null)

      // Create a new collaboration session
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-session',
          manuscriptId,
          sessionType: 'edit',
          permissions: {
            canEdit: true,
            canComment: true,
            canViewHistory: true,
            canManageUsers: true
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setCollaborationSession(data.data)
        setContent(data.data.content || '')
        versionRef.current = data.data.version || 0
        
        if (onSessionCreated) {
          onSessionCreated(data.data)
        }

        // Initialize WebSocket connection
        initializeWebSocket(data.data.id)
        
        // Load comments
        loadComments(data.data.id)
      } else {
        setError(data.error || 'Failed to create collaboration session')
      }
    } catch (error) {
      logger.error('Failed to initialize collaboration:', error)
      setError('Failed to initialize collaboration')
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/collaboration?action=session&sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setCollaborationSession(data.data)
        setContent(data.data.content || '')
        versionRef.current = data.data.version || 0

        // Join the session
        await joinSession(sessionId)
        
        // Initialize WebSocket connection
        initializeWebSocket(sessionId)
        
        // Load comments
        loadComments(sessionId)
      } else {
        setError(data.error || 'Failed to load collaboration session')
      }
    } catch (error) {
      logger.error('Failed to load session:', error)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join-session',
          sessionId,
          permissions: {
            canEdit: true,
            canComment: true,
            canViewHistory: true
          }
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new AppError(data.error || 'Failed to join session')
      }
    } catch (error) {
      logger.error('Failed to join session:', error)
      setError('Failed to join session')
    }
  }

  const loadComments = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/manuscripts/${collaborationSession?.manuscriptId}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.comments || [])
      }
    } catch (error) {
      logger.error('Failed to load comments:', error)
    }
  }

  const initializeWebSocket = (sessionId: string) => {
    if (!session?.user?.id) return

    try {
      // In a real implementation, this would connect to your WebSocket server
      // For now, we'll simulate the connection
      
      logger.info('Initializing WebSocket connection for session:', sessionId)
      
      // Simulate WebSocket events for demo purposes
      const mockWebSocket = {
        send: (data: string) => {
          logger.info('WebSocket send:', data)
        },
        close: () => {
          logger.info('WebSocket closed')
        }
      }
      
      wsRef.current = mockWebSocket as WebSocket

    } catch (error) {
      logger.error('Failed to initialize WebSocket:', error)
      setError('Real-time features may not work properly')
    }
  }

  const handleContentChange = useCallback((newContent: string) => {
    if (!collaborationSession || !session?.user) return

    setContent(newContent)
    setIsTyping(true)

    // Clear existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new typing timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)

    // Calculate edit operations (simplified)
    const operation: EditOperation = {
      type: 'retain',
      position: 0,
      content: newContent
    }

    // Send edit operation via WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'apply-edit',
        sessionId: collaborationSession.id,
        operation,
        version: versionRef.current,
        userId: session.user.id
      }))
    }

    // Also send via REST API as backup
    applyEdit(operation)
  }, [collaborationSession, session])

  const applyEdit = async (operation: EditOperation) => {
    if (!collaborationSession || !session?.user) return

    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply-edit',
          sessionId: collaborationSession.id,
          operation,
          version: versionRef.current,
          userId: session.user.id
        })
      })

      const data = await response.json()
      if (data.success) {
        versionRef.current = data.data.newVersion
      }
    } catch (error) {
      logger.error('Failed to apply edit:', error)
    }
  }

  const handleTextSelection = () => {
    if (!editorRef.current) return

    const start = editorRef.current.selectionStart
    const end = editorRef.current.selectionEnd

    if (start !== end) {
      setSelectedText({ start, end })
    } else {
      setSelectedText(null)
    }

    // Update cursor position for other users
    if (wsRef.current && collaborationSession) {
      wsRef.current.send(JSON.stringify({
        type: 'update-cursor',
        sessionId: collaborationSession.id,
        cursor: start,
        selection: start !== end ? { start, end } : undefined
      }))
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedText || !collaborationSession) return

    try {
      const response = await fetch(`/api/manuscripts/${collaborationSession.manuscriptId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          position: {
            start: selectedText.start,
            end: selectedText.end,
            text: content.substring(selectedText.start, selectedText.end)
          },
          userRole: session?.user?.role || 'reviewer',
          mentions: extractMentions(newComment)
        })
      })

      const data = await response.json()
      if (data.success) {
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        setSelectedText(null)
        
        // Broadcast to other users via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'comment_added',
            sessionId: collaborationSession.id,
            comment: data.comment
          }))
        }
      }
    } catch (error) {
      logger.error('Failed to add comment:', error)
    }
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  const createVersion = async () => {
    if (!collaborationSession) return

    try {
      const description = prompt('Enter version description:')
      if (!description) return

      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-version',
          sessionId: collaborationSession.id,
          description
        })
      })

      const data = await response.json()
      if (data.success) {
        // Note: This component would need toast hook integration
        logger.error('Version created successfully!')
      }
    } catch (error) {
      logger.error('Failed to create version:', error)
    }
  }

  const getActiveUsers = () => {
    return collaborationSession?.participants.filter(p => p.status === 'active') || []
  }

  const getUserColor = (userId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
    const index = userId.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin mr-3" />
          <span>Initializing collaboration...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!collaborationSession) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Start Collaboration</h3>
          <p className="text-muted-foreground mb-6 text-center">
            Create a real-time collaboration session to work together with your team
          </p>
          <Button onClick={initializeCollaboration}>
            <Plus className="h-4 w-4 mr-2" />
            Start Collaboration
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Collaboration Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Live Collaboration
                <Badge variant="outline">
                  {collaborationSession.sessionType}
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time collaborative editing with {getActiveUsers().length} active user(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={createVersion}>
                <GitBranch className="h-4 w-4 mr-2" />
                Save Version
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              {getActiveUsers().map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger>
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-white shadow-md">
                        <AvatarImage src={`/placeholder-user.jpg`} />
                        <AvatarFallback className={getUserColor(user.id)}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                          user.status === 'active' ? 'bg-green-500' : 
                          user.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name} ({user.role})</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Document Editor</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Version {versionRef.current}
                  <span>•</span>
                  Last saved: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={editorRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleTextSelection}
                placeholder="Start typing to collaborate in real-time..."
                className="min-h-[400px] font-mono text-sm"
                disabled={!collaborationSession.permissions.canEdit}
              />

              {selectedText && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Add Comment</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedText(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-background rounded border text-xs">
                      Selected: "{content.substring(selectedText.start, selectedText.end)}"
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add your comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment()}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comments Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {showComments && (
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                    <p className="text-xs text-muted-foreground">Select text to add a comment</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {comment.userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.userName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      {comment.position && (
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                          "{content.substring(comment.position.start, comment.position.end)}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-xs">{collaborationSession.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(collaborationSession.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {collaborationSession.sessionType}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {collaborationSession.permissions.canEdit && (
                    <Badge variant="secondary" className="text-xs">Edit</Badge>
                  )}
                  {collaborationSession.permissions.canComment && (
                    <Badge variant="secondary" className="text-xs">Comment</Badge>
                  )}
                  {collaborationSession.permissions.canViewHistory && (
                    <Badge variant="secondary" className="text-xs">History</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RealTimeCollaborationEditor
