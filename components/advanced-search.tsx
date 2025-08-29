"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Calendar, User, FileText } from "lucide-react"

interface SearchFilters {
  query: string
  status: string
  category: string
  dateRange: string
  author: string
  editor: string
  reviewer: string
}

interface SearchResult {
  id: string
  title: string
  status: string
  category: string
  author: string
  submittedDate: string
  lastUpdated: string
  type: "manuscript" | "review" | "assignment"
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  placeholder?: string
  showFilters?: boolean
  results?: SearchResult[]
  isLoading?: boolean
}

export function AdvancedSearch({
  onSearch,
  onClear,
  placeholder = "Search manuscripts, reviews, assignments...",
  showFilters = true,
  results = [],
  isLoading = false
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: "",
    category: "",
    dateRange: "",
    author: "",
    editor: "",
    reviewer: ""
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleClear = () => {
    setFilters({
      query: "",
      status: "",
      category: "",
      dateRange: "",
      author: "",
      editor: "",
      reviewer: ""
    })
    onClear()
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      "under_review": "bg-yellow-100 text-yellow-800",
      "revision_requested": "bg-orange-100 text-orange-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      published: "bg-purple-100 text-purple-800",
      pending: "bg-gray-100 text-gray-800",
      completed: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Find manuscripts, reviews, and assignments with precision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* process.env.AUTH_TOKEN_PREFIX + ' 'Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={placeholder}
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {isExpanded ? "Hide" : "Show"} Advanced Filters
              </Button>

              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="revision_requested">Revision Requested</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                        <SelectItem value="methodology">Methodology</SelectItem>
                        <SelectItem value="commentary">Commentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      placeholder="Search by author name"
                      value={filters.author}
                      onChange={(e) => handleFilterChange("author", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editor">Editor</Label>
                    <Input
                      placeholder="Search by editor name"
                      value={filters.editor}
                      onChange={(e) => handleFilterChange("editor", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewer">Reviewer</Label>
                    <Input
                      placeholder="Search by reviewer name"
                      value={filters.reviewer}
                      onChange={(e) => handleFilterChange("reviewer", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium">{result.title}</h4>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {result.submittedDate}
                      </span>
                      <Badge variant="outline">{result.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
