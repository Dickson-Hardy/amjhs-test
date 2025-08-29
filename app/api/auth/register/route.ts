import { APP_CONFIG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { db, sql } from "@/lib/db"
import { users, userApplications, userQualifications, userPublications, userReferences, reviewerProfiles, editorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmailVerification } from "@/lib/email-hybrid"
import crypto from "crypto"
import { 
  createApiResponse, 
  createErrorResponse, 
  validateRequest,
  withErrorHandler,
  handleDatabaseError,
  ROLES
} from "@/lib/api-utils"
import { z } from "zod"
import { 
  RegistrationData
} from "@/types/registration"

// Validation schemas
const QualificationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"), 
  year: z.number().int().min(1950).max(new Date().getFullYear() + 10),
  field: z.string().min(1, "Field is required")
}).optional()

const PublicationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  journal: z.string().min(1, "Journal is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  doi: z.string().optional(),
  role: z.string().optional()
}).optional()

const ReferenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  affiliation: z.string().min(1, "Affiliation is required"),
  relationship: z.string().min(1, "Relationship is required")
}).optional()

const RegistrationSchema = z.object({
  // process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "Basic ""info (can be nested or flat)
  basicInfo: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    affiliation: z.string().min(1, "Affiliation is required"),
    orcid: z.string().optional(),
    role: z.enum([ROLES.AUTHOR, ROLES.REVIEWER, "editor"]).default(ROLES.AUTHOR),
    researchInterests: z.array(z.string()).optional()
  }).optional(),
  
  // Flat structure support
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  affiliation: z.string().optional(),
  orcid: z.string().optional(),
  role: z.enum([ROLES.AUTHOR, ROLES.REVIEWER, "editor"]).optional(),
  researchInterests: z.array(z.string()).optional(),
  
  // Role-specific data
  roleSpecificData: z.object({
    expertise: z.array(z.string()).optional(),
    specializations: z.array(z.string()).optional(),
    languagesSpoken: z.array(z.string()).optional(),
    maxReviewsPerMonth: z.number().int().min(1).max(20).optional(),
    availabilityStatus: z.enum(["available", "limited", "unavailable"]).optional(),
    qualifications: z.array(QualificationSchema).optional(),
    publications: z.array(PublicationSchema).optional(),
    references: z.array(ReferenceSchema).optional()
  }).optional(),
  
  // Direct fields for backward compatibility
  expertise: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  maxReviewsPerMonth: z.number().optional(),
  availabilityStatus: z.string().optional(),
  qualifications: z.array(QualificationSchema).optional(),
  publications: z.array(PublicationSchema).optional(),
  references: z.array(ReferenceSchema).optional()
})

async function registerUser(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  logger.api("User registration attempt started", {
    requestId,
    endpoint: "/api/auth/register",
    ip: request.ip || 'unknown'
  })

  try {
    const rawData = await request.json()
    
    // Validate input with flexible schema
    const validatedData = validateRequest(RegistrationSchema, rawData)
    
    // Normalize data structure - handle both nested and flat formats
    let registrationData: RegistrationData

    if (validatedData.basicInfo) {
      // Handle nested structure from enhanced signup page
      registrationData = {
        name: validatedData.basicInfo.name,
        email: validatedData.basicInfo.email,
        password: validatedData.basicInfo.password,
        affiliation: validatedData.basicInfo.affiliation,
        orcid: validatedData.basicInfo.orcid,
        role: validatedData.basicInfo.role,
        researchInterests: validatedData.basicInfo.researchInterests,
        // Merge role-specific data
        ...validatedData.roleSpecificData
      }
    } else {
      // Handle flat structure from simple signup page
      registrationData = {
        name: validatedData.name!,
        email: validatedData.email!,
        password: validatedData.password!,
        affiliation: validatedData.affiliation!,
        orcid: validatedData.orcid,
        role: validatedData.role || ROLES.AUTHOR,
        researchInterests: validatedData.researchInterests,
        expertise: validatedData.expertise,
        specializations: validatedData.specializations,
        languagesSpoken: validatedData.languagesSpoken,
        maxReviewsPerMonth: validatedData.maxReviewsPerMonth,
        availabilityStatus: validatedData.availabilityStatus,
        qualifications: validatedData.qualifications,
        publications: validatedData.publications,
        references: validatedData.references
      }
    }

    // process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "Basic ""sanitization and normalization
    const role = (registrationData.role || ROLES.AUTHOR).toLowerCase()
    if (!['author', 'reviewer', 'editor'].includes(role)) {
      throw new Error("Invalid role specified")
    }

    const toStringArray = (val: unknown): string[] | undefined => {
      if (!val) return undefined
      if (Array.isArray(val)) return val.map(v => String(v)).filter(Boolean)
      return [String(val)].filter(Boolean)
    }

    const safeQualifications = Array.isArray(registrationData.qualifications)
      ? registrationData.qualifications.map(q => ({
          degree: String(q.degree ?? ""),
          institution: String(q.institution ?? ""),
          year: Number(q.year ?? new Date().getFullYear()),
          field: String(q.field ?? "")
        }))
      : undefined

    const safePublications = Array.isArray(registrationData.publications)
      ? registrationData.publications.map(p => ({
          title: String(p.title ?? ""),
          journal: String(p.journal ?? ""),
          year: Number(p.year ?? new Date().getFullYear()),
          doi: p.doi ? String(p.doi) : undefined,
          role: p.role as any
        }))
      : undefined

    const safeReferences = Array.isArray(registrationData.references)
      ? registrationData.references.map(r => ({
          name: String(r.name ?? ""),
          email: String(r.email ?? ""),
          affiliation: String(r.affiliation ?? ""),
          relationship: String(r.relationship ?? "")
        }))
      : undefined

    const normalized: RegistrationData = {
      ...registrationData,
      role: role as any,
      researchInterests: toStringArray(registrationData.researchInterests),
      expertise: toStringArray(registrationData.expertise),
      specializations: toStringArray((registrationData as any).specializations),
      languagesSpoken: toStringArray(registrationData.languagesSpoken),
      qualifications: safeQualifications,
      publications: safePublications,
      references: safeReferences,
    }

    // Validate required fields after normalization
    if (!normalized.email || !normalized.password || !normalized.name) {
      throw new Error("Missing required fields: name, email, and password are required")
    }

    logger.api("Registration data validated", {
      requestId,
      email: normalized.email,
      role: normalized.role,
      hasOrcid: !!normalized.orcid
    })

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized.email))
      .limit(1)

    if (existingUser.length > 0) {
      logger.security("Registration attempt for existing user", {
        requestId,
        email: normalized.email,
        ip: request.ip
      })

      // If account exists, decide whether to resend verification or return conflict
      const userCols = await getExistingColumns('users')
      const hasIsVerified = userCols.has('is_verified')
      const hasEmailToken = userCols.has('email_verification_token')

      let isVerifiedVal: boolean | undefined
      let currentToken: string | null | undefined
      if (hasIsVerified) {
        const r1 = await sql`select is_verified from users where email = ${normalized.email} limit 1`
        isVerifiedVal = (r1 as any[])?.[0]?.is_verified ?? undefined
      }
      if (hasEmailToken) {
        const r2 = await sql`select email_verification_token from users where email = ${normalized.email} limit 1`
        currentToken = (r2 as any[])?.[0]?.email_verification_token
      }

      // If unverified and we can manage tokens, resend verification email
      if (hasEmailToken && (isVerifiedVal === false || isVerifiedVal === undefined || currentToken)) {
        let tokenToUse: string | null | undefined = currentToken
        const newToken = crypto.randomBytes(32).toString("hex")
        try {
          await sql`update users set email_verification_token = ${newToken} where email = ${normalized.email}`
          tokenToUse = newToken
        } catch (e) {
          logger.error("Failed to update verification token", {
            requestId,
            error: e instanceof Error ? e.message : String(e)
          })
        }
        if (tokenToUse) {
          const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.origin}`
          const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${tokenToUse}&email=${encodeURIComponent(normalized.email)}`
          try {
            await sendEmailVerification(normalized.email, normalized.name, verificationUrl)
            
            logger.api("Verification email resent for existing account", {
              requestId,
              email: normalized.email
            })
          } catch (e) {
            logger.error("Failed to resend verification email", {
              requestId,
              email: normalized.email,
              error: e instanceof Error ? e.message : String(e)
            })
          }
          
          return createApiResponse(
            { resent: true },
            "Account already exists. Verification email resent if not verified.",
            requestId
          )
        }
      }

      // Otherwise, return conflict to indicate existing account
      return createErrorResponse(
        new Error("User already exists. Please sign in."),
        requestId
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(normalized.password!, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    logger.api("Starting user creation process", {
      requestId,
      email: normalized.email,
      role: normalized.role
    })

    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(normalized)

    // Discover existing columns for compatibility with legacy schemas
    const userColumns = await getExistingColumns('users')
    // Prepare basic user insert data - only include core fields that should exist in all schemas
    const basicUserData = {
      email: normalized.email!,
      name: normalized.name!,
      password: hashedPassword,
      role,
      affiliation: normalized.affiliation,
      orcid: normalized.orcid,
      email_verification_token: verificationToken,
      is_active: true,
      is_verified: false,
      profile_completeness: calculateProfileCompleteness(normalized),
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Only include fields that exist in the actual database schema
    const userInsertValues: any = filterToExistingColumns(basicUserData, userColumns)
    
    // Add JSONB fields if they exist in the schema
    const expertise = toStringArray(normalized.expertise) || []
    const specializations = toStringArray(normalized.specializations) || []  
    const languagesSpoken = toStringArray(normalized.languagesSpoken) || []
    const researchInterests = toStringArray(normalized.researchInterests) || []
    
    if (userColumns.has('expertise')) {
      userInsertValues.expertise = expertise
    }
    if (userColumns.has('specializations')) {
      userInsertValues.specializations = specializations
    }
    if (userColumns.has('languages_spoken')) {
      userInsertValues.languages_spoken = languagesSpoken
    }
    if (userColumns.has('research_interests')) {
      userInsertValues.research_interests = researchInterests
    }
    const shouldSendVerification = userColumns.has('email_verification_token') && verificationToken

    // Execute all DB writes - try transaction first, fallback to sequential if not supported
    let newUserArr: { id: string }[] = []
    let useTransaction = true
    
    // Check if transactions are supported (neon-http doesn't support them)
    try {
      // Test transaction support with a dummy operation
      await db.transaction(async (tx) => {
        // Just test if transaction API is available
        return []
      })
    } catch (txErr: any) {
      if (txErr?.message?.includes('No transactions support') || 
          txErr?.message?.includes('transaction') ||
          txErr?.code === 'TRANSACTION_NOT_SUPPORTED') {
        useTransaction = false
        logger.info("Transactions not supported by driver, using sequential writes")
      }
    }

    if (useTransaction) {
      try {
        newUserArr = await db.transaction(async (tx) => {
          const inserted = await tx
            .insert(users)
            .values(userInsertValues as any)
            .returning({ id: users.id })

          const createdUser = inserted[0]
          await handleRoleSpecificRegistrationTx(tx as any, createdUser.id, normalized.role!, normalized)
          return inserted
        })
      } catch (txErr) {
        logger.warn("Transaction failed, falling back to sequential writes:", txErr)
        useTransaction = false
      }
    }
    
    if (!useTransaction) {
      // Fallback: sequential writes without a transaction
      const inserted = await db
        .insert(users)
        .values(userInsertValues as any)
        .returning({ id: users.id })

      const createdUser = inserted[0]
      await handleRoleSpecificRegistration(createdUser.id, normalized.role!, normalized)
      newUserArr = inserted
    }

    const [newUser] = newUserArr

    // Send verification email (best-effort)
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.origin}`
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalized.email!)}`
    if (shouldSendVerification) {
      try {
        await sendEmailVerification(normalized.email!, normalized.name!, verificationUrl)
      } catch (e) {
        logger.warn("Email verification send failed, continuing registration:", e)
      }
    } else {
      logger.warn("Skipping verification email: email_verification_token column not present in users table")
    }

    return createApiResponse(
      { 
        userId: newUser.id,
        requiresApproval: normalized.role !== "author"
      },
      getRegistrationMessage(normalized.role!),
      requestId
    )
  } catch (error: any) {
    logger.error("Registration error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      code: error?.code || error?.original?.code
    })
    
    // Map common Postgres errors to friendly responses
    if (error?.code === '23505') {
      throw new Error("User already exists")
    }
    if (error?.code === '22P02' || error?.code === '22001') {
      throw new Error("Invalid data provided")
    }
    throw new Error("Internal server error")
  }
}

async function handleRoleSpecificRegistration(
  userId: string, 
  role: string, 
  registrationData: RegistrationData
) {
  if (role === "reviewer") {
    const hasReviewerProfiles = await hasTable('reviewer_profiles')
    const hasUserApplications = await hasTable('user_applications')
    const hasUserQualifications = await hasTable('user_qualifications')
    const hasUserPublications = await hasTable('user_publications')
    const hasUserReferences = await hasTable('user_references')

    // Create reviewer profile
    if (hasReviewerProfiles) {
      const cols = await getExistingColumns('reviewer_profiles')
      const values = filterToExistingColumns({
        userId,
        maxReviewsPerMonth: registrationData.maxReviewsPerMonth || 3,
        availabilityStatus: registrationData.availabilityStatus || "available",
      }, cols)
      await db.insert(reviewerProfiles).values(values as any)
    }

    // Create application record
    if (hasUserApplications) {
      const cols = await getExistingColumns('user_applications')
      const values = filterToExistingColumns({
        userId,
        requestedRole: "reviewer",
        currentRole: "author",
        applicationData: buildApplicationData(registrationData),
        status: "pending",
      }, cols)
      await db.insert(userApplications).values(values as any)
    }

    // Add qualifications
    if (hasUserQualifications && registrationData.qualifications?.length) {
      for (const qual of registrationData.qualifications) {
        const cols = await getExistingColumns('user_qualifications')
        const values = filterToExistingColumns({
          userId,
          type: "degree",
          title: qual.degree,
          institution: qual.institution,
          endDate: new Date(qual.year, 0, 1),
          description: qual.field,
        }, cols)
        await db.insert(userQualifications).values(values as any)
      }
    }

    // Add publications
    if (hasUserPublications && registrationData.publications?.length) {
      for (const pub of registrationData.publications) {
        const cols = await getExistingColumns('user_publications')
        const values = filterToExistingColumns({
          userId,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          doi: pub.doi,
          authorRole: pub.role,
        }, cols)
        await db.insert(userPublications).values(values as any)
      }
    }

    // Add references
    if (hasUserReferences && registrationData.references?.length) {
      for (const ref of registrationData.references) {
        const cols = await getExistingColumns('user_references')
        const values = filterToExistingColumns({
          userId,
          referenceName: ref.name,
          referenceEmail: ref.email,
          referenceAffiliation: ref.affiliation,
          relationship: ref.relationship,
        }, cols)
        await db.insert(userReferences).values(values as any)
      }
    }
  }

  if (role === "editor") {
    const hasEditorProfiles = await hasTable('editor_profiles')
    const hasUserApplications = await hasTable('user_applications')
    const hasUserQualifications = await hasTable('user_qualifications')
    const hasUserPublications = await hasTable('user_publications')
    const hasUserReferences = await hasTable('user_references')

    // Create editor profile
    if (hasEditorProfiles) {
      const cols = await getExistingColumns('editor_profiles')
      const values = filterToExistingColumns({
        userId,
        editorType: "associate", // Default type
        assignedSections: registrationData.specializations || [],
        editorialExperience: registrationData.editorialExperience 
          ? JSON.stringify(registrationData.editorialExperience)
          : null,
        maxWorkload: 10, // Default workload
      }, cols)
      await db.insert(editorProfiles).values(values as any)
    }

    // Create application record
    if (hasUserApplications) {
      const cols = await getExistingColumns('user_applications')
      const values = filterToExistingColumns({
        userId,
        requestedRole: "editor",
        currentRole: "author",
        applicationData: buildApplicationData(registrationData),
        status: "pending",
      }, cols)
      await db.insert(userApplications).values(values as any)
    }

    // Add qualifications
    if (hasUserQualifications && registrationData.qualifications?.length) {
      for (const qual of registrationData.qualifications) {
        const cols = await getExistingColumns('user_qualifications')
        const values = filterToExistingColumns({
          userId,
          type: "degree",
          title: qual.degree,
          institution: qual.institution,
          endDate: new Date(qual.year, 0, 1),
          description: qual.field,
        }, cols)
        await db.insert(userQualifications).values(values as any)
      }
    }

    // Add publications
    if (hasUserPublications && registrationData.publications?.length) {
      for (const pub of registrationData.publications) {
        const cols = await getExistingColumns('user_publications')
        const values = filterToExistingColumns({
          userId,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          doi: pub.doi,
          authorRole: pub.role,
        }, cols)
        await db.insert(userPublications).values(values as any)
      }
    }

    // Add references
    if (hasUserReferences && registrationData.references?.length) {
      for (const ref of registrationData.references) {
        const cols = await getExistingColumns('user_references')
        const values = filterToExistingColumns({
          userId,
          referenceName: ref.name,
          referenceEmail: ref.email,
          referenceAffiliation: ref.affiliation,
          relationship: ref.relationship,
        }, cols)
        await db.insert(userReferences).values(values as any)
      }
    }
  }
}

// Transaction-scoped version to ensure all writes are part of the same transaction
async function handleRoleSpecificRegistrationTx(
  tx: any,
  userId: string,
  role: string,
  registrationData: RegistrationData
) {
  if (role === "reviewer") {
    const hasReviewerProfiles = await hasTable('reviewer_profiles')
    const hasUserApplications = await hasTable('user_applications')
    const hasUserQualifications = await hasTable('user_qualifications')
    const hasUserPublications = await hasTable('user_publications')
    const hasUserReferences = await hasTable('user_references')

    if (hasReviewerProfiles) {
      const cols = await getExistingColumns('reviewer_profiles')
      const values = filterToExistingColumns({
        userId,
        maxReviewsPerMonth: registrationData.maxReviewsPerMonth || 3,
        availabilityStatus: registrationData.availabilityStatus || "available",
      }, cols)
      await tx.insert(reviewerProfiles).values(values as any)
    }

    if (hasUserApplications) {
      const cols = await getExistingColumns('user_applications')
      const values = filterToExistingColumns({
        userId,
        requestedRole: "reviewer",
        currentRole: "author",
        applicationData: buildApplicationData(registrationData),
        status: "pending",
      }, cols)
      await tx.insert(userApplications).values(values as any)
    }

    if (hasUserQualifications && registrationData.qualifications?.length) {
      for (const qual of registrationData.qualifications) {
        const cols = await getExistingColumns('user_qualifications')
        const values = filterToExistingColumns({
          userId,
          type: "degree",
          title: qual.degree,
          institution: qual.institution,
          endDate: new Date(qual.year, 0, 1),
          description: qual.field,
        }, cols)
        await tx.insert(userQualifications).values(values as any)
      }
    }

    if (hasUserPublications && registrationData.publications?.length) {
      for (const pub of registrationData.publications) {
        const cols = await getExistingColumns('user_publications')
        const values = filterToExistingColumns({
          userId,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          doi: pub.doi,
          authorRole: pub.role,
        }, cols)
        await tx.insert(userPublications).values(values as any)
      }
    }

    if (hasUserReferences && registrationData.references?.length) {
      for (const ref of registrationData.references) {
        const cols = await getExistingColumns('user_references')
        const values = filterToExistingColumns({
          userId,
          referenceName: ref.name,
          referenceEmail: ref.email,
          referenceAffiliation: ref.affiliation,
          relationship: ref.relationship,
        }, cols)
        await tx.insert(userReferences).values(values as any)
      }
    }
  }

  if (role === "editor") {
    const hasEditorProfiles = await hasTable('editor_profiles')
    const hasUserApplications = await hasTable('user_applications')
    const hasUserQualifications = await hasTable('user_qualifications')
    const hasUserPublications = await hasTable('user_publications')
    const hasUserReferences = await hasTable('user_references')

    if (hasEditorProfiles) {
      const cols = await getExistingColumns('editor_profiles')
      const values = filterToExistingColumns({
        userId,
        editorType: "associate",
        assignedSections: registrationData.specializations || [],
        editorialExperience: registrationData.editorialExperience 
          ? JSON.stringify(registrationData.editorialExperience)
          : null,
        maxWorkload: 10,
      }, cols)
      await tx.insert(editorProfiles).values(values as any)
    }

    if (hasUserApplications) {
      const cols = await getExistingColumns('user_applications')
      const values = filterToExistingColumns({
        userId,
        requestedRole: "editor",
        currentRole: "author",
        applicationData: buildApplicationData(registrationData),
        status: "pending",
      }, cols)
      await tx.insert(userApplications).values(values as any)
    }

    if (hasUserQualifications && registrationData.qualifications?.length) {
      for (const qual of registrationData.qualifications) {
        const cols = await getExistingColumns('user_qualifications')
        const values = filterToExistingColumns({
          userId,
          type: "degree",
          title: qual.degree,
          institution: qual.institution,
          endDate: new Date(qual.year, 0, 1),
          description: qual.field,
        }, cols)
        await tx.insert(userQualifications).values(values as any)
      }
    }

    if (hasUserPublications && registrationData.publications?.length) {
      for (const pub of registrationData.publications) {
        const cols = await getExistingColumns('user_publications')
        const values = filterToExistingColumns({
          userId,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          doi: pub.doi,
          authorRole: pub.role,
        }, cols)
        await tx.insert(userPublications).values(values as any)
      }
    }

    if (hasUserReferences && registrationData.references?.length) {
      for (const ref of registrationData.references) {
        const cols = await getExistingColumns('user_references')
        const values = filterToExistingColumns({
          userId,
          referenceName: ref.name,
          referenceEmail: ref.email,
          referenceAffiliation: ref.affiliation,
          relationship: ref.relationship,
        }, cols)
        await tx.insert(userReferences).values(values as any)
      }
    }
  }
}

function buildApplicationData(data: RegistrationData) {
  // Keep only JSON-serializable, relevant fields for the applicationData JSONB column
  return {
    role: data.role,
    expertise: data.expertise || [],
    specializations: (data as any).specializations || [],
    languagesSpoken: data.languagesSpoken || [],
    qualifications: data.qualifications || [],
    publications: data.publications || [],
    references: data.references || [],
    editorialExperience: data.editorialExperience || [],
    academicBackground: (data as any).academicBackground,
    previousEditorialRoles: (data as any).previousEditorialRoles || [],
    orcid: data.orcid,
    affiliation: data.affiliation,
    researchInterests: data.researchInterests || [],
  }
}

function calculateProfileCompleteness(data: RegistrationData): number {
  let score = 0

  // process.env.AUTH_BASIC_PREFIX || "process.env.AUTH_BASIC_PREFIX || "Basic ""info (40%)
  if (data.name) score += 10
  if (data.email) score += 10
  if (data.affiliation) score += 10
  if (data.researchInterests?.length) score += 10

  // Additional info (30%)
  if (data.orcid) score += 10
  if (data.expertise?.length) score += 10
  if (data.languagesSpoken?.length) score += 10

  // Role-specific data (30%)
  if (data.role === "reviewer" || data.role === "editor") {
    if (data.qualifications?.length) score += 10
    if (data.publications?.length) score += 10
    if (data.references?.length) score += 10
  } else {
    score += 30 // Authors get full score for role-specific
  }

  return Math.min(score, 100)
}

function getRegistrationMessage(role: string): string {
  switch (role) {
    case "reviewer":
      return "Reviewer application submitted successfully. Please check your email for verification. Your application will be reviewed by our editorial team."
    case "editor":
      return "Editor application submitted successfully. Please check your email for verification. Your application will be reviewed by our editorial board."
    default:
      return "User created successfully. Please check your email for verification."
  }
}

// Helpers for legacy schema compatibility
async function getExistingColumns(tableName: string): Promise<Set<string>> {
  const rows = await sql`select column_name from information_schema.columns where table_schema = 'public' and table_name = ${tableName}`
  const set = new Set<string>()
  for (const r of rows as any[]) set.add(r.column_name)
  return set
}

async function hasTable(tableName: string): Promise<boolean> {
  const rows = await sql`select 1 from information_schema.tables where table_schema = 'public' and table_name = ${tableName} limit 1`
  return (rows as any[]).length > 0
}

function filterToExistingColumns<T extends Record<string, any>>(obj: T, columns: Set<string>): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, val] of Object.entries(obj)) {
    // Convert camelCase TS keys to snake_case DB columns where needed
    const snake = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)
    if (columns.has(snake) || columns.has(key)) {
      // If the DB column exists with snake_case, map to that key; otherwise keep original
      ;(out as any)[columns.has(snake) ? snake : key] = val
    }
  }
  return out
}

// Export the POST handler with error handling
export const POST = withErrorHandler(registerUser)
