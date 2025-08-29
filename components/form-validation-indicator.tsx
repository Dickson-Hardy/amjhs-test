"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, X } from "lucide-react"

interface FormValidationIndicatorProps {
  title: string
  abstract: string
  category: string
  keywords: string
  authors: unknown[]
  currentStep: number
}

export function FormValidationIndicator({ 
  title, 
  abstract, 
  category, 
  keywords, 
  authors,
  currentStep 
}: FormValidationIndicatorProps) {

  const getValidationErrors = () => {
    const errors = []
    
    if (currentStep >= 1) {
      if (!title || title.length < 10) {
        errors.push("Title must be at least 10 characters")
      }
      if (!abstract || abstract.length < 1250) {
        errors.push("Abstract must be at least 250 words")
      }
      if (!category) {
        errors.push("Category is required")
      }
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean)
      if (keywordArray.length < 4) {
        errors.push("At least 4 keywords required")
      }
    }

    if (currentStep >= 2) {
      const invalidAuthors = authors.filter(author => 
        !author.firstName || !author.lastName || !author.email || 
        !author.institution || !author.department || !author.country || !author.affiliation
      )
      if (invalidAuthors.length > 0) {
        errors.push(`${invalidAuthors.length} author(s) missing required information`)
      }

      const correspondingAuthors = authors.filter(author => author.isCorrespondingAuthor)
      if (correspondingAuthors.length !== 1) {
        errors.push("Exactly one corresponding author required")
      }
    }

    return errors
  }

  const errors = getValidationErrors()

  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>All validations passed</span>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-amber-800 mb-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">Validation Issues ({errors.length})</span>
      </div>
      <ul className="text-sm text-amber-700 space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="flex items-center gap-2">
            <X className="h-3 w-3" />
            {error}
          </li>
        ))}
      </ul>
    </div>
  )
}