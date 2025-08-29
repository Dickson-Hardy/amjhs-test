"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Plus, X, LucideIcon } from "lucide-react"

interface FileUploadCardProps {
  category: {
    key: string
    title: string
    subtitle: string
    icon: LucideIcon
    color: string
    accept: string
    multiple: boolean
    required: boolean
    description: string
  }
  files: File[]
  onFileUpload: (files: FileList, category: string) => void
  onFileRemove: (category: string, fileIndex: number) => void
}

export function FileUploadCard({ 
  category, 
  files, 
  onFileUpload, 
  onFileRemove 
}: FileUploadCardProps) {
  const Icon = category.icon

  const handleChooseFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = category.accept
    input.multiple = category.multiple
    input.onchange = (e) => {
      const selectedFiles = (e.target as HTMLInputElement).files
      if (selectedFiles) {
        onFileUpload(selectedFiles, category.key)
      }
    }
    input.click()
  }

  const getColorClasses = () => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50/30',
      green: 'border-green-200 bg-green-50/30',
      purple: 'border-purple-200 bg-purple-50/30',
      orange: 'border-orange-200 bg-orange-50/30',
      amber: 'border-amber-200 bg-amber-50/30'
    }
    return colorMap[category.color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <Card className={`border-2 ${category.required ? getColorClasses() : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 text-${category.color}-600`} />
          {category.title}
          {category.required && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">Required</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className={`border-2 border-dashed ${category.required ? 'border-blue-300' : 'border-gray-300'} rounded-lg p-6 text-center`}>
            <Upload className={`h-8 w-8 ${category.required ? 'text-blue-400' : 'text-gray-400'} mx-auto mb-2`} />
            <p className={`text-sm ${category.required ? 'text-blue-600' : 'text-gray-600'} mb-3`}>
              {category.subtitle}
            </p>
            <Button 
              onClick={handleChooseFiles}
              className={category.required ? "bg-blue-600 hover:bg-blue-700" : ""}
              variant={category.required ? "default" : "outline"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Choose {category.multiple ? 'Files' : 'File'}
            </Button>
            <p className={`text-xs ${category.required ? 'text-blue-500' : 'text-gray-500'} mt-2`}>
              {category.description}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${category.color}-600`} />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFileRemove(category.key, index)}
                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {category.multiple && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleChooseFiles}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Files
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}