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