import { Session } from "next-auth"

/**
 * Get the appropriate dashboard route based on user role
 */
export function getRoleBasedDashboard(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "editor-in-chief":
    case "managing-editor":
    case "section-editor":
    case "guest-editor":
    case "production-editor":
    case "editor":
      return "/editor/dashboard"
    case "editorial-assistant":
      return "/editorial-assistant"
    case "reviewer":
      return "/reviewer/dashboard"
    case "author":
    case "user":
    default:
      return "/author/dashboard"
  }
}

/**
 * Get the appropriate redirect URL after successful authentication
 */
export function getPostAuthRedirect(session: Session | null, callbackUrl?: string): string {
  // If there's a specific callback URL, use it (but validate it's safe)
  if (callbackUrl && callbackUrl.startsWith("/")) {
    return callbackUrl
  }

  // Otherwise, use role-based routing
  const userRole = session?.user?.role
  return getRoleBasedDashboard(userRole)
}

/**
 * Check if a user has access to a specific route based on their role
 */
export function hasRouteAccess(userRole: string | undefined, route: string): boolean {
  // Admin routes - highest level access (Admin and Editor-in-Chief)
  if (route.startsWith("/admin")) {
    return userRole === "admin" || userRole === "editor-in-chief"
  }

  // Editor-in-Chief routes - ultimate editorial authority
  if (route.startsWith("/editor-in-chief")) {
    return userRole === "editor-in-chief" || userRole === "admin"
  }

  // Managing Editor routes - operational management
  if (route.startsWith("/managing-editor")) {
    return ["managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Section Editor routes - specialized editorial areas
  if (route.startsWith("/section-editor")) {
    return ["section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Guest Editor routes - special issue management
  if (route.startsWith("/guest-editor")) {
    return ["guest-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Production Editor routes - post-acceptance workflow
  if (route.startsWith("/production-editor")) {
    return ["production-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Editorial Assistant routes - initial screening and assignment
  if (route.startsWith("/editorial-assistant")) {
    return ["editorial-assistant", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Associate Editor routes
  if (route.startsWith("/editor")) {
    return ["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Reviewer routes
  if (route.startsWith("/reviewer")) {
    return ["reviewer", "editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
  }

  // Protected user routes
  if (route.startsWith("/dashboard") || route.startsWith("/submit")) {
    return !!userRole // Any authenticated user
  }

  // Public routes
  return true
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "System Administrator"
    case "editor-in-chief":
      return "Editor-in-Chief"
    case "managing-editor":
      return "Managing Editor"
    case "section-editor":
      return "Section Editor"
    case "production-editor":
      return "Production Editor"
    case "guest-editor":
      return "Guest Editor"
    case "editor":
      return "Associate Editor"
    case "editorial-assistant":
      return "Editorial Assistant"
    case "reviewer":
      return "Reviewer"
    case "author":
      return "Author"
    case "user":
      return "User"
    default:
      return "Unknown Role"
  }
}

/**
 * Get appropriate welcome message based on role
 */
export function getRoleWelcomeMessage(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "Welcome to AMHSJ System Administration. You have full system control."
    case "editor-in-chief":
      return "Welcome to AMHSJ Editorial Leadership. You oversee all editorial decisions."
    case "managing-editor":
      return "Welcome to AMHSJ Editorial Management. You coordinate daily operations."
    case "section-editor":
      return "Welcome to AMHSJ Section Editing. You manage specialized content areas."
    case "production-editor":
      return "Welcome to AMHSJ Production. You handle post-acceptance workflows."
    case "guest-editor":
      return "Welcome to AMHSJ Guest Editing. You manage special issue content."
    case "editor":
      return "Welcome to AMHSJ Associate Editing. You handle manuscript review and decisions."
    case "editorial-assistant":
      return "Welcome to AMHSJ Editorial Assistance. You perform initial screening and assignments."
    case "reviewer":
      return "Welcome to AMHSJ Peer Review. You evaluate manuscript quality and provide feedback."
    case "author":
      return "Welcome to AMHSJ Author Portal. Submit and track your research manuscripts."
    default:
      return "Welcome to AMHSJ Medical Research Journal."
  }
}

/**
 * Get role hierarchy level (higher number = more authority)
 */
export function getRoleHierarchy(role: string | undefined): number {
  switch (role) {
    case "admin":
      return 100 // System level
    case "editor-in-chief":
      return 100 // Equal to admin - highest editorial authority
    case "managing-editor":
      return 80 // Operational authority
    case "section-editor":
      return 70 // Subject area authority
    case "production-editor":
      return 60 // Production authority
    case "guest-editor":
      return 50 // Special issue authority
    case "editor":
      return 40 // Associate editorial authority
    case "editorial-assistant":
      return 35 // Initial screening and assignment authority
    case "reviewer":
      return 30 // Review authority
    case "author":
      return 20 // Submission authority
    case "user":
      return 10 // process.env.AUTH_TOKEN_PREFIX + ' 'user
    default:
      return 0 // No authority
  }
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: string | undefined, targetRole: string | undefined): boolean {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole)
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(userRole: string | undefined): string[] {
  const userLevel = getRoleHierarchy(userRole)
  const allRoles = [
    { role: "author", level: 20 },
    { role: "reviewer", level: 30 },
    { role: "editor", level: 40 },
    { role: "guest-editor", level: 50 },
    { role: "production-editor", level: 60 },
    { role: "section-editor", level: 70 },
    { role: "managing-editor", level: 80 },
    { role: "editor-in-chief", level: 100 },
    { role: "admin", level: 100 },
  ]
  
  // Admin and Editor-in-Chief can assign any role except their own level
  if (userRole === "admin" || userRole === "editor-in-chief") {
    return allRoles
      .filter(({ role }) => role !== userRole) // Can't assign same role to avoid conflicts
      .map(({ role }) => role)
  }
  
  return allRoles
    .filter(({ level }) => level < userLevel)
    .map(({ role }) => role)
}

/**
 * Get role-specific permissions
 */
export function getRolePermissions(role: string | undefined): {
  canManageUsers: boolean
  canAssignRoles: boolean
  canManageSubmissions: boolean
  canAssignReviewers: boolean
  canMakeFinalDecisions: boolean
  canManageProduction: boolean
  canManageSpecialIssues: boolean
  canAccessAnalytics: boolean
  canManageSystem: boolean
} {
  const hierarchy = getRoleHierarchy(role)
  
  return {
    canManageUsers: hierarchy >= 70, // Section editor and above
    canAssignRoles: hierarchy >= 80, // Managing editor and above
    canManageSubmissions: hierarchy >= 40, // Editor and above
    canAssignReviewers: hierarchy >= 40, // Editor and above
    canMakeFinalDecisions: hierarchy >= 70, // Section editor and above
    canManageProduction: hierarchy >= 60, // Production editor and above
    canManageSpecialIssues: hierarchy >= 50, // Guest editor and above
    canAccessAnalytics: hierarchy >= 40, // Editor and above
    canManageSystem: hierarchy >= 100, // Admin and Editor-in-Chief
  }
}
