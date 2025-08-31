"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { ReviewerAssignmentPanel } from "@/components/editor/reviewer-assignment-panel"
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageSquare,
  Send,
  UserPlus,
  Filter,
  BarChart3,
  BookOpen,
  Award,
  Target,
  Settings,
  Zap,
  Shield,
  Bell,
} from "lucide-react"

interface Manuscript {
  id: string
  title: string
  authors: string[]
  category: string
  submittedDate: string
  status: "submitted" | "technical_check" | "under_review" | "revision_requested" | "accepted" | "rejected" | "published"
  priority: "low" | "medium" | "high" | "urgent"
  reviewers: { id: string; name: string; status: string }[]
  deadline: string
  wordCount: number
  abstract: string
}

interface EditorStats {
  totalManuscripts: number
  underReview: number
  pendingDecision: number
  publishedThisMonth: number
  averageReviewTime: number
  acceptanceRate: number
}

interface Reviewer {
  id: string
  name: string
  email: string
  expertise: string[]
  currentLoad: number
  averageRating: number
  onTimeRate: number
  lastActive: string
}

export default function EditorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  // Redirect to dashboard to avoid conflicts with /editor/dashboard route
  useEffect(() => {
    router.replace('/editor/dashboard')
  }, [router])

  const [stats, setStats] = useState<EditorStats>({
    totalManuscripts: 0,
    underReview: 0,
    pendingDecision: 0,
    publishedThisMonth: 0,
    averageReviewTime: 0,
    acceptanceRate: 0,
  })
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null)
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decision, setDecision] = useState("")
  const [decisionComments, setDecisionComments] = useState("")
  const [loading, setLoading] = useState(true)

  // Show loading while redirecting
  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    </RouteGuard>
  )

}
