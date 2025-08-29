import React from "react"
import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-white/50 backdrop-blur">
      <div className="container mx-auto px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p>
              The Advances in Medicine & Health Sciences Journal (AMHSJ) is the journal of the Bayelsa Medical University and is published quarterly. It disseminates peer‑reviewed research from the rural Niger Delta region of Nigeria and globally across all medical and health science specialties.
            </p>
            <p>
              Content is published open access and immediately free to read and download.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <img src="/cc-by-nc-nd.svg" alt="CC BY-NC-ND 3.0" className="h-8 w-auto" />
              <span className="font-medium">CC BY-NC-ND 3.0</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              Except where otherwise noted, content is licensed under a Creative Commons Attribution-NonCommercial-NoDerivs 3.0 License.
            </p>
            <Link href="https://creativecommons.org/licenses/by-nc-nd/3.0/" target="_blank" className="text-blue-600 hover:text-blue-800 text-xs">
              https://creativecommons.org/licenses/by-nc-nd/3.0/
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs">© {new Date().getFullYear()} AMHSJ. All rights reserved.</p>
          <nav className="flex flex-wrap gap-4 text-xs">
            <Link href="/about" className="hover:text-gray-800">About</Link>
            <Link href="/author/guidelines" className="hover:text-gray-800">Author Guidelines</Link>
            <Link href="/submission-guidelines" className="hover:text-gray-800">Submission</Link>
            <Link href="/manuscript-template" className="hover:text-gray-800">Templates</Link>
            <Link href="/help" className="hover:text-gray-800">Help</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
