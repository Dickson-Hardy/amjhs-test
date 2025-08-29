import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { apiRateLimit, authRateLimit } from "@/lib/rate-limit"

export default withAuth(
  async function middleware(req) {
    try {
      // Special handling for editorial assistant routes
      if (req.nextUrl.pathname.startsWith("/editorial-assistant") && 
          req.nextUrl.pathname !== "/editorial-assistant/login") {
        // If user is not authenticated, redirect to editorial assistant login
        if (!req.nextauth.token) {
          const loginUrl = new URL("/editorial-assistant/login", req.url)
          loginUrl.searchParams.set("callbackUrl", req.url)
          return NextResponse.redirect(loginUrl)
        }
        
        // If authenticated but not the right role, redirect to general dashboard
        const userRole = req.nextauth.token.role
        if (userRole !== "editorial-assistant" && 
            !["admin", "editor-in-chief", "managing-editor"].includes(userRole)) {
          return NextResponse.redirect(new URL("/dashboard", req.url))
        }
      }

      // Maintenance Mode Check (Production Only)
      if (process.env.NODE_ENV === 'production' && process.env.MAINTENANCE_MODE === 'true') {
        const isMaintenancePage = req.nextUrl.pathname.startsWith('/maintenance')
        const isApiHealthCheck = req.nextUrl.pathname === '/api/health'
        const isStaticAsset = req.nextUrl.pathname.startsWith('/_next') || 
                             req.nextUrl.pathname.startsWith('/favicon') ||
                             req.nextUrl.pathname.startsWith('/images') ||
                             req.nextUrl.pathname.startsWith('/icons')

        // Skip maintenance redirect for excluded paths
        if (!isMaintenancePage && !isApiHealthCheck && !isStaticAsset) {
          const maintenanceUrl = req.nextUrl.clone()
          maintenanceUrl.pathname = '/maintenance'
          maintenanceUrl.searchParams.set('return', req.nextUrl.pathname)
          return NextResponse.redirect(maintenanceUrl)
        }
      }

      // Dashboard route redirects for old URLs
      if (req.nextUrl.pathname.startsWith("/dashboard/")) {
        const oldPath = req.nextUrl.pathname
        // Allow new profile page without redirection
        if (oldPath === "/dashboard/profile") {
          return NextResponse.next()
        }
        let redirectPath = "/dashboard"
        
        // Map old dashboard routes to new tab-based navigation
        if (oldPath === "/dashboard/manuscripts") {
          redirectPath = "/dashboard?tab=submissions"
        } else if (oldPath === "/dashboard/revisions") {
          redirectPath = "/dashboard?tab=submissions"
        } else if (oldPath === "/dashboard/reviews") {
          redirectPath = "/dashboard?tab=reviews"
        } else if (oldPath === "/dashboard/communications") {
          redirectPath = "/dashboard?tab=messages"
        } else if (oldPath === "/dashboard/analytics") {
          redirectPath = "/dashboard?tab=analytics"
        } else if (oldPath === "/dashboard/published") {
          redirectPath = "/dashboard?tab=submissions"
        } else if (oldPath === "/dashboard/submit") {
          redirectPath = "/submit"
        } else if (oldPath === "/dashboard/reviewers") {
          redirectPath = "/dashboard?tab=submissions"
        } else if (oldPath === "/dashboard/decisions") {
          redirectPath = "/dashboard?tab=submissions"
        } else if (oldPath === "/dashboard/calendar") {
          redirectPath = "/dashboard?tab=overview"
        } else if (oldPath === "/dashboard/archive") {
          redirectPath = "/archive"
        } else if (oldPath === "/dashboard/settings" || oldPath === "/dashboard/guidelines") {
          redirectPath = "/dashboard"
        }
        
        // Only redirect if it's not the main dashboard page
        if (oldPath !== "/dashboard" && redirectPath !== oldPath) {
          const redirectUrl = req.nextUrl.clone()
          const [path, query] = redirectPath.split('?')
          redirectUrl.pathname = path
          if (query) {
            redirectUrl.search = query
          }
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Apply rate limiting
      if (req.nextUrl.pathname.startsWith("/api/")) {
        const rateLimit = req.nextUrl.pathname.startsWith("/api/auth/") ? authRateLimit : apiRateLimit
        
        try {
          const { allowed, remaining, resetTime } = await rateLimit.isAllowed(req)

          if (!allowed) {
            return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": resetTime.toString(),
              },
            })
          }

          // Add rate limit headers to successful responses
          const response = NextResponse.next()
          response.headers.set("X-RateLimit-Remaining", remaining.toString())
          response.headers.set("X-RateLimit-Reset", resetTime.toString())
          return response
        } catch (rateLimitError) {
          // Rate limiting error
          // Continue without rate limiting if there's an error
        }
      }

      // Security headers
      const response = NextResponse.next()
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-Content-Type-Options", "nosniff")
      response.headers.set("Referrer-Policy", "origin-when-cross-origin")
      response.headers.set("X-XSS-Protection", "1; mode=block")

      return response
    } catch (error) {
      // Middleware error
      return NextResponse.next()
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        const userRole = token?.role

        // Editorial Assistant routes
        if (pathname.startsWith("/editorial-assistant")) {
          return userRole === "editorial-assistant" || ["admin", "editor-in-chief", "managing-editor"].includes(userRole || "")
        }

        // Admin routes - highest level access
        if (pathname.startsWith("/admin")) {
          return userRole === "admin"
        }

        // Editor-in-Chief routes
        if (pathname.startsWith("/editor-in-chief")) {
          return userRole === "editor-in-chief" || userRole === "admin"
        }

        // Managing Editor routes
        if (pathname.startsWith("/managing-editor")) {
          return ["managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // Section Editor routes
        if (pathname.startsWith("/section-editor")) {
          return ["section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // Guest Editor routes
        if (pathname.startsWith("/guest-editor")) {
          return ["guest-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // Production Editor routes
        if (pathname.startsWith("/production-editor")) {
          return ["production-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // Associate Editor routes
        if (pathname.startsWith("/editor")) {
          return ["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // Editorial Assistant routes
        if (pathname.startsWith("/editorial-assistant")) {
          return userRole === "editorial-assistant" || ["admin", "editor-in-chief", "managing-editor"].includes(userRole || "")
        }

        // Reviewer routes
        if (pathname.startsWith("/reviewer")) {
          return ["reviewer", "editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(userRole || "")
        }

        // General dashboard and submission routes
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/submit")) {
          return !!token
        }

        return true
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for maintenance page in dev mode
     * and health checks in production
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    "/admin/:path*", 
    "/dashboard/:path*", 
    "/submit/:path*", 
    "/editor-in-chief/:path*",
    "/managing-editor/:path*",
    "/section-editor/:path*",
    "/guest-editor/:path*",
    "/production-editor/:path*",
    "/editor/:path*",
    "/editorial-assistant/:path*",
    "/reviewer/:path*",
    "/api/:path*"
  ],
}
