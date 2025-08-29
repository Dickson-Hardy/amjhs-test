"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, Search, Wifi, LogOut, Settings, FileText } from "lucide-react"
import { NotificationCenter } from "@/components/notifications"
import ModernNotificationSystem from "@/components/modern-notification-system"
import { getRoleBasedDashboard, getRoleDisplayName } from "@/lib/role-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const navigationItems = [
    {
      title: "Home",
      href: "/",
      isSingle: true,
    },
    {
      title: "Masthead",
      href: "/masthead",
      isSingle: true,
    },
    {
      title: "About the Journal",
      items: [
        { title: "Mission & Scope", href: "/about", description: "Our academic research mission and scope" },
        { title: "Journal Overview", href: "/about/overview", description: "Learn about AJRS" },
        { title: "Aims & Objectives", href: "/about/aims", description: "Our research goals" },
      ],
    },
    {
      title: "Editorial Board",
      href: "/editorial-board",
      isSingle: true,
    },
    {
      title: "Submission Guidelines",
      items: [
        { title: "Author Guidelines", href: "/author/guidelines", description: "Detailed submission instructions" },
        { title: "Submission Process", href: "/submission-guidelines", description: "Step-by-step submission guide" },
        { title: "Manuscript Format", href: "/submission-guidelines/format", description: "Formatting requirements" },
        { title: "Peer Review Process", href: "/peer-review", description: "How we review submissions" },
        { title: "Research Ethics", href: "/ethics", description: "Ethical guidelines for research" },
      ],
    },
    {
      title: "Contact Us",
      href: "/contact",
      isSingle: true,
    },
    {
      title: "FAQ / Help Center",
      items: [
        { title: "Support Center", href: "/support", description: "Get help and live chat support" },
        { title: "Frequently Asked Questions", href: "/faq", description: "Common questions and answers" },
        { title: "Help Center", href: "/help", description: "Get help with submissions" },
        { title: "Technical Support", href: "/help/technical", description: "Technical assistance" },
        { title: "Author Resources", href: "/author/help", description: "Resources for authors" },
      ],
    },
  ]

  return (
    <header className="w-full border-b bg-white">
      <div className="container mx-auto px-4">
        {/* Top Header with Journal Info */}
        <div className="flex h-20 items-center justify-between border-b border-gray-200">
          {/* Logo and Journal Title */}
          <Link href="/" className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-lg border shadow-sm">
              <img
                src="/logo-amhsj.png"
                alt="AMHSJ Logo"
                width={40}
                height={40}
                className="object-contain block"
                style={{ maxWidth: '40px', maxHeight: '40px' }}
              />
            </div>
            <div>
              <div className="font-serif font-bold text-2xl text-blue-900">
                Advances in Medicine & Health Sciences Journal
              </div>
              <div className="text-sm text-gray-600">
                The Official Journal of Bayelsa Medical University
              </div>
            </div>
          </Link>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">LOGIN</Link>
              <span className="text-gray-400">|</span>
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">REGISTER</Link>
              <span className="text-gray-400">|</span>
              <Link href="/search" className="text-blue-600 hover:text-blue-800">SEARCH</Link>
            </div>

            {/* User Authentication */}
            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                      <p className="text-xs leading-none text-blue-600">
                        {getRoleDisplayName(session.user?.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getRoleBasedDashboard(session.user?.role)}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {["admin", "editor-in-chief"].includes(session.user?.role || "") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/submit">
                      <Search className="mr-2 h-4 w-4" />
                      Submit Research
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/submissions">
                      <FileText className="mr-2 h-4 w-4" />
                      My Submissions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="text-center pb-4 border-b">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <img
                        src="/logo-amhsj.png"
                        alt="AMHSJ Logo"
                        width={32}
                        height={32}
                        className="object-contain block"
                        style={{ maxWidth: '32px', maxHeight: '32px' }}
                      />
                      <div className="font-bold text-lg">AJRS</div>
                    </div>
                    <div className="text-sm text-gray-600">Academic Research Journal</div>
                  </div>
                  {navigationItems.map((item) => (
                    <div key={item.title} className="space-y-2">
                      {item.isSingle ? (
                        <Link
                          href={item.href!}
                          className="block px-3 py-2 text-sm font-semibold text-gray-800 hover:text-blue-600 hover:bg-blue-50 rounded-md border-b pb-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-800 border-b pb-2">{item.title}</h3>
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.title}
                              href={subItem.href}
                              className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                  <div className="pt-4 border-t space-y-2">
                    {session ? (
                      <>
                        <div className="px-3 py-2 text-sm">
                          <p className="font-medium">{session.user?.name || "User"}</p>
                          <p className="text-xs text-gray-600">{getRoleDisplayName(session.user?.role)}</p>
                        </div>
                        <Button className="w-full" variant="outline" asChild>
                          <Link href={getRoleBasedDashboard(session.user?.role)}>
                            <User className="h-4 w-4 mr-2" />
                            Dashboard
                          </Link>
                        </Button>
                        {["admin", "editor-in-chief"].includes(session.user?.role || "") && (
                          <Button className="w-full" variant="outline" asChild>
                            <Link href="/admin">
                              <Settings className="h-4 w-4 mr-2" />
                              Admin Panel
                            </Link>
                          </Button>
                        )}
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/submit">
                            <Search className="h-4 w-4 mr-2" />
                            Submit Research
                          </Link>
                        </Button>
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700" 
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/auth/login">
                            <User className="h-4 w-4 mr-2" />
                            Login
                          </Link>
                        </Button>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                          <Link href="/auth/signup">Join AJRS</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex h-12 items-center justify-center">
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="flex space-x-8">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.isSingle ? (
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href!}
                        className="inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors uppercase tracking-wide"
                      >
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="text-gray-700 hover:text-blue-600 uppercase tracking-wide text-sm">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.items?.map((subItem) => (
                            <li key={subItem.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={subItem.href}
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <div className="text-sm font-medium leading-none">{subItem.title}</div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {subItem.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  )
}
