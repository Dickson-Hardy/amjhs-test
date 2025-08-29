"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  Send, 
  X, 
  Eye, 
  Download, 
  Share,
  User,
  Clock,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Plus,
  Check,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/use-toast'

interface DocumentComment {
  id: string
  manuscriptId: string
  userId: string
  userName: string
  userRole: string
  userAvatar?: string
  content: string
  position: {
    start: number
    end: number
    selectedText: string
  }
  replies: CommentReply[]
  status: 'open' | 'resolved' | 'archived'
  createdAt: Date
  updatedAt: Date
  mentions: string[]
}

interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: Date
}

interface EnhancedDocumentViewerProps {
  manuscriptId: string
  documentTitle: string
  documentContent: string
  documentUrl?: string
  previewUrl?: string
  doi?: string
  version?: number
  userRole: 'admin' | 'editor' | 'reviewer' | 'author'
  permissions: {
    canComment: boolean
    canEdit: boolean
    canDownload: boolean
    canShare: boolean
  }
  onContentChange?: (content: string) => void
  className?: string
}

export function EnhancedDocumentViewer({
  manuscriptId,
  documentTitle,
  documentContent,
  documentUrl,
  previewUrl,
  doi,
  version = 1,
  userRole,
  permissions,
  onContentChange,
  className = ""
}: EnhancedDocumentViewerProps) {
  const { data: session } = useSession()
  
  // Document state
  const [content, setContent] = useState(documentContent)
  const [selectedText, setSelectedText] = useState<{
    start: number
    end: number
    text: string
  } | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  
  // Comment state
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(true)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Refs
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)

  // Load comments on mount
  useEffect(() => {
    loadComments()
  }, [manuscriptId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`)
      const data = await response.json()
      
      if (data.success) {
        setComments(data.comments || [])
      } else {
        setError('Failed to load comments')
      }
    } catch (error) {
      logger.error('Failed to load comments:', error)
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleTextSelection = useCallback(() => {
    if (!textAreaRef.current || !permissions.canComment) return

    const start = textAreaRef.current.selectionStart
    const end = textAreaRef.current.selectionEnd

    if (start !== end && end > start) {
      const selectedText = content.substring(start, end)
      setSelectedText({
        start,
        end,
        text: selectedText
      })
    } else {
      setSelectedText(null)
    }
  }, [content, permissions.canComment])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    if (onContentChange) {
      onContentChange(newContent)
    }
  }, [onContentChange])

  const addComment = async () => {
    if (!newComment.trim() || !selectedText || !session?.user) return

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          position: selectedText,
          userRole,
          mentions: extractMentions(newComment)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        setSelectedText(null)
        
        toast({
          title: "Comment Added",
          description: "Your comment has been added successfully."
        })
      } else {
        throw new AppError(data.error || 'Failed to add comment')
      }
    } catch (error) {
      logger.error('Failed to add comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  const addReply = async (commentId: string) => {
    if (!replyContent.trim() || !session?.user) return

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          mentions: extractMentions(replyContent)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, replies: [...comment.replies, data.reply] }
            : comment
        ))
        setReplyContent('')
        setReplyingTo(null)
        
        toast({
          title: "Reply Added",
          description: "Your reply has been added successfully."
        })
      } else {
        throw new AppError(data.error || 'Failed to add reply')
      }
    } catch (error) {
      logger.error('Failed to add reply:', error)
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive"
      })
    }
  }

  const resolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments/${commentId}/resolve`, {
        method: 'PATCH'
      })

      const data = await response.json()
      
      if (data.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, status: 'resolved' }
            : comment
        ))
        
        toast({
          title: "Comment Resolved",
          description: "The comment has been marked as resolved."
        })
      }
    } catch (error) {
      logger.error('Failed to resolve comment:', error)
      toast({
        title: "Error",
        description: "Failed to resolve comment.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    if (!documentUrl) return

    try {
      setIsDownloading(true)
      const response = await fetch(`/api/manuscripts/${manuscriptId}/download`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success && data.downloadUrl) {
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = `${documentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Download Started",
          description: "Your document download has started."
        })
      } else {
        throw new AppError('Download failed')
      }
    } catch (error) {
      logger.error('Download error:', error)
      toast({
        title: "Download Error",
        description: "Failed to download document.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
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

  const getCommentsByPosition = () => {
    return comments
      .filter(comment => comment.status !== 'archived')
      .sort((a, b) => a.position.start - b.position.start)
  }

  const getHighlightedContent = () => {
    if (comments.length === 0) return content

    let highlightedContent = content
    const sortedComments = getCommentsByPosition()
    let offset = 0

    sortedComments.forEach((comment, index) => {
      const start = comment.position.start + offset
      const end = comment.position.end + offset
      const commentId = comment.id
      
      const highlightStart = `<span class="bg-yellow-100 border-l-2 border-yellow-400 cursor-pointer" data-comment-id="${commentId}">`
      const highlightEnd = `</span>`
      
      highlightedContent = 
        highlightedContent.slice(0, start) + 
        highlightStart + 
        highlightedContent.slice(start, end) + 
        highlightEnd + 
        highlightedContent.slice(end)
      
      offset += highlightStart.length + highlightEnd.length
    })

    return highlightedContent
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'reviewer': return 'bg-green-100 text-green-800'
      case 'author': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{documentTitle}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Version {version}
                  </Badge>
                  {doi && (
                    <Badge variant="outline" className="text-xs">
                      DOI: {doi}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getRoleColor(userRole)}`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {permissions.canDownload && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              )}
              
              {permissions.canShare && (
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              
              {previewUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>{documentTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-gray-100 rounded">
                      <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-0"
                        title={`Preview of ${documentTitle}`}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Editor/Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Document Content</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {comments.filter(c => c.status === 'open').length} active comments
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  ref={textAreaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onSelect={handleTextSelection}
                  placeholder="Document content will appear here..."
                  className="min-h-[500px] font-mono text-sm leading-relaxed"
                  readOnly={!permissions.canEdit}
                />

                {/* Comment Input */}
                {selectedText && permissions.canComment && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-800">
                            Add Comment
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedText(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-2 bg-white rounded border text-xs">
                          <span className="text-muted-foreground">Selected text: </span>
                          <span className="font-medium">"{selectedText.text}"</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add your comment... (use @username to mention)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
                            className="text-sm"
                          />
                          <Button 
                            size="sm" 
                            onClick={addComment} 
                            disabled={!newComment.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Select text to add the first comment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCommentsByPosition().map((comment) => (
                      <Card 
                        key={comment.id} 
                        className={`${
                          comment.status === 'resolved' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white'
                        } ${
                          activeCommentId === comment.id 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Comment Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={comment.userAvatar} />
                                  <AvatarFallback className="text-xs">
                                    {comment.userName.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-sm font-medium">{comment.userName}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={`ml-2 text-xs ${getRoleColor(comment.userRole)}`}
                                  >
                                    {comment.userRole}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {comment.status === 'resolved' ? (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => resolveComment(comment.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as resolved</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Selected Text */}
                            <div className="p-2 bg-muted rounded text-xs">
                              <span className="text-muted-foreground">Selected: </span>
                              <span className="font-medium">"{comment.position.selectedText}"</span>
                            </div>

                            {/* Comment Content */}
                            <p className="text-sm">{comment.content}</p>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-muted space-y-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={reply.userAvatar} />
                                        <AvatarFallback className="text-xs">
                                          {reply.userName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium">{reply.userName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-xs pl-6">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.id ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addReply(comment.id)}
                                    className="text-sm"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => addReply(comment.id)}
                                    disabled={!replyContent.trim()}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setReplyingTo(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-xs"
                              >
                                Reply
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedDocumentViewer
