"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Plus } from "lucide-react"

interface Version {
  id: string
  versionNumber: number
  title: string
  changeLog: string
  createdAt: string
  files: Array<{ name: string; url: string; type: string }>
}

interface VersionControlProps {
  articleId: string
  canEdit: boolean
}

export function VersionControl({ articleId, canEdit }: VersionControlProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersions()
  }, [articleId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/submissions/${articleId}/versions`)
      const data = await response.json()
      if (data.success) {
        setVersions(data.versions)
      }
    } catch (error) {
      logger.error("Error fetching versions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading versions...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
          {canEdit && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div key={version.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={version.versionNumber === 1 ? "default" : "secondary"}>
                    Version {version.versionNumber}
                  </Badge>
                  {version.versionNumber === Math.max(...versions.map((v) => v.versionNumber)) && (
                    <Badge className="bg-green-100 text-green-800">Latest</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">{new Date(version.createdAt).toLocaleDateString()}</div>
              </div>

              <h4 className="font-medium mb-2">{version.title}</h4>

              {version.changeLog && (
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Changes:</strong> {version.changeLog}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <div className="text-sm text-gray-500">
                  {version.files.length} file{version.files.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
