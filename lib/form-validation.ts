// Consolidated form validation utilities

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface SubmissionFormData {
  title: string
  abstract: string
  category: string
  keywords: string
  authors: Array<{
    firstName: string
    lastName: string
    email: string
    affiliation: string
    institution: string
    department: string
    country: string
    isCorrespondingAuthor: boolean
  }>
  recommendedReviewers: Array<{
    name: string
    email: string
    affiliation: string
  }>
  termsAccepted: boolean
  guidelinesAccepted: boolean
}

export function validateStep1(formData: SubmissionFormData): ValidationResult {
  const errors: string[] = []

  if (!formData.title || formData.title.length < 10) {
    errors.push("Title must be at least 10 characters long")
  }

  if (!formData.abstract || formData.abstract.length < 1250) {
    errors.push("Abstract must be at least 250 words (approximately 1250 characters)")
  }

  if (!formData.category) {
    errors.push("Please select a category for your article")
  }

  const keywordArray = formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
  if (keywordArray.length < 4) {
    errors.push("Please provide at least 4 keywords separated by commas")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateStep2(formData: SubmissionFormData): ValidationResult {
  const errors: string[] = []

  // Validate all authors have required information
  const invalidAuthors = formData.authors.filter(author => 
    !author.firstName || !author.lastName || !author.email || 
    !author.institution || !author.department || !author.country || !author.affiliation
  )
  
  if (invalidAuthors.length > 0) {
    errors.push("Please fill in all required author information including name, email, institution, department, country, and affiliation")
  }

  // Validate exactly one corresponding author
  const correspondingAuthors = formData.authors.filter(author => author.isCorrespondingAuthor)
  if (correspondingAuthors.length !== 1) {
    errors.push("Please designate exactly one corresponding author")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateStep3(formData: SubmissionFormData): ValidationResult {
  const errors: string[] = []

  // Validate recommended reviewers (minimum 3 required)
  const validReviewers = formData.recommendedReviewers.filter(reviewer => 
    reviewer.name.trim() && reviewer.email.trim() && reviewer.affiliation.trim()
  )
  
  if (validReviewers.length < 3) {
    errors.push("Please provide at least 3 recommended reviewers with their name, email, and affiliation")
  }

  // Validate email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmails = formData.recommendedReviewers.filter(reviewer => 
    reviewer.email.trim() && !emailRegex.test(reviewer.email.trim())
  )
  
  if (invalidEmails.length > 0) {
    errors.push("Please provide valid email addresses for all recommended reviewers")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateFinalSubmission(formData: SubmissionFormData): ValidationResult {
  const errors: string[] = []

  if (!formData.termsAccepted) {
    errors.push("Please accept the terms and conditions to proceed")
  }

  if (!formData.guidelinesAccepted) {
    errors.push("You must confirm that your manuscript follows all submission guidelines and formatting requirements")
  }

  // Re-validate all previous steps
  const step1Validation = validateStep1(formData)
  const step2Validation = validateStep2(formData)
  const step3Validation = validateStep3(formData)

  errors.push(...step1Validation.errors, ...step2Validation.errors, ...step3Validation.errors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateCurrentStep(step: number, formData: SubmissionFormData): ValidationResult {
  switch (step) {
    case 1:
      return validateStep1(formData)
    case 2:
      return validateStep2(formData)
    case 3:
      return validateStep3(formData)
    case 5:
      return validateFinalSubmission(formData)
    default:
      return { isValid: true, errors: [] }
  }
}