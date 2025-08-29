import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, serial, varchar } from "drizzle-orm/pg-core"
import type { WorkflowHistoryEntry, ArticleMetadata, VolumeMetadata, IssueMetadata, EmailMetadata } from "../types/schema"

// Interface for co-authors
export interface CoAuthor {
  firstName: string
  lastName: string
  email: string
  affiliation?: string
  orcid?: string
  institution?: string
  department?: string
  country?: string
  isCorrespondingAuthor?: boolean
}

// Interface for reviewer data
export interface ReviewerProfile {
  availabilityStatus: string
  maxReviewsPerMonth: number
  currentReviewLoad: number
  averageReviewTime?: number
  completedReviews: number
  lateReviews: number
  qualityScore: number
  lastReviewDate?: string
  isActive: boolean
}

export interface Reviewer {
  id: string
  email: string
  name: string
  currentReviewLoad: number
  maxReviewsPerMonth: number
  qualityScore: number
  availabilityStatus: string
  reviewerProfile?: ReviewerProfile
}

// Interface for article data
export interface ArticleData {
  title: string
  abstract: string
  authors: CoAuthor[]
  content?: string
  category: string
  keywords: string[]
  recommendedReviewers?: string[]
}

// Interface for reviewer criteria
export interface ReviewerCriteria {
  expertise: string[]
  minQualityScore: number
  excludeConflicts: (string | null)[]
  maxWorkload: number
}

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  role: text("role").notNull().default("author"), // author, reviewer, editor, editorial-assistant, admin
  affiliation: text("affiliation"),
  orcid: text("orcid"),
  orcidVerified: boolean("orcid_verified").default(false),
  orcidAccessToken: text("orcid_access_token"),
  orcidRefreshToken: text("orcid_refresh_token"),
  orcidProfile: jsonb("orcid_profile"),
  orcidLastSync: timestamp("orcid_last_sync"),
  bio: text("bio"),
  expertise: jsonb("expertise").$type<string[]>(),
  isVerified: boolean("is_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Enhanced fields for role management
  isActive: boolean("is_active").default(true),
  applicationStatus: text("application_status").default("pending"), // pending, approved, rejected, under_review
  profileCompleteness: integer("profile_completeness").default(0),
  lastActiveAt: timestamp("last_active_at"),
  specializations: jsonb("specializations").$type<string[]>(),
  languagesSpoken: jsonb("languages_spoken").$type<string[]>(),
  researchInterests: jsonb("research_interests").$type<string[]>(),
  // User preferences
  emailPreferences: jsonb("email_preferences").$type<{
    submissionUpdates: boolean
    reviewRequests: boolean
    publicationAlerts: boolean
    newsletter: boolean
    marketing: boolean
    digest: boolean
    digestFrequency: "daily" | "weekly" | "monthly"
  }>(),
  submissionDefaults: jsonb("submission_defaults").$type<{
    defaultCategory: string
    defaultKeywords: string[]
    defaultAbstract: string
    autoSave: boolean
    autoSaveInterval: number
    defaultLanguage: string
  }>(),
  privacySettings: jsonb("privacy_settings").$type<{
    profileVisibility: "public" | "private" | "authors_only"
    showEmail: boolean
    showPhone: boolean
    showInstitution: boolean
    allowContact: boolean
  }>(),
  languageSettings: jsonb("language_settings").$type<{
    interfaceLanguage: string
    submissionLanguage: string
    preferredReviewLanguage: string
  }>(),
  notificationSettings: jsonb("notification_settings").$type<{
    browserNotifications: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    quietHours: boolean
    quietHoursStart: string
    quietHoursEnd: string
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// User applications for elevated roles
export const userApplications = pgTable("user_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  requestedRole: text("requested_role").notNull(), // reviewer, editor
  currentRole: text("current_role").notNull(),
  status: text("status").notNull().default("pending"), // pending, under_review, approved, rejected
  applicationData: jsonb("application_data"), // Store the complete application form data
  reviewNotes: text("review_notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// User qualifications and credentials
export const userQualifications = pgTable("user_qualifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // degree, certification, experience
  title: text("title").notNull(),
  institution: text("institution"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  description: text("description"),
  isVerified: boolean("is_verified").default(false),
  verificationDocuments: jsonb("verification_documents").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
})

// User publications
export const userPublications = pgTable("user_publications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  journal: text("journal"),
  year: integer("year"),
  doi: text("doi"),
  authorRole: text("author_role"), // first_author, corresponding_author, co_author
  citationCount: integer("citation_count").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
})

// Professional references
export const userReferences = pgTable("user_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  referenceName: text("reference_name").notNull(),
  referenceEmail: text("reference_email").notNull(),
  referenceAffiliation: text("reference_affiliation"),
  relationship: text("relationship").notNull(),
  status: text("status").default("pending"), // pending, contacted, completed
  response: text("response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Reviewer availability and workload
export const reviewerProfiles = pgTable("reviewer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  availabilityStatus: text("availability_status").default("available"), // available, limited, unavailable
  maxReviewsPerMonth: integer("max_reviews_per_month").default(3),
  currentReviewLoad: integer("current_review_load").default(0),
  averageReviewTime: integer("average_review_time"), // in days
  completedReviews: integer("completed_reviews").default(0),
  lateReviews: integer("late_reviews").default(0),
  qualityScore: integer("quality_score").default(0), // 0-100 based on editor feedback
  lastReviewDate: timestamp("last_review_date"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Editor assignments and workload
export const editorProfiles = pgTable("editor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  editorType: text("editor_type").notNull(), // chief, associate, section, guest
  assignedSections: jsonb("assigned_sections").$type<string[]>(),
  currentWorkload: integer("current_workload").default(0),
  maxWorkload: integer("max_workload").default(10),
  isAcceptingSubmissions: boolean("is_accepting_submissions").default(true),
  editorialExperience: text("editorial_experience"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  content: text("content"),
  keywords: jsonb("keywords").$type<string[]>(),
  category: text("category").notNull(),
  status: text("status").notNull().default("submitted"), // submitted, under_review, revision_requested, accepted, rejected, published
  doi: text("doi"),
  doiRegistered: boolean("doi_registered").default(false),
  doiRegisteredAt: timestamp("doi_registered_at"),
  crossrefMetadata: jsonb("crossref_metadata"),
  volume: text("volume"),
  issue: text("issue"),
  pages: text("pages"),
  publishedDate: timestamp("published_date"),
  submittedDate: timestamp("submitted_date").defaultNow(),
  authorId: uuid("author_id").references(() => users.id),
  coAuthors: jsonb("co_authors").$type<CoAuthor[]>(),
  reviewerIds: jsonb("reviewer_ids").$type<string[]>(),
  editorId: uuid("editor_id").references(() => users.id),
  files: jsonb("files").$type<{ url: string; type: string; name: string; fileId: string }[]>(),
  views: integer("views").default(0),
  downloads: integer("downloads").default(0),
  metadata: jsonb("metadata").$type<ArticleMetadata>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, completed, declined
  recommendation: text("recommendation"), // accept, minor_revision, major_revision, reject
  comments: text("comments"),
  confidentialComments: text("confidential_comments"),
  rating: integer("rating"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // submission, review, publication, system
  isRead: boolean("is_read").default(false),
  relatedId: uuid("related_id"), // article_id, review_id, etc.
  createdAt: timestamp("created_at").defaultNow(),
})

export const pageViews = pgTable("page_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id),
  userId: uuid("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  viewDuration: integer("view_duration"), // in seconds
  isBot: boolean("is_bot").default(false),
  pageType: text("page_type").default("abstract"),
  country: text("country"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id),
  authorId: uuid("author_id").references(() => users.id),
  status: text("status").notNull().default("draft"), // draft, submitted, under_review, accepted, rejected
  statusHistory: jsonb("status_history").$type<WorkflowHistoryEntry[]>().default([]),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull(),
  type: text("type").notNull(), // review, submission, editorial, system
  relatedId: uuid("related_id"), // article_id, review_id, etc.
  relatedTitle: text("related_title"),
  participants: jsonb("participants").$type<{ id: string; name: string; role: string }[]>(),
  lastMessageId: uuid("last_message_id"),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  senderId: uuid("sender_id").references(() => users.id),
  recipientId: uuid("recipient_id").references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  messageType: text("message_type").default("general"), // editorial, review, system, general
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("unread"), // unread, read, replied, archived
  submissionId: uuid("submission_id").references(() => articles.id),
  isReply: boolean("is_reply").default(false),
  parentMessageId: uuid("parent_message_id").references(() => messages.id),
  attachments: jsonb("attachments").$type<{ name: string; url: string; type: string; size: number }[]>(),
  isRead: boolean("is_read").default(false),
  readBy: jsonb("read_by").$type<{ userId: string; readAt: string }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articleVersions = pgTable("article_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id),
  versionNumber: integer("version_number").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  content: text("content"),
  files: jsonb("files").$type<{ url: string; type: string; name: string; fileId: string }[]>(),
  changeLog: text("change_log"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull(), // review, editorial, author_response
  isPrivate: boolean("is_private").notNull().default(false), // boolean for private comments
  lineNumber: integer("line_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Volume management for journal archives
export const volumes = pgTable("volumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  year: integer("year").notNull(),
  title: text("title"),
  description: text("description"),
  coverImage: text("cover_image"),
  publishedDate: timestamp("published_date"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  metadata: jsonb("metadata").$type<VolumeMetadata>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Issue management for journal volumes
export const issues = pgTable("issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  volumeId: uuid("volume_id").references(() => volumes.id),
  number: text("number").notNull(),
  title: text("title"),
  description: text("description"),
  coverImage: text("cover_image"),
  publishedDate: timestamp("published_date"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  specialIssue: boolean("special_issue").default(false),
  guestEditors: jsonb("guest_editors").$type<string[]>(),
  metadata: jsonb("metadata").$type<IssueMetadata>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Email logs table for tracking all email communications
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").references(() => submissions.id),
  reviewId: uuid("review_id").references(() => reviews.id),
  toEmail: text("to_email").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  emailType: text("email_type").notNull(), // invitation, reminder, notification, etc.
  status: text("status").notNull().default("sent"), // sent, failed, pending
  sentAt: timestamp("sent_at").defaultNow(),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").$type<EmailMetadata>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// News and announcements table
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  type: text("type").notNull().default("news"), // news, announcement, special_issue, editorial
  category: text("category"), // general, research, editorial, events
  authorId: uuid("author_id").references(() => users.id),
  authorName: varchar("author_name", { length: 255 }),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  featuredImage: text("featured_image"),
  tags: text("tags").array(),
  slug: varchar("slug", { length: 255 }).unique(),
  metaDescription: text("meta_description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Advertisements table
export const advertisements = pgTable("advertisements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url"),
  position: text("position").notNull(), // sidebar-top, sidebar-bottom, header, footer, content
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  clickCount: integer("click_count").default(0),
  impressionCount: integer("impression_count").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Editor assignments table for tracking assignment requests and responses
export const editorAssignments = pgTable("editor_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id).notNull(),
  editorId: uuid("editor_id").references(() => users.id).notNull(),
  
  // Assignment details
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  deadline: timestamp("deadline").notNull(),
  
  // Editor response
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  responseAt: timestamp("response_at"),
  
  // Conflict of interest declaration
  conflictDeclared: boolean("conflict_declared").default(false),
  conflictDetails: text("conflict_details"),
  
  // Assignment metadata
  assignmentReason: text("assignment_reason"),
  systemGenerated: boolean("system_generated").default(true),
  
  // Response details
  declineReason: text("decline_reason"),
  editorComments: text("editor_comments"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Recommended reviewers table for author suggestions
export const recommendedReviewers = pgTable("recommended_reviewers", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  affiliation: text("affiliation").notNull(),
  expertise: text("expertise"),
  suggestedBy: uuid("suggested_by").references(() => users.id),
  status: text("status").notNull().default("suggested"), // suggested, contacted, accepted, declined, unavailable
  contactAttempts: integer("contact_attempts").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Review invitations table for managing reviewer invitations and deadlines
export const reviewInvitations = pgTable("review_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id).notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewerEmail: text("reviewer_email").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  
  // Invitation details
  invitedBy: uuid("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  
  // Deadlines and reminders
  responseDeadline: timestamp("response_deadline").notNull(), // 7 days to respond
  reviewDeadline: timestamp("review_deadline"), // 21 days from acceptance
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired, withdrawn
  responseAt: timestamp("response_at"),
  
  // Reminder system
  firstReminderSent: timestamp("first_reminder_sent"),
  finalReminderSent: timestamp("final_reminder_sent"),
  withdrawnAt: timestamp("withdrawn_at"),
  
  // Review completion
  reviewSubmittedAt: timestamp("review_submitted_at"),
  completedAt: timestamp("completed_at"),
  
  // Metadata
  invitationToken: text("invitation_token").unique(),
  declineReason: text("decline_reason"),
  editorNotes: text("editor_notes"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Admin audit logs
export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  adminId: uuid("admin_id").references(() => users.id).notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: text("details").default(""),
  ipAddress: text("ip_address").default("unknown"),
  userAgent: text("user_agent").default("unknown"),
  createdAt: timestamp("created_at").defaultNow(),
})

// User documents table for CV, licenses, certifications, etc.
export const userDocuments = pgTable("user_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // cv, license, certification, publication, etc.
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  isActive: boolean("is_active").default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Cloudinary fields
  cloudinaryPublicId: text("cloudinary_public_id"),
  cloudinaryUrl: text("cloudinary_url"),
})

// Review assignments table for tracking reviewer assignments
export const review_assignments = pgTable("review_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id).notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id).notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("assigned"), // assigned, accepted, declined, completed, overdue
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  reviewScore: integer("review_score"),
  reviewComments: text("review_comments"),
  confidentialComments: text("confidential_comments"),
  recommendation: text("recommendation"), // accept, minor_revisions, major_revisions, reject
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Editorial decisions table for tracking editor decisions
export const editorial_decisions = pgTable("editorial_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id").references(() => articles.id).notNull(),
  editorId: uuid("editor_id").references(() => users.id).notNull(),
  decision: text("decision").notNull(), // accept, minor_revisions, major_revisions, reject
  comments: text("comments"),
  confidentialComments: text("confidential_comments"),
  revisionDeadline: timestamp("revision_deadline"),
  finalDecision: boolean("final_decision").default(false),
  round: integer("round").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// New table for conflict of interest questionnaires
export const conflictQuestionnaires = pgTable("conflict_questionnaires", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  manuscriptId: uuid("manuscript_id").references(() => submissions.id).notNull(),
  role: text("role").notNull(), // "associate-editor", "reviewer"
  questionnaireData: jsonb("questionnaire_data").notNull(), // Store all questionnaire responses
  hasConflicts: boolean("has_conflicts").default(false),
  conflictDetails: text("conflict_details"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// New table for workflow stage time limits
export const workflowTimeLimits = pgTable("workflow_time_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  stage: text("stage").notNull().unique(), // "editorial-assistant-review", "associate-editor-review", "reviewer-review"
  timeLimitDays: integer("time_limit_days").notNull(),
  reminderDays: jsonb("reminder_days").$type<number[]>(), // [7, 3, 1] days before deadline
  escalationDays: jsonb("escalation_days").$type<number[]>(), // [7, 14, 21] days after deadline
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Communication templates for email notifications
export const communication_templates = pgTable("communication_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  template_name: text("template_name").notNull().unique(),
  template_type: text("template_type").notNull().default("email"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>(),
  is_active: boolean("is_active").default(true),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})
