'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Phone, Mail, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: () => {
        if (typeof window !== 'undefined' && (window as unknown).Tawk_API) {
          (window as unknown).Tawk_API.maximize()
        }
        setIsOpen(false)
      },
      color: "text-green-600 hover:bg-green-50"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "+1 (555) 0123",
      action: () => {
        window.location.href = "tel:+1-555-0123"
        setIsOpen(false)
      },
      color: "text-blue-600 hover:bg-blue-50"
    },
    {
      icon: Mail,
      title: "Email",
      description: "support@amhsj.org",
      action: () => {
        window.location.href = "process.env.EMAIL_FROMsupport@amhsj.org"
        setIsOpen(false)
      },
      color: "text-purple-600 hover:bg-purple-50"
    },
    {
      icon: HelpCircle,
      title: "Help Center",
      description: "Browse FAQs and guides",
      action: () => {
        window.location.href = "/support"
        setIsOpen(false)
      },
      color: "text-orange-600 hover:bg-orange-50"
    }
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Support Options Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <Card className="shadow-2xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                  <CardDescription>Choose how you'd like to get support</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {supportOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 ${option.color}`}
                  onClick={option.action}
                >
                  <option.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{option.title}</div>
                    <div className="text-sm opacity-70">{option.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Support Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </Button>
    </>
  )
}
