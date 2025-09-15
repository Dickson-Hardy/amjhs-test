export type CanonicalStatus =
  | "draft"
  | "submitted"
  | "editorial_assistant_review"
  | "associate_editor_assignment"
  | "associate_editor_review"
  | "reviewer_assignment"
  | "under_review"
  | "revision_requested"
  | "revision_submitted"
  | "accepted"
  | "rejected"
  | "published"
  | "withdrawn"

// Map legacy/variant status strings to canonical values
const statusAliases: Record<string, CanonicalStatus> = {
  // Common legacy UI terms
  technical_check: "editorial_assistant_review",
  pending_decision: "associate_editor_review",
  // Spacings/case variants
  Technical_Check: "editorial_assistant_review",
  TECHNICAL_CHECK: "editorial_assistant_review",
  Pending_Decision: "associate_editor_review",
  PENDING_DECISION: "associate_editor_review",
}

export function normalizeStatus(status: string | undefined | null): CanonicalStatus | null {
  if (!status) return null
  const s = String(status).trim()
  if (!s) return null
  // identity if already canonical
  if (isCanonicalStatus(s)) return s
  // try alias map (lowercased key)
  const key = s.replace(/\s+/g, "_").toLowerCase()
  return statusAliases[key] ?? (isCanonicalStatus(key) ? (key as CanonicalStatus) : null)
}

export function isCanonicalStatus(val: string): val is CanonicalStatus {
  return (
    val === "draft" ||
    val === "submitted" ||
    val === "editorial_assistant_review" ||
    val === "associate_editor_assignment" ||
    val === "associate_editor_review" ||
    val === "reviewer_assignment" ||
    val === "under_review" ||
    val === "revision_requested" ||
    val === "revision_submitted" ||
    val === "accepted" ||
    val === "rejected" ||
    val === "published" ||
    val === "withdrawn"
  )
}

export function displayStatus(status: string | null | undefined): string {
  const norm = normalizeStatus(status)
  if (!norm) return "Unknown"
  const map: Record<CanonicalStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    editorial_assistant_review: "Editorial Assistant Review",
    associate_editor_assignment: "Assign Associate Editor",
    associate_editor_review: "Associate Editor Review",
    reviewer_assignment: "Reviewer Assignment",
    under_review: "Under Review",
    revision_requested: "Revision Requested",
    revision_submitted: "Revision Submitted",
    accepted: "Accepted",
    rejected: "Rejected",
    published: "Published",
    withdrawn: "Withdrawn",
  }
  return map[norm]
}

export const WORKFLOW_TRANSITIONS: Record<CanonicalStatus, CanonicalStatus[]> = {
  draft: ["submitted"],
  submitted: ["editorial_assistant_review", "reviewer_assignment", "under_review"],
  editorial_assistant_review: ["associate_editor_assignment"],
  associate_editor_assignment: ["associate_editor_review"],
  associate_editor_review: ["reviewer_assignment", "revision_requested", "accepted", "rejected"],
  reviewer_assignment: ["under_review"],
  under_review: ["revision_requested", "accepted", "rejected"],
  revision_requested: ["revision_submitted"],
  revision_submitted: ["associate_editor_review", "under_review"],
  accepted: ["published"],
  rejected: [],
  published: [],
  withdrawn: [],
}

export function canTransition(from: string | null | undefined, to: string | null | undefined): boolean {
  const f = normalizeStatus(from)
  const t = normalizeStatus(to)
  if (!f || !t) return false
  return WORKFLOW_TRANSITIONS[f].includes(t)
}
