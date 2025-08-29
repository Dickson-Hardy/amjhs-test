"use client"

import { Suspense } from 'react'
import SupportContacts from '@/components/support-contacts'

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading support information...</div>}>
      <SupportContacts />
    </Suspense>
  )
}
