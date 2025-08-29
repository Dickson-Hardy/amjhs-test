import { z } from "zod"

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["author", "reviewer"]).default("author"),
    affiliation: z.string().optional(),
    orcid: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const authorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  orcid: z.string().optional(),
  institution: z.string().min(1, "Institution is required"),
  department: z.string().min(1, "Department is required"),
  country: z.string().min(1, "Country is required"),
  affiliation: z.string().min(1, "Full affiliation is required"),
  isCorrespondingAuthor: z.boolean().default(false),
})

export const recommendedReviewerSchema = z.object({
  name: z.string().min(1, "Reviewer name is required"),
  email: z.string().email("Valid email is required"),
  affiliation: z.string().min(1, "Affiliation is required"),
  expertise: z.string().optional(),
})

export const articleSubmissionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  abstract: z.string().min(1250, "Abstract must be at least 250 words (approximately 1250 characters)"),
  keywords: z.array(z.string()).min(4, "At least 4 keywords required"),
  category: z.string().min(1, "Category is required"),
  authors: z
    .array(authorSchema)
    .min(1, "At least one author is required")
    .refine(
      (authors) => authors.filter(author => author.isCorrespondingAuthor).length === 1,
      {
        message: "Exactly one corresponding author must be designated",
      }
    ),
  recommendedReviewers: z
    .array(recommendedReviewerSchema)
    .min(3, "At least 3 recommended reviewers are required")
    .max(10, "Maximum 10 recommended reviewers allowed"),
  funding: z.string().optional(),
  conflicts: z.string().optional(),
})

export const reviewSchema = z.object({
  recommendation: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  comments: z.string().min(50, "Comments must be at least 50 characters"),
  confidentialComments: z.string().optional(),
  rating: z.number().min(1).max(5),
})
