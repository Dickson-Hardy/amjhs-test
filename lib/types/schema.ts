// lib/types/schema.ts - Database schema types

export interface WorkflowHistoryEntry {
  status: string
  timestamp: Date
  userId: string
  notes?: string
  systemGenerated?: boolean
}

export interface ArticleMetadata {
  doi?: string
  issn?: string
  journalName?: string
  publisher?: string
  license?: string
  openAccess?: boolean
  peerReviewed?: boolean
  impactFactor?: number
  citations?: number
  downloads?: number
  views?: number
  // Submission-specific metadata
  ethics?: {
    hasEthicsApproval: boolean
    ethicsApprovalNumber?: string
    hasConflictOfInterest: boolean
    conflictDetails?: string
    hasInformedConsent: boolean
  }
  funding?: {
    hasFunding: boolean
    fundingSource?: string
    grantNumber?: string
  }
  coverLetter?: string
  suggestedReviewers?: Array<{
    name: string
    email: string
    affiliation: string
    expertise?: string
  }>
  excludedReviewers?: Array<{
    name: string
    email: string
    reason: string
  }>
  submissionType?: string
}

export interface VolumeMetadata {
  issn?: string
  publisher?: string
  editorInChief?: string
  managingEditor?: string
  editorialBoard?: string[]
  scope?: string
  submissionGuidelines?: string
  peerReviewPolicy?: string
}

export interface IssueMetadata {
  specialIssueTitle?: string
  guestEditor?: string
  theme?: string
  callForPapers?: string
  submissionDeadline?: Date
  publicationDate?: Date
}

export interface EmailMetadata {
  template?: string
  variables?: Record<string, string>
  attachments?: string[]
  retryCount?: number
  scheduledFor?: Date
} 