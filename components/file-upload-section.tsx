"use client"

import { Progress } from "@/components/ui/progress"
import { FileUploadCard } from "@/components/ui/file-upload-card"
import { 
  FileText, 
  Image, 
  Table, 
  FileSpreadsheet, 
  Mail, 
  Shield, 
  Award
} from "lucide-react"

interface FileUploadSectionProps {
  uploadedFiles: {[key: string]: File[]}
  onFileUpload: (files: FileList, category: string) => void
  onFileRemove: (category: string, fileIndex: number) => void
  uploadProgress: number
}

const fileCategories = [
  {
    key: 'manuscript',
    title: 'Manuscript File',
    subtitle: 'Main research document',
    icon: FileText,
    color: 'blue',
    accept: '.doc,.docx',
    multiple: false,
    required: true,
    description: 'DOC, DOCX only (Max 2MB)'
  },
  {
    key: 'figures',
    title: 'Figures & Images',
    subtitle: 'Charts, graphs, photos',
    icon: Image,
    color: 'green',
    accept: '.png,.jpg,.jpeg,.tiff,.eps,.svg',
    multiple: true,
    required: false,
    description: 'PNG, JPG, TIFF, EPS, SVG'
  },
  {
    key: 'tables',
    title: 'Tables & Data',
    subtitle: 'Spreadsheets and data files',
    icon: Table,
    color: 'purple',
    accept: '.xlsx,.csv,.doc,.docx',
    multiple: true,
    required: false,
    description: 'XLSX, CSV, PDF, DOC'
  },
  {
    key: 'supplementary',
    title: 'Supplementary Materials',
    subtitle: 'Additional supporting files',
    icon: FileSpreadsheet,
    color: 'orange',
    accept: '.pdf,.doc,.docx,.xlsx,.csv,.zip,.rar',
    multiple: true,
    required: false,
    description: 'Any supporting files, data, videos'
  },
  {
    key: 'coverLetter',
    title: 'Cover Letter',
    subtitle: 'Letter to editor',
    icon: Mail,
    color: 'blue',
    accept: '.pdf,.doc,.docx',
    multiple: false,
    required: false,
    description: 'Letter to editor (Recommended)'
  },
  {
    key: 'ethicsApproval',
    title: 'Ethics Approval',
    subtitle: 'Ethics committee approval',
    icon: Shield,
    color: 'amber',
    accept: '.pdf,.doc,.docx',
    multiple: false,
    required: false,
    description: 'If study involves human subjects'
  },
  {
    key: 'copyrightForm',
    title: 'Copyright Transfer',
    subtitle: 'Publication rights form',
    icon: Award,
    color: 'amber',
    accept: '.pdf,.doc,.docx',
    multiple: false,
    required: false,
    description: 'Transfer publication rights'
  }
]

export function FileUploadSection({ 
  uploadedFiles, 
  onFileUpload, 
  onFileRemove, 
  uploadProgress 
}: FileUploadSectionProps) {
  // Separate required and optional files
  const requiredFiles = fileCategories.filter(cat => cat.required)
  const optionalFiles = fileCategories.filter(cat => !cat.required)

  return (
    <div className="space-y-6">
      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Required Files */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Required Files</h3>
        <div className="grid grid-cols-1 gap-4">
          {requiredFiles.map((category) => (
            <FileUploadCard
              key={category.key}
              category={category}
              files={uploadedFiles[category.key] || []}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          ))}
        </div>
      </div>

      {/* Optional Files */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Optional Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optionalFiles.map((category) => (
            <FileUploadCard
              key={category.key}
              category={category}
              files={uploadedFiles[category.key] || []}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          ))}
        </div>
      </div>

      {/* Upload Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Upload Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {fileCategories.map(category => (
            <div key={category.key}>
              {category.title}: {uploadedFiles[category.key]?.length || 0}
            </div>
          ))}
          <div className="font-medium">
            Total: {Object.values(uploadedFiles).flat().length} files
          </div>
        </div>
      </div>
    </div>
  )
}