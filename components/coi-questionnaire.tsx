"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Users, 
  Building,
  Award,
  Clock,
  Shield
} from "lucide-react"

interface COIQuestionnaireProps {
  userId: string
  manuscriptId: string
  role: "associate-editor" | "reviewer"
  onComplete: (data: COIResponse) => void
  onCancel: () => void
  isReadOnly?: boolean
  existingResponse?: COIResponse
}

interface COIResponse {
  id?: string
  userId: string
  manuscriptId: string
  role: string
  hasConflicts: boolean
  conflictDetails?: string
  isCompleted: boolean
  completedAt?: string
  responses: {
    [key: string]: boolean | string
  }
}

const COI_QUESTIONS = {
  "associate-editor": [
    {
      id: "personal_relationship",
      question: "Do you have a personal relationship with any of the authors?",
      category: "Personal",
      description: "Family, close friends, romantic relationships, etc."
    },
    {
      id: "professional_relationship",
      question: "Do you have a current or recent professional relationship with any of the authors?",
      category: "Professional",
      description: "Current or former colleagues, supervisors, students, etc."
    },
    {
      id: "financial_interest",
      question: "Do you have any financial interest in the research or its outcomes?",
      category: "Financial",
      description: "Patents, royalties, consulting fees, stock ownership, etc."
    },
    {
      id: "institutional_affiliation",
      question: "Are you affiliated with the same institution as unknown of the authors?",
      category: "Institutional",
      description: "Same university, hospital, research center, etc."
    },
    {
      id: "collaboration_history",
      question: "Have you collaborated with any of the authors in the past 3 years?",
      category: "Collaboration",
      description: "Joint publications, research projects, grants, etc."
    },
    {
      id: "competition_interest",
      question: "Do you have competing research interests that could bias your assessment?",
      category: "Competing",
      description: "Similar research areas, competing theories, etc."
    },
    {
      id: "editorial_relationship",
      question: "Do you have any editorial relationship with the authors?",
      category: "Editorial",
      description: "Co-editors, editorial board members, etc."
    }
  ],
  "reviewer": [
    {
      id: "personal_relationship",
      question: "Do you have a personal relationship with any of the authors?",
      category: "Personal",
      description: "Family, close friends, romantic relationships, etc."
    },
    {
      id: "professional_relationship",
      question: "Do you have a current or recent professional relationship with any of the authors?",
      category: "Professional",
      description: "Current or former colleagues, supervisors, students, etc."
    },
    {
      id: "financial_interest",
      question: "Do you have any financial interest in the research or its outcomes?",
      category: "Financial",
      description: "Patents, royalties, consulting fees, stock ownership, etc."
    },
    {
      id: "institutional_affiliation",
      question: "Are you affiliated with the same institution as unknown of the authors?",
      category: "Institutional",
      description: "Same university, hospital, research center, etc."
    },
    {
      id: "collaboration_history",
      question: "Have you collaborated with any of the authors in the past 3 years?",
      category: "Collaboration",
      description: "Joint publications, research projects, grants, etc."
    },
    {
      id: "competition_interest",
      question: "Do you have competing research interests that could bias your assessment?",
      category: "Competing",
      description: "Similar research areas, competing theories, etc."
    },
    {
      id: "reviewer_bias",
      question: "Do you have any personal or professional bias that could affect your review?",
      category: "Bias",
      description: "Personal beliefs, professional disagreements, etc."
    }
  ]
}

export function COIQuestionnaire({
  userId,
  manuscriptId,
  role,
  onComplete,
  onCancel,
  isReadOnly = false,
  existingResponse
}: COIQuestionnaireProps) {
  const [responses, setResponses] = useState<{ [key: string]: boolean | string }>({})
  const [conflictDetails, setConflictDetails] = useState("")
  const [hasConflicts, setHasConflicts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const questions = COI_QUESTIONS[role] || []
  const totalSteps = questions.length + 1 // +1 for conflict details step

  useEffect(() => {
    if (existingResponse) {
      setResponses(existingResponse.responses || {})
      setConflictDetails(existingResponse.conflictDetails || "")
      setHasConflicts(existingResponse.hasConflicts || false)
    }
  }, [existingResponse])

  const handleResponseChange = (questionId: string, value: boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const coiData: COIResponse = {
        userId,
        manuscriptId,
        role,
        hasConflicts,
        conflictDetails: hasConflicts ? conflictDetails : undefined,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        responses
      }

      // Save to database
      const response = await fetch('/api/questionnaire/conflict-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coiData)
      })

      if (response.ok) {
        onComplete(coiData)
      } else {
        throw new AppError('Failed to save COI questionnaire')
      }
    } catch (error) {
      logger.error('Error saving COI questionnaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(responses).length
    return Math.round((answeredQuestions / questions.length) * 100)
  }

  const canProceed = () => {
    return questions.every(q => responses[q.id] !== undefined)
  }

  const getConflictCount = () => {
    return Object.values(responses).filter(r => r === true).length
  }

  if (isReadOnly && existingResponse) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Conflict of Interest Declaration - {role === "associate-editor" ? "Associate Editor" : "Reviewer"}
          </CardTitle>
          <CardDescription>
            This questionnaire has been completed and submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge variant={existingResponse.hasConflicts ? "destructive" : "default"}>
              {existingResponse.hasConflicts ? "Conflicts Declared" : "No Conflicts"}
            </Badge>
            <span className="text-sm text-gray-600">
              Completed on {new Date(existingResponse.completedAt!).toLocaleDateString()}
            </span>
          </div>

          {existingResponse.hasConflicts && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conflict Details:</strong> {existingResponse.conflictDetails}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {questions.map(question => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={existingResponse.responses[question.id] === true}
                    disabled
                  />
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                    <Badge variant="outline" className="mt-2">{question.category}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Conflict of Interest Declaration - {role === "associate-editor" ? "Associate Editor" : "Reviewer"}
        </CardTitle>
        <CardDescription>
          Please answer all questions honestly. This information is confidential and helps ensure unbiased editorial decisions.
        </CardDescription>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{getProgressPercentage()}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep <= questions.length ? (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Step {currentStep} of {questions.length}
              </Badge>
              <h3 className="text-lg font-semibold">
                {questions[currentStep - 1].question}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {questions[currentStep - 1].description}
              </p>
              <Badge variant="secondary" className="mt-2">
                {questions[currentStep - 1].category}
              </Badge>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleResponseChange(questions[currentStep - 1].id, false)}
                className={`px-8 ${responses[questions[currentStep - 1].id] === false ? 'border-green-500 bg-green-50' : ''}`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                No
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleResponseChange(questions[currentStep - 1].id, true)}
                className={`px-8 ${responses[questions[currentStep - 1].id] === true ? 'border-red-500 bg-red-50' : ''}`}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Yes
              </Button>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!responses[questions[currentStep - 1].id]}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Conflict Summary</h3>
              <p className="text-sm text-gray-600">
                You have declared {getConflictCount()} potential conflict(s)
              </p>
            </div>

            {getConflictCount() > 0 && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have declared potential conflicts. Please provide details below to help the editorial team assess the situation.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conflict Details</label>
                  <Textarea
                    placeholder="Please describe the nature and extent of the conflicts declared above..."
                    value={conflictDetails}
                    onChange={(e) => setConflictDetails(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    This information will be reviewed by the editorial team to determine if you can proceed with your role.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(questions.length)}>
                Back to Questions
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Declaration"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Question Navigation */}
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((question, index) => (
              <Button
                key={question.id}
                variant={responses[question.id] !== undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentStep(index + 1)}
                className="h-8 px-3"
              >
                {index + 1}
                {responses[question.id] !== undefined && (
                  <span className="ml-1">
                    {responses[question.id] === true ? "⚠️" : "✅"}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
