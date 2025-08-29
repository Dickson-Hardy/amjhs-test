import Link from "next/link"
import { BookOpen, Mail, Phone, MapPin } from "lucide-react"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t-2 border-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          {/* Journal Information */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo-amhsj.png"
                alt="AMHSJ Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <h3 className="font-serif font-bold text-blue-900 text-lg">
                Advances in Medicine & Health Sciences Journal
              </h3>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>Online ISSN: 2672-4596 | Print ISSN: 2672-4588</p>
              <p>
                This journal is protected by a{" "}
                <Link 
                  href="https://creativecommons.org/licenses/by-nc/4.0/" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Creative Commons Attribution - NonCommercial Works License
                </Link>{" "}
                (CC BY-NC 4.0)
              </p>
              <p>
                Read our{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-3">Contact Information</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                <div>
                  <div>Editor-in-Chief:</div>
                  <a href="process.env.EMAIL_FROMeditor@amhsj.org" className="text-blue-600 hover:text-blue-800">
                    editor@amhsj.org
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                <div>+234 813 198 1600</div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                <div>
                  Bayelsa Medical University,<br />
                  Yenagoa, Bayelsa State, Nigeria
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-3">Quick Links</h4>
            <ul className="space-y-1 text-gray-700">
              <li>
                <Link href="/information/readers" className="text-blue-600 hover:text-blue-800">
                  For Readers
                </Link>
              </li>
              <li>
                <Link href="/information/authors" className="text-blue-600 hover:text-blue-800">
                  For Authors
                </Link>
              </li>
              <li>
                <Link href="/information/librarians" className="text-blue-600 hover:text-blue-800">
                  For Librarians
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-blue-600 hover:text-blue-800">
                  Submit Article
                </Link>
              </li>
              <li>
                <Link href="/current-issue" className="text-blue-600 hover:text-blue-800">
                  Current Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Publisher Information */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <div className="text-gray-700 text-sm mb-4">
            <p className="mb-2">
              <strong>Bayelsa Medical University</strong> is the official publisher of AMHSJ.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/events" className="text-blue-600 hover:text-blue-800">Events</Link>
              <span>|</span>
              <Link href="/careers" className="text-blue-600 hover:text-blue-800">Careers</Link>
              <span>|</span>
              <Link href="/cpd" className="text-blue-600 hover:text-blue-800">CPD</Link>
            </div>
          </div>
          
          <div className="text-gray-600 text-xs">
            <p className="mb-2">
              <strong>AMHSJ Journals:</strong>{" "}
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Advances in Medicine & Health Sciences Journal
              </Link>
            </p>
            <p>
              Open Journal Systems Hosting and Support by:{" "}
              <Link 
                href="https://openjournalsystems.com/" 
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenJournalSystems.com
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-6 pt-4 text-center text-xs text-gray-600">
          © {currentYear} Advances in Medicine & Health Sciences Journal. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
