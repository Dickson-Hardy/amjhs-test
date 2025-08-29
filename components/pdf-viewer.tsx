"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, ZoomIn, ZoomOut, RotateCw, FileText, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PDFViewerProps {
  articleId: string
  title: string
  doi?: string
  downloadUrl?: string
  previewUrl?: string
}

export function PDFViewer({ articleId, title, doi, downloadUrl, previewUrl }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/download`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success && data.downloadUrl) {
        // Create download link
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setError("Download failed")
      }
    } catch (error) {
      setError("Download error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    // Track preview view
    fetch(`/api/articles/${articleId}/view`, { method: "POST" })
  }

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Article Preview
            </CardTitle>
            {doi && (
              <Badge variant="outline" className="text-xs">
                DOI: {doi}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Preview Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-lg truncate">{title}</DialogTitle>
                </DialogHeader>

                {/* PDF Viewer Controls */}
                <div className="flex items-center gap-2 p-2 border-b">
                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>

                  <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>

                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => setRotation((rotation + 90) % 360)}>
                    <RotateCw className="h-4 w-4" />
                  </Button>

                  <div className="flex-1" />

                  <Button size="sm" onClick={handleDownload} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    {isLoading ? "Downloading..." : "Download"}
                  </Button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-auto bg-gray-100 rounded">
                  {previewUrl ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-0"
                        title={`Preview of ${title}`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">PDF preview not available</p>
                        <Button onClick={handleDownload} disabled={isLoading}>
                          <Download className="h-4 w-4 mr-2" />
                          Download to View
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Download Button */}
            <Button onClick={handleDownload} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Downloading..." : "Download PDF"}
            </Button>

            {/* External Link */}
            {doi && (
              <Button variant="outline" asChild className="flex-1">
                <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on DOI
                </a>
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
