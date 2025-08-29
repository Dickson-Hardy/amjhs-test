"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, SortDesc } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface SubmissionFilterBarProps {
  activeFilter: string
  onFilterChange?: (filter: string) => void
}

export function SubmissionFilterBar({ 
  activeFilter, 
  onFilterChange 
}: SubmissionFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterOptions = [
    { value: 'all', label: 'All Submissions' },
    { value: 'technical_check', label: 'Technical Check' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'revisions', label: 'Revision Needed' },
    { value: 'published', label: 'Published' },
  ]

  const handleFilterChange = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter)
      return
    }

    // Default URL-based filter change
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">Filter:</span>
      </div>
      
      <Select value={activeFilter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="ml-auto flex items-center gap-2">
        <SortDesc className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">Sort by date</span>
      </div>
    </div>
  )
}