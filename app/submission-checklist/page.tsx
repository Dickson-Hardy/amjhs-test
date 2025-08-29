"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SubmissionChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({})
  
  const checklistItems = [
    {
      id: "formatting",
      title: "Manuscript Formatting",
      description: "Manuscript follows journal formatting guidelines (font, spacing, margins)",
      required: true
    },
    {
      id: "word_count",
      title: "Word Count Compliance",
      description: "Article meets word count requirements for selected manuscript type",
      required: true
    },
    {
      id: "references",
      title: "Reference Format",
      description: "References follow Vancouver citation style",
      required: true
    },
    {
      id: "author_approval",
      title: "Author Approval",
      description: "All listed authors have approved the manuscript for submission",
      required: true
    },
    {
      id: "conflict_interest",
      title: "Conflict of Interest",
      description: "Conflict of interest statement completed for all authors",
      required: true
    },
    {
      id: "ethics_approval",
      title: "Ethics Approval",
      description: "Ethics committee approval obtained (if applicable)",
      required: false
    },
    {
      id: "anonymization",
      title: "Manuscript Anonymization",
      description: "Manuscript file contains no author identifying information",
      required: true
    },
    {
      id: "cover_letter",
      title: "Cover Letter",
      description: "Cover letter explains manuscript significance and journal fit",
      required: true
    },
    {
      id: "funding_disclosure",
      title: "Funding Disclosure",
      description: "All funding sources properly acknowledged",
      required: true
    },
    {
      id: "ai_disclosure",
      title: "AI Tool Disclosure",
      description: "Use of AI tools in manuscript preparation disclosed",
      required: true
    }
  ]

  const handleCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }))
  }

  const requiredItems = checklistItems.filter(item => item.required)
  const completedRequired = requiredItems.filter(item => checkedItems[item.id]).length
  const allRequiredComplete = completedRequired === requiredItems.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Submission Checklist
        </h1>
        <p className="text-lg text-slate-600">
          Complete this checklist before submitting your manuscript to ensure all requirements are met.
        </p>
      </div>

      <div className="mb-6">
        <Alert className={allRequiredComplete ? "border-green-500 bg-green-50" : "border-amber-500 bg-amber-50"}>
          {allRequiredComplete ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription className={allRequiredComplete ? "text-green-800" : "text-amber-800"}>
            {allRequiredComplete 
              ? "All required items completed! You're ready to submit."
              : `${completedRequired} of ${requiredItems.length} required items completed.`
            }
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pre-Submission Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id={item.id}
                checked={checkedItems[item.id] || false}
                onCheckedChange={(checked) => handleCheck(item.id, !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor={item.id}
                    className="font-medium text-slate-900 cursor-pointer"
                  >
                    {item.title}
                  </label>
                  {item.required && (
                    <span className="text-red-500 text-sm">*Required</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button 
          size="lg"
          disabled={!allRequiredComplete}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {allRequiredComplete ? "Proceed to Submission" : "Complete Required Items"}
        </Button>
      </div>
    </div>
  )
}
