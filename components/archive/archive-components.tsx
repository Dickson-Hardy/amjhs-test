"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, FileText, Eye, Download, ExternalLink } from "lucide-react"
import Link from "next/link"

interface VolumeDisplayProps {
  volume: {
    id: string
    number: string
    year: number
    title?: string
    description?: string
    coverImage?: string
    publishedDate?: string
    status: string
    issueCount: number
    articleCount: number
  }
  issues?: Array<{
    id: string
    number: string
    title?: string
    articleCount: number
    publishedDate?: string
    status: string
    specialIssue: boolean
  }>
  compact?: boolean
  showIssues?: boolean
}

export function VolumeDisplay({ volume, issues = [], compact = false, showIssues = true }: VolumeDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                Volume {volume.number} ({volume.year})
              </h3>
              {volume.title && (
                <p className="text-sm text-gray-600">{volume.title}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {volume.issueCount} issues
                </span>
                <span>{volume.articleCount} articles</span>
              </div>
            </div>
            <Badge 
              variant={volume.status === 'published' ? 'default' : 'secondary'}
            >
              {volume.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {volume.coverImage && (
                <img 
                  src={volume.coverImage} 
                  alt={`Volume ${volume.number} cover`}
                  className="w-16 h-20 object-cover rounded border"
                />
              )}
              <div>
                <CardTitle className="text-xl">
                  Volume {volume.number} ({volume.year})
                </CardTitle>
                {volume.title && (
                  <p className="text-gray-600 mt-1">{volume.title}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {volume.issueCount} issues
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {volume.articleCount} articles
                  </span>
                  {volume.publishedDate && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(volume.publishedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Badge 
            variant={volume.status === 'published' ? 'default' : 'secondary'}
          >
            {volume.status}
          </Badge>
        </div>
        
        {volume.description && (
          <p className="text-gray-700 leading-relaxed">{volume.description}</p>
        )}
      </CardHeader>

      {showIssues && issues.length > 0 && (
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Issues in this Volume</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Show All'}
            </Button>
          </div>

          <div className="space-y-3">
            {(expanded ? issues : issues.slice(0, 3)).map((issue) => (
              <Card key={issue.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">
                        Issue {issue.number}
                        {issue.specialIssue && (
                          <Badge variant="outline" className="ml-2">
                            Special Issue
                          </Badge>
                        )}
                      </h5>
                      {issue.title && (
                        <p className="text-sm text-gray-600">{issue.title}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>{issue.articleCount} articles</span>
                        {issue.publishedDate && (
                          <span>
                            Published: {new Date(issue.publishedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={issue.status === 'published' ? 'default' : 'secondary'}
                      >
                        {issue.status}
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/archive/volume/${volume.id}/issue/${issue.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!expanded && issues.length > 3 && (
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setExpanded(true)}
                >
                  Show {issues.length - 3} more issues
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

interface IssueDisplayProps {
  issue: {
    id: string
    number: string
    title?: string
    description?: string
    coverImage?: string
    publishedDate?: string
    status: string
    articleCount: number
    pageRange?: string
    specialIssue: boolean
    guestEditors?: string[]
  }
  volume?: {
    number: string
    year: number
  }
  articles?: Array<{
    id: string
    title: string
    authors: string[]
    pages?: string
    doi?: string
  }>
  compact?: boolean
  showArticles?: boolean
}

export function IssueDisplay({ issue, volume, articles = [], compact = false, showArticles = true }: IssueDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                Issue {issue.number}
                {issue.specialIssue && (
                  <Badge variant="outline" className="ml-2">Special</Badge>
                )}
              </h3>
              {volume && (
                <p className="text-sm text-gray-600">
                  Volume {volume.number} ({volume.year})
                </p>
              )}
              {issue.title && (
                <p className="text-sm text-gray-600">{issue.title}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span>{issue.articleCount} articles</span>
                {issue.pageRange && <span>pp. {issue.pageRange}</span>}
              </div>
            </div>
            <Badge 
              variant={issue.status === 'published' ? 'default' : 'secondary'}
            >
              {issue.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {issue.coverImage && (
                <img 
                  src={issue.coverImage} 
                  alt={`Issue ${issue.number} cover`}
                  className="w-16 h-20 object-cover rounded border"
                />
              )}
              <div>
                <CardTitle className="text-xl">
                  Issue {issue.number}
                  {issue.specialIssue && (
                    <Badge variant="outline" className="ml-2">
                      Special Issue
                    </Badge>
                  )}
                </CardTitle>
                {volume && (
                  <p className="text-gray-600">
                    Volume {volume.number} ({volume.year})
                  </p>
                )}
                {issue.title && (
                  <p className="text-gray-700 mt-1 font-medium">{issue.title}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {issue.articleCount} articles
                  </span>
                  {issue.pageRange && (
                    <span>Pages: {issue.pageRange}</span>
                  )}
                  {issue.publishedDate && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(issue.publishedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Badge 
            variant={issue.status === 'published' ? 'default' : 'secondary'}
          >
            {issue.status}
          </Badge>
        </div>
        
        {issue.description && (
          <p className="text-gray-700 leading-relaxed">{issue.description}</p>
        )}

        {issue.guestEditors && issue.guestEditors.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-1">Guest Editors</h4>
            <p className="text-sm text-blue-800">{issue.guestEditors.join(", ")}</p>
          </div>
        )}
      </CardHeader>

      {showArticles && articles.length > 0 && (
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Articles in this Issue</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Show All'}
            </Button>
          </div>

          <div className="space-y-3">
            {(expanded ? articles : articles.slice(0, 5)).map((article, index) => (
              <Card key={article.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium hover:text-blue-600 cursor-pointer">
                        <Link href={`/article/${article.id}`}>
                          {article.title}
                        </Link>
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {article.authors.join(", ")}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        {article.pages && <span>pp. {article.pages}</span>}
                        {article.doi && <span>DOI: {article.doi}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/article/${article.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!expanded && articles.length > 5 && (
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setExpanded(true)}
                >
                  Show {articles.length - 5} more articles
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

interface ArchiveNavigationProps {
  currentVolume?: string
  currentIssue?: string
  volumes: Array<{
    id: string
    number: string
    year: number
    issueCount: number
  }>
  onVolumeChange?: (volumeId: string) => void
  onIssueChange?: (issueId: string) => void
}

export function ArchiveNavigation({ 
  currentVolume, 
  currentIssue, 
  volumes, 
  onVolumeChange,
  onIssueChange 
}: ArchiveNavigationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Browse Archive</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Volumes by Year</h4>
            <div className="grid grid-cols-2 gap-2">
              {volumes
                .sort((a, b) => b.year - a.year)
                .map((volume) => (
                  <Button
                    key={volume.id}
                    variant={currentVolume === volume.id ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => onVolumeChange?.(volume.id)}
                  >
                    <div className="text-left">
                      <div>Vol. {volume.number}</div>
                      <div className="text-xs opacity-70">({volume.year})</div>
                    </div>
                  </Button>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Volumes:</span>
              <span className="font-medium">{volumes.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Issues:</span>
              <span className="font-medium">
                {volumes.reduce((sum, v) => sum + v.issueCount, 0)}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" variant="outline" asChild>
              <Link href="/archive/enhanced">
                <ExternalLink className="h-4 w-4 mr-2" />
                Advanced Search
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ArchiveTimelineProps {
  data: Array<{
    year: number
    month: number
    volumeNumber?: string
    issueNumber?: string
    articleCount: number
    event: 'volume_published' | 'issue_published' | 'article_published'
    title?: string
  }>
}

export function ArchiveTimeline({ data }: ArchiveTimelineProps) {
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.year}-${item.month}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, typeof data>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedData)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12) // Show last 12 months
            .map(([key, events]) => {
              const [year, month] = key.split('-')
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' })
              
              return (
                <div key={key} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-gray-600">
                      {monthName} {year}
                    </div>
                    <div className="flex-1 space-y-2">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {event.event === 'volume_published' && `Volume ${event.volumeNumber} Published`}
                              {event.event === 'issue_published' && `Issue ${event.issueNumber} Published`}
                              {event.event === 'article_published' && `${event.articleCount} Articles Published`}
                            </div>
                            {event.title && (
                              <div className="text-xs text-gray-600">{event.title}</div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {event.articleCount} articles
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
