import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import SEOManagementDashboard from '@/components/seo-management-dashboard'

export const metadata: Metadata = {
  title: 'SEO Management | Admin Dashboard',
  description: 'Manage and optimize SEO settings for the academic journal platform.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SEOManagementPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/auth/signin')
  }

  return <SEOManagementDashboard />
}
