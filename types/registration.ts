// Enhanced user registration types and workflows

export interface BasicUserInfo {
  name: string
  email: string
  password: string
  confirmPassword: string
  affiliation: string
  orcid?: string
  role: "author" | "reviewer" | "editor"
  researchInterests?: string[]
}

export interface ReviewerRegistration {
  expertise?: string[]
  qualifications?: QualificationData[]
  publications?: PublicationData[]
  languagesSpoken?: string[]
  availabilityStatus?: "available" | "limited" | "unavailable"
  maxReviewsPerMonth?: number
  references?: ReferenceData[]
}

export interface EditorRegistration {
  editorialExperience?: EditorialExperienceData[]
  academicBackground?: string
  previousEditorialRoles?: string[]
  specializations?: string[]
  qualifications?: QualificationData[]
  publications?: PublicationData[]
  references?: ReferenceData[]
}

export interface RegistrationData {
  // For enhanced signup page (nested structure)
  basicInfo?: BasicUserInfo
  roleSpecificData?: ReviewerRegistration | EditorRegistration | null
  
  // For flat structure (backward compatibility)
  name?: string
  email?: string
  password?: string
  affiliation?: string
  orcid?: string
  role?: "author" | "reviewer" | "editor"
  researchInterests?: string[]
  expertise?: string[]
  qualifications?: QualificationData[]
  publications?: PublicationData[]
  languagesSpoken?: string[]
  availabilityStatus?: "available" | "limited" | "unavailable"
  maxReviewsPerMonth?: number
  editorialExperience?: EditorialExperienceData[]
  academicBackground?: string
  previousEditorialRoles?: string[]
  specializations?: string[]
  cv?: File
  coverLetter?: File
  references?: ReferenceData[]
}

export interface QualificationData {
  degree: string
  institution: string
  year: number
  field: string
}

export interface PublicationData {
  title: string
  journal: string
  year: number
  doi?: string
  role: "first_author" | "corresponding_author" | "co_author"
}

export interface EditorialExperienceData {
  journal: string
  role: string
  startDate: string
  endDate?: string
  description: string
}

export interface ReferenceData {
  name: string
  email: string
  affiliation: string
  relationship: string
}

// Type aliases for backward compatibility
export type Qualification = QualificationData
export type Publication = PublicationData  
export type Reference = ReferenceData
