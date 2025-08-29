import { z } from "zod"

// Enhanced validation schemas for all APIs

// Reviews API validation
export const reviewSubmissionSchema = z.object({
  articleId: z.string().uuid("Invalid article ID"),
  recommendation: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  comments: z.string().min(50, "Comments must be at least 50 characters"),
  confidentialComments: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  reviewComplete: z.boolean().default(true)
})

// Messages API validation
export const messageCreationSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  recipientType: z.enum(["admin", "editor", "support", "user"]).optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200, "Subject too long"),
  content: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message too long"),
  messageType: z.enum(["general", "editorial", "review", "system"]).default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  submissionId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().positive()
  })).optional()
})

// User Profile validation
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  affiliation: z.string().max(200, "Affiliation too long").optional(),
  bio: z.string().max(1000, "Bio too long").optional(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/, "Invalid ORCID format").optional(),
  expertise: z.array(z.string().min(1)).max(10, "Maximum 10 expertise areas").optional(),
  specializations: z.array(z.string().min(1)).max(10, "Maximum 10 specializations").optional(),
  researchInterests: z.array(z.string().min(1)).max(10, "Maximum 10 research interests").optional(),
  languagesSpoken: z.array(z.string().min(1)).max(20, "Maximum 20 languages").optional()
})

// Notifications API validation
export const notificationUpdateSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
  isRead: z.boolean(),
  action: z.enum(["mark_read", "mark_unread", "archive", "delete"]).optional()
})

export const notificationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, "Limit must be 1-100").optional(),
  unread: z.enum(["true", "false"]).optional(),
  type: z.enum(["submission", "review", "publication", "system", "editorial"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, "Page must be positive").optional()
})

// Generic query validation
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, "Page must be positive").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, "Limit must be 1-100").optional(),
  search: z.string().max(200, "Search term too long").optional(),
  sortBy: z.string().max(50, "Sort field too long").optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
})

// Articles API validation enhancement
export const articleQuerySchema = z.object({
  search: z.string().max(200, "Search term too long").optional(),
  category: z.string().max(100, "Category name too long").optional(),
  year: z.string().regex(/^\d{4}$/, "Invalid year format").optional(),
  featured: z.enum(["true", "false"]).optional(),
  current: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, "Page must be positive").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50, "Limit must be 1-50").optional(),
  status: z.enum(["published", "under_review", "accepted", "all"]).optional()
})