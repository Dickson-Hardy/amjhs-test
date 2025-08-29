"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  History, 
  FileText, 
  Download, 
  Eye, 
  Clock,
  User,
  FileCheck,
  Files,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface RevisionVersion {
  versionNumber: number
  changeLog: string
  files: Array<{
    type: string
    name: string
    size: number
    fileId: string
    url: string
    hasTrackChanges?: boolean
    isCleanCopy?: boolean
    uploadedAt: string
  }>
  createdAt: string
  createdBy: string
  authorName: string
}

interface RevisionHistoryProps {
  articleId: string
  articleTitle: string
}

export default function RevisionHistory({ articleId, articleTitle }: RevisionHistoryProps) {
  const [versions, setVersions] = useState<RevisionVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchRevisionHistory()
  }, [articleId])

  const fetchRevisionHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/manuscripts/${articleId}/revisions/history`)
      const data = await response.json()

      if (data.success) {
        setVersions(data.versions)
      } else {
        setError("Failed to load revision history")
      }
    } catch (err) {
      logger.error("Error fetching revision history:", err)
      setError("Failed to load revision history")
    } finally {
      setLoading(false)
    }
  }

  const toggleVersionExpansion = (versionNumber: number) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(versionNumber)) {
      newExpanded.delete(versionNumber)
    } else {
      newExpanded.add(versionNumber)
    }
    setExpandedVersions(newExpanded)
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'revised_manuscript':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'clean_manuscript':
        return <FileCheck className="h-4 w-4 text-green-600" />
      case 'response_letter':
        return <Files className="h-4 w-4 text-purple-600" />
      case 'change_tracking':
        return <Eye className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getFileTypeLabel = (fileType: string) => {
    switch (fileType) {
      case 'revised_manuscript':
        return 'Revised Manuscript'
      case 'clean_manuscript':
        return 'Clean Copy'
      case 'response_letter':
        return 'Response Letter'
      case 'change_tracking':
        return 'Change Tracking'
      case 'supplementary':
        return 'Supplementary'
      case 'clean_copy_notice':
        return 'Clean Copy Notice'
      default:
        return 'Document'
    }
  }

  const parseChangeLog = (changeLog: string) => {
    // Parse the structured change log to extract key information
    const sections = changeLog.split('\n\n')
    const summary = sections.find(s => s.includes('## 📋 Revision Summary'))?.split('\n').slice(1).join('\n') || ''
    const files = sections.find(s => s.includes('## 📎 Files Submitted'))?.split('\n').slice(1) || []
    const requirements = sections.find(s => s.includes('## 🔍 Change Tracking Requirements'))?.split('\n').slice(1) || []
    
    return { summary, files, requirements }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revision history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Revisions Yet</h3>
          <p className="text-gray-600">No revision history available for this manuscript.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revision History</h2>
          <p className="text-gray-600">{articleTitle}</p>
        </div>
        <Badge variant="outline">{versions.length} version{versions.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="space-y-4">
        {versions.map((version) => {
          const isExpanded = expandedVersions.has(version.versionNumber)
          const parsedLog = parseChangeLog(version.changeLog)
          const hasCleanCopy = version.files.some(f => f.type === 'clean_manuscript')
          const missingCleanCopy = version.files.some(f => f.type === 'clean_copy_notice')

          return (
            <Card key={version.versionNumber} className="border">
              <Collapsible 
                open={isExpanded} 
                onOpenChange={() => toggleVersionExpansion(version.versionNumber)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            v{version.versionNumber}
                          </Badge>
                          {hasCleanCopy && (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                              ✓ Clean Copy
                            </Badge>
                          )}
                          {missingCleanCopy && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ Missing Clean Copy
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            Revision {version.versionNumber}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.authorName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(version.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {version.files.length} file{version.files.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Change Summary */}
                      {parsedLog.summary && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Change Summary</h4>
                          <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                            {parsedLog.summary.trim()}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Submitted Files</h4>
                        <div className="grid gap-3">
                          {version.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                {getFileIcon(file.type)}
                                <div>
                                  <p className="font-medium text-sm">{getFileTypeLabel(file.type)}</p>
                                  <p className="text-xs text-gray-600">
                                    {file.name} • {file.size > 0 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Notice'}
                                  </p>
                                  {file.hasTrackChanges !== undefined && (
                                    <p className="text-xs text-gray-500">
                                      {file.hasTrackChanges ? 'Contains track changes' : 'Clean version'}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {file.url && (
                                  <>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                {file.type === 'clean_copy_notice' && (
                                  <Alert className="p-2">
                                    <AlertCircle className="h-3 w-3" />
                                    <AlertDescription className="text-xs">
                                      Clean copy is required but was not provided
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Change Tracking Requirements */}
                      {parsedLog.requirements.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Change Tracking Status</h4>
                          <div className="bg-gray-50 p-3 rounded">
                            {parsedLog.requirements.map((req, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                {req.includes('✅') ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : req.includes('❌') ? (
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                ) : (
                                  <Clock className="h-3 w-3 text-gray-500" />
                                )}
                                <span>{req.replace(/[✅❌○]/g, '').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
