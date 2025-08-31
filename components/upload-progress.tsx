"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Check, X, Loader2 } from "lucide-react"
import { formatFileSize } from "@/lib/chunked-upload"

interface UploadProgressProps {
  file: File
  progress: {
    chunksUploaded: number
    totalChunks: number
    percentage: number
  }
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export function UploadProgress({ file, progress, status, error }: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Upload className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Uploading</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>
              {status === 'uploading' ? (
                `${progress.chunksUploaded}/${progress.totalChunks} chunks`
              ) : status === 'completed' ? (
                'Upload complete'
              ) : status === 'error' ? (
                'Upload failed'
              ) : (
                'Waiting...'
              )}
            </span>
          </div>
          
          <Progress 
            value={progress.percentage} 
            className="h-2"
          />
          
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{progress.percentage}% complete</span>
            {status === 'uploading' && (
              <span className="text-blue-600 font-medium">
                Uploading...
              </span>
            )}
          </div>
          
          {error && (
            <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default UploadProgress