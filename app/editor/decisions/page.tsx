"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Edit3,
  AlertTriangle,
  MessageSquare,
  Send,
  Filter,
  Search,
  Eye,
  Download,
  RotateCcw,
} from "lucide-react"

interface Manuscript {
  id: string
  title: string
  authors: string[]
  category: string
  submittedDate: string
  status: "awaiting_decision" | "revision_requested" | "decided"
  priority: "low" | "medium" | "high" | "urgent"
  reviewScores: number[]
  averageScore: number
  reviewComments: string[]
  wordCount: number
  abstract: string
  lastReviewDate: string
  daysInReview: number
}

interface Decision {
  manuscriptId: string
  decision: "accept" | "reject" | "major_revision" | "minor_revision"
  comments: string
  confidentialComments?: string
  recommendedReviewers?: string[]
  deadline?: string
}

export default function EditorialDecisionsPage() {
  const { data: session } = useSession()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [filteredManuscripts, setFilteredManuscripts] = useState<Manuscript[]>([])
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null)
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decision, setDecision] = useState<Decision>({
    manuscriptId: "",
    decision: "accept",
    comments: "",
    confidentialComments: "",
    recommendedReviewers: [],
    deadline: ""
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchManuscripts()
  }, [])

  useEffect(() => {
    filterManuscripts()
  }, [manuscripts, searchTerm, statusFilter, priorityFilter])

  const fetchManuscripts = async () => {
    try {
      const response = await fetch('/api/editor/submissions?status=awaiting_decision')
      if (response.ok) {
        const data = await response.json()
        setManuscripts(data.manuscripts || [])
      } else {
        console.error('Failed to fetch manuscripts')
        setManuscripts([])
      }
    } catch (error) {
      console.error("Error fetching manuscripts:", error)
      setManuscripts([])
    } finally {
      setLoading(false)
    }
  }

  const filterManuscripts = () => {
    let filtered = manuscripts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(manuscript =>
        manuscript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manuscript.authors.some(author => 
          author.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        manuscript.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(manuscript => manuscript.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(manuscript => manuscript.priority === priorityFilter)
    }

    setFilteredManuscripts(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      awaiting_decision: "bg-yellow-100 text-yellow-800",
      revision_requested: "bg-blue-100 text-blue-800",
      decided: "bg-green-100 text-green-800"
    }
    return variants[status as keyof typeof variants] || variants.awaiting_decision
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    }
    return variants[priority as keyof typeof variants] || variants.medium
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return "text-green-600"
    if (score >= 3.0) return "text-yellow-600"
    return "text-red-600"
  }

  const openDecisionDialog = (manuscript: Manuscript) => {
    setSelectedManuscript(manuscript)
    setDecision({
      manuscriptId: manuscript.id,
      decision: "accept",
      comments: "",
      confidentialComments: "",
      recommendedReviewers: [],
      deadline: ""
    })
    setDecisionDialog(true)
  }

  const submitDecision = async () => {
    try {
      const response = await fetch(`/api/editor/decisions/${decision.manuscriptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision)
      })
      
      if (response.ok) {
        // Refresh manuscripts list
        fetchManuscripts()
        setDecisionDialog(false)
        setSelectedManuscript(null)
      } else {
        console.error('Failed to submit decision')
      }
    } catch (error) {
      console.error("Error submitting decision:", error)
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editorial Decisions</h1>
              <p className="text-gray-600">Review manuscripts and make editorial decisions</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search manuscripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="awaiting_decision">Awaiting Decision</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                <SelectItem value="decided">Decided</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manuscripts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Manuscripts Awaiting Decision</CardTitle>
              <CardDescription>
                Review completed manuscripts and make editorial decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manuscript</TableHead>
                    <TableHead>Review Score</TableHead>
                    <TableHead>Days in Review</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManuscripts.map((manuscript) => (
                    <TableRow key={manuscript.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{manuscript.title}</div>
                          <div className="text-sm text-gray-500">
                            {manuscript.authors.join(", ")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {manuscript.category} • {manuscript.wordCount} words
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getScoreColor(manuscript.averageScore)}`}>
                          {manuscript.averageScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ({manuscript.reviewScores.length} reviews)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{manuscript.daysInReview}</div>
                        <div className="text-sm text-gray-500">days</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(manuscript.priority)}>
                          {manuscript.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(manuscript.status)}>
                          {manuscript.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDecisionDialog(manuscript)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Decision Dialog */}
          <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editorial Decision</DialogTitle>
                <DialogDescription>
                  Make a decision for: {selectedManuscript?.title}
                </DialogDescription>
              </DialogHeader>

              {selectedManuscript && (
                <div className="space-y-6">
                  {/* Manuscript Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manuscript Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-medium">Abstract</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedManuscript.abstract}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Authors</h4>
                          <p className="text-sm text-gray-600">{selectedManuscript.authors.join(", ")}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Category</h4>
                          <p className="text-sm text-gray-600">{selectedManuscript.category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Review Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Average Score:</span>
                            <span className={`ml-2 font-bold ${getScoreColor(selectedManuscript.averageScore)}`}>
                              {selectedManuscript.averageScore.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Individual Scores:</span>
                            <span className="ml-2">
                              {selectedManuscript.reviewScores.map((score, idx) => (
                                <span key={idx} className="ml-1">
                                  {score.toFixed(1)}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Reviewer Comments</h4>
                          {selectedManuscript.reviewComments.map((comment, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
                              <p className="text-sm">{comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Decision Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Editorial Decision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Decision</label>
                        <Select
                          value={decision.decision}
                          onValueChange={(value) => setDecision(prev => ({ ...prev, decision: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accept">Accept</SelectItem>
                            <SelectItem value="minor_revision">Minor Revision Required</SelectItem>
                            <SelectItem value="major_revision">Major Revision Required</SelectItem>
                            <SelectItem value="reject">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Comments to Authors</label>
                        <Textarea
                          placeholder="Enter your decision letter to the authors..."
                          value={decision.comments}
                          onChange={(e) => setDecision(prev => ({ ...prev, comments: e.target.value }))}
                          rows={6}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Confidential Comments (Internal)</label>
                        <Textarea
                          placeholder="Internal notes (not shared with authors)..."
                          value={decision.confidentialComments}
                          onChange={(e) => setDecision(prev => ({ ...prev, confidentialComments: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      {(decision.decision === "minor_revision" || decision.decision === "major_revision") && (
                        <div>
                          <label className="text-sm font-medium">Revision Deadline</label>
                          <Input
                            type="date"
                            value={decision.deadline}
                            onChange={(e) => setDecision(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setDecisionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={submitDecision}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Decision
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}