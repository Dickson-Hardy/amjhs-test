// lib/types/index.ts - Comprehensive type definitions

// User and Profile Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  affiliation?: string
  orcid?: string
  orcidVerified: boolean
  bio?: string
  expertise: string[]
  isVerified: boolean
  isActive: boolean
  applicationStatus: ApplicationStatus
  profileCompleteness: number
  lastActiveAt?: Date
  specializations: string[]
  languagesSpoken: string[]
  researchInterests: string[]
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 
  | 'author' 
  | 'reviewer' 
  | 'editor' 
  | 'admin'
  | 'editor-in-chief'
  | 'managing-editor'
  | 'section-editor'
  | 'guest-editor'
  | 'production-editor'
  | 'associate-editor'

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'under_review'

// Article and Submission Types
export interface Article {
  id: string
  title: string
  abstract: string
  content?: string
  keywords: string[]
  category: string
  status: ArticleStatus
  doi?: string
  doiRegistered: boolean
  doiRegisteredAt?: Date
  crossrefMetadata?: CrossRefMetadata
  volume?: string
  issue?: string
  pages?: string
  publishedDate?: Date
  submittedDate: Date
  authorId: string
  coAuthors: CoAuthor[]
  reviewerIds: string[]
  editorId?: string
  files: ArticleFile[]
  views: number
  downloads: number
  metadata: ArticleMetadata
  createdAt: Date
  updatedAt: Date
}

export type ArticleStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'accepted'
  | 'rejected'
  | 'published'

export interface CoAuthor {
  firstName: string
  lastName: string
  email: string
  affiliation?: string
  orcid?: string
}

export interface ArticleFile {
  url: string
  type: string
  name: string
  fileId: string
  size?: number
  uploadedAt?: Date
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

// Review Types
export interface Review {
  id: string
  articleId: string
  reviewerId: string
  status: ReviewStatus
  recommendation?: ReviewRecommendation
  comments?: string
  confidentialComments?: string
  rating?: number
  submittedAt?: Date
  createdAt: Date
}

export type ReviewStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'completed'
  | 'overdue'

export type ReviewRecommendation = 
  | 'accept'
  | 'minor_revision'
  | 'major_revision'
  | 'reject'

// Submission Types
export interface Submission {
  id: string
  articleId: string
  authorId: string
  status: SubmissionStatus
  statusHistory: WorkflowHistoryEntry[]
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type SubmissionStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'published'

export interface WorkflowHistoryEntry {
  status: ArticleStatus
  timestamp: Date
  userId: string
  notes?: string
  systemGenerated?: boolean
}

// Editor Assignment Types
export interface EditorAssignment {
  id: string
  articleId: string
  editorId: string
  assignedBy?: string
  assignedAt: Date
  deadline: Date
  status: AssignmentStatus
  responseAt?: Date
  conflictDeclared: boolean
  conflictDetails?: string
  assignmentReason?: string
  systemGenerated: boolean
  declineReason?: string
  editorComments?: string
  createdAt: Date
  updatedAt: Date
}

export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'expired'

// Review Invitation Types
export interface ReviewInvitation {
  id: string
  articleId: string
  reviewerId?: string
  reviewerEmail: string
  reviewerName: string
  invitedBy?: string
  invitedAt: Date
  responseDeadline: Date
  reviewDeadline?: Date
  status: InvitationStatus
  responseAt?: Date
  firstReminderSent?: Date
  finalReminderSent?: Date
  withdrawnAt?: Date
  reviewSubmittedAt?: Date
  completedAt?: Date
  invitationToken: string
  declineReason?: string
  editorNotes?: string
  createdAt: Date
  updatedAt: Date
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn'

// Volume and Issue Types
export interface Volume {
  id: string
  number: string
  year: number
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: Date
  status: PublicationStatus
  metadata: VolumeMetadata
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  volumeId: string
  number: string
  title?: string
  description?: string
  coverImage?: string
  publishedDate?: Date
  status: PublicationStatus
  specialIssue: boolean
  guestEditors: string[]
  metadata: IssueMetadata
  createdAt: Date
  updatedAt: Date
}

export type PublicationStatus = 'draft' | 'published' | 'archived'

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

// Email and Notification Types
export interface EmailLog {
  id: string
  submissionId?: string
  reviewId?: string
  toEmail: string
  fromEmail: string
  subject: string
  body: string
  emailType: EmailType
  status: EmailStatus
  sentAt: Date
  failureReason?: string
  metadata: EmailMetadata
  createdAt: Date
  updatedAt: Date
}

export type EmailType = 'invitation' | 'reminder' | 'notification' | 'decision' | 'revision'
export type EmailStatus = 'sent' | 'failed' | 'pending'

export interface EmailMetadata {
  template?: string
  variables?: Record<string, string>
  attachments?: string[]
  retryCount?: number
  scheduledFor?: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  relatedId?: string
  createdAt: Date
}

export type NotificationType = 'submission' | 'review' | 'publication' | 'system' | 'editorial'

// Conversation and Message Types
export interface Conversation {
  id: string
  subject: string
  type: ConversationType
  relatedId?: string
  relatedTitle?: string
  participants: ConversationParticipant[]
  lastMessageId?: string
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export type ConversationType = 'review' | 'submission' | 'editorial' | 'system'

export interface ConversationParticipant {
  id: string
  name: string
  role: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments: MessageAttachment[]
  isRead: boolean
  readBy: MessageRead[]
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  name: string
  url: string
  type: string
}

export interface MessageRead {
  userId: string
  readAt: string
}

// Comment Types
export interface Comment {
  id: string
  articleId: string
  userId: string
  content: string
  type: CommentType
  isPrivate: boolean
  lineNumber?: number
  createdAt: Date
  updatedAt: Date
}

export type CommentType = 'review' | 'editorial' | 'author_response'

// User Application Types
export interface UserApplication {
  id: string
  userId: string
  requestedRole: UserRole
  currentRole: UserRole
  status: ApplicationStatus
  applicationData: ApplicationData
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  submittedAt: Date
  updatedAt: Date
}

export interface ApplicationData {
  motivation: string
  experience: string
  qualifications: Qualification[]
  references: Reference[]
  publications: Publication[]
  expertise: string[]
  availability: string
  conflicts: string[]
}

export interface Qualification {
  type: 'degree' | 'certification' | 'experience'
  title: string
  institution: string
  startDate?: Date
  endDate?: Date
  description?: string
}

export interface Reference {
  name: string
  email: string
  affiliation: string
  relationship: string
}

export interface Publication {
  title: string
  journal: string
  year: number
  doi?: string
  authorRole: 'first_author' | 'corresponding_author' | 'co_author'
}

// Reviewer Profile Types
export interface ReviewerProfile {
  id: string
  userId: string
  availabilityStatus: AvailabilityStatus
  maxReviewsPerMonth: number
  currentReviewLoad: number
  averageReviewTime?: number
  completedReviews: number
  lateReviews: number
  qualityScore: number
  lastReviewDate?: Date
  isActive: boolean
  updatedAt: Date
}

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable'

// Editor Profile Types
export interface EditorProfile {
  id: string
  userId: string
  editorType: EditorType
  assignedSections: string[]
  currentWorkload: number
  maxWorkload: number
  isAcceptingSubmissions: boolean
  editorialExperience?: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  updatedAt: Date
}

export type EditorType = 'chief' | 'associate' | 'section' | 'guest'

// News and Advertisement Types
export interface News {
  id: number
  title: string
  content: string
  excerpt?: string
  type: NewsType
  category?: string
  authorId?: string
  authorName?: string
  isPublished: boolean
  publishedAt?: Date
  featuredImage?: string
  tags?: string[]
  slug?: string
  metaDescription?: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type NewsType = 'news' | 'announcement' | 'special_issue' | 'editorial'

export interface Advertisement {
  id: string
  title: string
  imageUrl: string
  targetUrl?: string
  position: AdvertisementPosition
  isActive: boolean
  expiresAt?: Date
  clickCount: number
  impressionCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type AdvertisementPosition = 'sidebar-top' | 'sidebar-bottom' | 'header' | 'footer' | 'content'

// CrossRef and DOI Types
export interface CrossRefMetadata {
  doi: string
  title: string[]
  author: CrossRefAuthor[]
  publisher: string
  journalTitle?: string
  volume?: string
  issue?: string
  page?: string
  published: CrossRefDate
  type: string
  isReferencedByCount: number
  referencesCount: number
  subject: string[]
  url?: string
  abstract?: string
}

export interface CrossRefAuthor {
  given?: string
  family: string
  orcid?: string
  affiliation: Array<{ name: string }>
}

export interface CrossRefDate {
  'date-parts': number[][]
  'date-time': string
  timestamp: number
}

// Performance and Monitoring Types
export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  interactionToNextPaint: number
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
}

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  ipAddress: string
  userAgent: string
  details: SecurityEventDetails
  timestamp: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export type SecurityEventType = 'login_attempt' | 'access_violation' | 'data_breach' | 'suspicious_activity' | 'ddos_attempt'
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEventDetails {
  action: string
  resource?: string
  failureReason?: string
  attemptCount?: number
  geolocation?: {
    country: string
    city: string
    coordinates: [number, number]
  }
  threatScore: number
  indicators: string[]
}

// AI Assessment Types
export interface ManuscriptAssessment {
  id: string
  manuscriptId: string
  qualityScore: number
  similarityScore: number
  impactPrediction: number
  writingQualityScore: number
  referenceScore: number
  recommendedAction: ReviewRecommendation
  assessmentDetails: AssessmentDetails
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentDetails {
  qualityMetrics: {
    structureScore: number
    clarityScore: number
    originalityScore: number
    methodologyScore: number
    conclusionScore: number
  }
  similarityAnalysis: {
    duplicateContent: number
    paraphrasing: number
    properCitations: number
    plagiarismRisk: 'low' | 'medium' | 'high'
  }
  impactAnalysis: {
    noveltyScore: number
    relevanceScore: number
    potentialCitations: number
    fieldImpact: number
  }
  writingQuality: {
    grammarScore: number
    readabilityScore: number
    cohesionScore: number
    vocabularyScore: number
  }
  referenceAnalysis: {
    qualityScore: number
    recencyScore: number
    relevanceScore: number
    completenessScore: number
  }
  recommendations: string[]
  improvementSuggestions: string[]
}

// Plagiarism Detection Types
export interface PlagiarismReport {
  articleId: string
  overallSimilarity: number
  sources: PlagiarismSource[]
  textMatches: TextMatch[]
  status: 'pending' | 'completed' | 'failed'
  generatedAt: Date
  service: 'turnitin' | 'crossref' | 'internal' | 'combined'
}

export interface PlagiarismSource {
  sourceId: string
  title: string
  authors: string[]
  url?: string
  doi?: string
  similarity: number
  matchedWords: number
  totalWords: number
  matches: TextMatch[]
}

export interface TextMatch {
  originalText: string
  matchedText: string
  similarity: number
  startPosition: number
  endPosition: number
  sourceId?: string
  sourceTitle?: string
  sourceUrl?: string
}

// Real-time Collaboration Types
export interface CollaborationSession {
  id: string
  manuscriptId: string
  userId: string
  userName: string
  userRole: string
  isActive: boolean
  lastActivity: Date
  cursorPosition?: number
  selectedText?: {
    start: number
    end: number
  }
  connectionId: string
}

export interface CollaborativeEdit {
  id: string
  sessionId: string
  manuscriptId: string
  userId: string
  operation: EditOperation
  timestamp: Date
  applied: boolean
  version: number
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace' | 'format'
  position: number
  content?: string
  length?: number
  metadata?: {
    formatting?: TextFormatting
    section?: string
    field?: string
  }
}

export interface TextFormatting {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  color?: string
  highlight?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: string[]
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>> 