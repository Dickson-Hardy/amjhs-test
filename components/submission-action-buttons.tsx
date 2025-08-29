"use client"

import { ActionButton } from "@/components/ui/action-button"
import { 
  Eye, 
  MessageSquare, 
  Edit, 
  Download,
  Clock
} from "lucide-react"

interface Submission {
  id: string
  status: string
  comments: number
}

interface SubmissionActionButtonsProps {
  submission: Submission
  context?: 'dashboard' | 'list' | 'details'
}

export function SubmissionActionButtons({ 
  submission, 
  context = 'dashboard' 
}: SubmissionActionButtonsProps) {
  // Primary action based on status
  const getPrimaryAction = () => {
    switch (submission.status) {
      case "revision_requested":
        return (
          <ActionButton
            icon={Edit}
            label="Submit Revision"
            href={`/submissions/${submission.id}/revise`}
            variant="default"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          />
        )
      case "accepted":
      case "published":
        return (
          <ActionButton
            icon={Download}
            label="Download"
            href={`/submissions/${submission.id}/download`}
            className="border-green-300 text-green-700 hover:bg-green-50"
          />
        )
      case "technical_check":
      case "under_review":
        return (
          <ActionButton
            icon={Clock}
            label="Track Status"
            href={`/submissions/${submission.id}/status`}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          />
        )
      default:
        return (
          <ActionButton
            icon={Eye}
            label="View Details"
            href={`/submissions/${submission.id}`}
            className="hover:bg-indigo-50"
          />
        )
    }
  }

  // Condensed view for mobile or tight spaces
  if (context === 'list') {
    return (
      <div className="flex gap-1">
        {getPrimaryAction()}
        <ActionButton
          icon={MessageSquare}
          label=""
          href={`/submissions/${submission.id}/messages`}
          variant="ghost"
          className="p-1 h-8 w-8"
          badge={submission.comments}
        />
      </div>
    )
  }

  // Full action buttons for dashboard
  return (
    <div className="flex gap-2">
      {getPrimaryAction()}
      <ActionButton
        icon={MessageSquare}
        label="Messages"
        href={`/submissions/${submission.id}/messages`}
        className="hover:bg-blue-50"
        badge={submission.comments}
      />
    </div>
  )
}