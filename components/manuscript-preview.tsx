"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Eye, 
  Download, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ManuscriptFile {
  id: string
  name: string
  type: string
  url: string
  size: number
  mimeType?: string
  uploadedAt?: string
}

interface ManuscriptPreviewProps {
  manuscriptId: string
  submissionId: string
  title: string
  files: ManuscriptFile[]
  userRole: "editorial-assistant" | "associate-editor" | "editor" | "reviewer"
  className?: string
}

export function ManuscriptPreview({ 
  manuscriptId, 
  submissionId,
  title, 
  files,
  userRole,
  className = "" 
}: ManuscriptPreviewProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Get the main manuscript file (usually the first Word doc or PDF)
  const manuscriptFile = files?.find(file => 
    file.type === 'manuscript' || 
    file.mimeType?.includes('word') || 
    file.mimeType?.includes('pdf')
  ) || files?.[0]

  const handleDownload = async (fileId?: string) => {
    setIsDownloading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/manuscripts/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          fileId: fileId || manuscriptFile?.id,
          userRole
        })
      })

      const data = await response.json()

      if (data.success && data.downloadUrl) {
        // Create download link
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = data.filename || `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${getFileExtension(manuscriptFile?.name || '')}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Download Started",
          description: "Your document download has started."
        })
      } else {
        throw new Error(data.error || 'Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      setError(error instanceof Error ? error.message : 'Download failed')
      toast({
        title: "Download Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreviewLoad = () => {
    setIsLoadingPreview(true)
    // Track preview view
    fetch(`/api/manuscripts/${submissionId}/view`, { 
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userRole })
    }).catch(console.error)
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop() || 'file'
  }

  const getFileIcon = (file: ManuscriptFile) => {
    if (file.mimeType?.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-600" />
    } else if (file.mimeType?.includes('word')) {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  const getPreviewUrl = (file: ManuscriptFile) => {
    // For Cloudinary URLs, we can try to generate a preview
    if (file.url?.includes('cloudinary')) {
      // For Word documents, Cloudinary can convert to images for preview
      if (file.mimeType?.includes('word')) {
        return `${file.url.replace('/upload/', '/upload/f_auto,q_auto,w_800/')}`
      }
      // For PDFs, use the direct URL
      if (file.mimeType?.includes('pdf')) {
        return file.url
      }
    }
    return file.url
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!files || files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No manuscript files available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Preview Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Manuscript Preview
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Primary Manuscript File */}
          {manuscriptFile && (
            <div className="mb-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(manuscriptFile)}
                  <div>
                    <p className="font-medium text-sm">{manuscriptFile.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(manuscriptFile.size)}
                      {manuscriptFile.uploadedAt && (
                        <> • Uploaded {new Date(manuscriptFile.uploadedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Preview Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handlePreviewLoad}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-lg truncate">{title}</DialogTitle>
                    </DialogHeader>

                    {/* Preview Controls */}
                    <div className="flex items-center gap-2 p-2 border-b">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setZoom(Math.max(50, zoom - 25))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>

                      <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setRotation((rotation + 90) % 360)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>

                      <div className="flex-1" />

                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(manuscriptFile.id)} 
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {isDownloading ? "Downloading..." : "Download"}
                      </Button>
                    </div>

                    {/* Document Viewer */}
                    <div className="flex-1 overflow-auto bg-gray-100 rounded">
                      {getPreviewUrl(manuscriptFile) ? (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          {manuscriptFile.mimeType?.includes('pdf') ? (
                            <iframe
                              src={`${getPreviewUrl(manuscriptFile)}#toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full border-0"
                              title={`Preview of ${title}`}
                              onLoad={() => setIsLoadingPreview(false)}
                            />
                          ) : (
                            <div className="p-4 text-center">
                              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-4">
                                Document preview not available for this file type
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                Download the file to view the complete document
                              </p>
                              <Button onClick={() => handleDownload(manuscriptFile.id)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download to View
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Preview not available</p>
                            <Button onClick={() => handleDownload(manuscriptFile.id)}>
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
                <Button 
                  onClick={() => handleDownload(manuscriptFile.id)} 
                  disabled={isDownloading} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>

                {/* External Link for Cloudinary */}
                {manuscriptFile.url && (
                  <Button variant="outline" asChild className="flex-1">
                    <a href={manuscriptFile.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Additional Files */}
          {files.length > 1 && (
            <div>
              <h4 className="font-medium text-sm mb-3 text-gray-700">Additional Files</h4>
              <div className="space-y-2">
                {files.filter(file => file.id !== manuscriptFile?.id).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                        disabled={isDownloading}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {file.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}