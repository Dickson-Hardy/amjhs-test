import { useState, useEffect } from 'react'

interface JournalInfo {
  name: string | null
  shortName: string | null
  description: string | null
  onlineIssn: string | null
  printIssn: string | null
  impactFactor: number | null
  jciScore: number | null
  hIndex: number | null
  totalCitations: number | null
  publisher: string | null
  frequency: string | null
  establishedYear: number | null
  subjectAreas: string[] | null
  stats: {
    totalArticles: number
    totalVolumes: number
    totalIssues: number
  }
  openAccess: boolean | null
  submissionsOpen: boolean | null
  license: string | null
  website: string | null
  email: string | null
  indexing: string[] | null
}

interface UseJournalInfoResult {
  journalInfo: JournalInfo | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useJournalInfo(): UseJournalInfoResult {
  const [journalInfo, setJournalInfo] = useState<JournalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJournalInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/journal-info')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch journal info: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setJournalInfo(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch journal info')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching journal info:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournalInfo()
  }, [])

  const refetch = () => {
    fetchJournalInfo()
  }

  return {
    journalInfo,
    loading,
    error,
    refetch
  }
}