"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Eye, EyeOff } from "lucide-react"
import { useSession } from "next-auth/react"

interface Comment {
  id: string
  content: string
  type: "review" | "editorial" | "author_response"
  isPrivate: boolean
  lineNumber?: number
  createdAt: string
  authorName: string
}

interface CommentSystemProps {
  articleId: string
  userRole: string
}

export function CommentSystem({ articleId, userRole }: CommentSystemProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentType, setCommentType] = useState<"review" | "editorial" | "author_response">("review")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [articleId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/submissions/${articleId}/comments`)
      const data = await response.json()
      if (data.success) {
        setComments(data.comments)
      }
    } catch (error) {
      logger.error("Error fetching comments:", error)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/submissions/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          type: commentType,
          isPrivate,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNewComment("")
        fetchComments()
      }
    } catch (error) {
      logger.error("Error submitting comment:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case "review":
        return "bg-blue-100 text-blue-800"
      case "editorial":
        return "bg-purple-100 text-purple-800"
      case "author_response":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments & Annotations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          {session && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value as unknown)}
                  className="px-3 py-2 border rounded-md"
                >
                  {userRole === "reviewer" && <option value="review">Review Comment</option>}
                  {["editor", "admin"].includes(userRole) && <option value="editorial">Editorial Note</option>}
                  {userRole === "author" && <option value="author_response">Author Response</option>}
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                  <span className="text-sm">Private</span>
                  {isPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </label>
              </div>
              <Textarea
                placeholder="Add your comment or annotation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={submitComment} disabled={loading || !newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : "Submit Comment"}
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCommentTypeColor(comment.type)}>{comment.type.replace("_", " ")}</Badge>
                    {comment.isPrivate && (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {comment.authorName} • {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
                {comment.lineNumber && <div className="text-xs text-gray-500 mt-2">Line {comment.lineNumber}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
