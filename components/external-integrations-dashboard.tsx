/**
 * External Integrations Dashboard Component
 * Manages ORCID, CrossRef, DOI, and PubMed integrations
 */

"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ExternalLink, 
  Search, 
  FileText, 
  Database, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Link,
  User,
  BookOpen,
  AlertTriangle
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface ORCIDProfile {
  orcidId: string
  name: string
  biography?: string
  affiliation?: string
  works: Array<{
    title: string
    journal?: string
    year: number
    doi?: string
  }>
  education: Array<{
    institution: string
    degree: string
    year: number
  }>
  employments: Array<{
    institution: string
    role: string
    startYear: number
    endYear?: number
  }>
}

interface CrossRefResult {
  id: string
  title: string
  authors: string[]
  journal: string
  publishedDate: string
  doi: string
  abstract?: string
  similarity?: number
}

interface PubMedResult {
  pmid: string
  title: string
  authors: string[]
  journal: string
  publishedDate: string
  abstract?: string
  doi?: string
}

interface ExternalIntegrationsDashboardProps {
  manuscriptId?: string
  className?: string
}

export function ExternalIntegrationsDashboard({ manuscriptId, className }: ExternalIntegrationsDashboardProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ORCID state
  const [orcidProfile, setORCIDProfile] = useState<ORCIDProfile | null>(null)
  const [orcidConnected, setORCIDConnected] = useState(false)
  
  // Search states
  const [crossRefResults, setCrossRefResults] = useState<CrossRefResult[]>([])
  const [pubMedResults, setPubMedResults] = useState<PubMedResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // DOI state
  const [doiStatus, setDOIStatus] = useState<{
    doi?: string
    status: 'not_registered' | 'pending' | 'registered'
    registeredAt?: string
  }>({ status: 'not_registered' })

  useEffect(() => {
    if (session?.user) {
      loadIntegrationStatus()
      if (manuscriptId) {
        loadDOIStatus()
      }
    }
  }, [session, manuscriptId])

  const loadIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/external-integrations?action=user-integrations')
      const data = await response.json()

      if (data.success) {
        setORCIDConnected(data.data.orcid.connected)
        if (data.data.orcid.orcidId) {
          await loadORCIDProfile(data.data.orcid.orcidId)
        }
      }
    } catch (error) {
      logger.error('Failed to load integration status:', error)
    }
  }

  const loadORCIDProfile = async (orcidId: string) => {
    try {
      const response = await fetch(`/api/external-integrations?action=orcid-profile&orcidId=${orcidId}`)
      const data = await response.json()

      if (data.success) {
        setORCIDProfile(data.data)
      }
    } catch (error) {
      logger.error('Failed to load ORCID profile:', error)
    }
  }

  const loadDOIStatus = async () => {
    if (!manuscriptId) return

    try {
      const response = await fetch(`/api/external-integrations?action=doi-status&manuscriptId=${manuscriptId}`)
      const data = await response.json()

      if (data.success) {
        setDOIStatus(data.data)
      }
    } catch (error) {
      logger.error('Failed to load DOI status:', error)
    }
  }

  const connectORCID = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would redirect to ORCID OAuth
      const authUrl = `https://orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/orcid/callback')}`
      
      window.location.href = authUrl
    } catch (error) {
      logger.error('Failed to connect ORCID:', error)
      setError('Failed to connect ORCID account')
    } finally {
      setLoading(false)
    }
  }

  const syncORCID = async () => {
    if (!orcidProfile?.orcidId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/external-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-orcid',
          orcidId: orcidProfile.orcidId
        })
      })

      const data = await response.json()

      if (data.success) {
        setORCIDProfile(data.data)
      } else {
        setError(data.error || 'Failed to sync ORCID profile')
      }
    } catch (error) {
      logger.error('Failed to sync ORCID:', error)
      setError('Failed to sync ORCID profile')
    } finally {
      setLoading(false)
    }
  }

  const searchCrossRef = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/external-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search-crossref',
          query: searchQuery,
          filters: {
            hasAbstract: true,
            publishedAfter: '2020-01-01'
          },
          rows: 20
        })
      })

      const data = await response.json()

      if (data.success) {
        setCrossRefResults(data.data.items || [])
      } else {
        setError(data.error || 'CrossRef search failed')
      }
    } catch (error) {
      logger.error('Failed to search CrossRef:', error)
      setError('CrossRef search failed')
    } finally {
      setLoading(false)
    }
  }

  const searchPubMed = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/external-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search-pubmed',
          query: searchQuery,
          filters: {
            hasAbstract: true,
            publicationDateStart: '2020/01/01',
            sortBy: 'relevance'
          },
          retmax: 20
        })
      })

      const data = await response.json()

      if (data.success) {
        setPubMedResults(data.data.articles || [])
      } else {
        setError(data.error || 'PubMed search failed')
      }
    } catch (error) {
      logger.error('Failed to search PubMed:', error)
      setError('PubMed search failed')
    } finally {
      setLoading(false)
    }
  }

  const registerDOI = async () => {
    if (!manuscriptId) return

    try {
      setLoading(true)
      setError(null)

      // This would typically require manuscript metadata
      const response = await fetch('/api/external-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register-doi',
          manuscriptId,
          metadata: {
            title: 'Sample Manuscript Title',
            authors: [
              {
                givenName: 'John',
                familyName: 'Doe',
                orcid: orcidProfile?.orcidId
              }
            ],
            abstract: 'Sample abstract...',
            publicationDate: new Date().toISOString().split('T')[0],
            keywords: ['research', 'science']
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setDOIStatus({
          doi: data.data.doi,
          status: 'registered',
          registeredAt: new Date().toISOString()
        })
      } else {
        setError(data.error || 'DOI registration failed')
      }
    } catch (error) {
      logger.error('Failed to register DOI:', error)
      setError('DOI registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            External Academic Integrations
          </CardTitle>
          <CardDescription>
            Connect with ORCID, CrossRef, DOI, and PubMed for enhanced research capabilities
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="orcid" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orcid">ORCID Profile</TabsTrigger>
          <TabsTrigger value="search">Academic Search</TabsTrigger>
          <TabsTrigger value="doi">DOI Management</TabsTrigger>
          <TabsTrigger value="citations">Citation Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="orcid" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ORCID Integration
                {orcidConnected ? (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your ORCID account to sync your academic profile and publications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!orcidConnected ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Connect ORCID Account</h3>
                  <p className="text-muted-foreground mb-6">
                    Link your ORCID profile to automatically sync your publications and academic information
                  </p>
                  <Button onClick={connectORCID} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect ORCID
                  </Button>
                </div>
              ) : orcidProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{orcidProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ORCID ID: {orcidProfile.orcidId}
                      </p>
                      {orcidProfile.affiliation && (
                        <p className="text-sm text-muted-foreground">
                          {orcidProfile.affiliation}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" onClick={syncORCID} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Profile
                    </Button>
                  </div>

                  {orcidProfile.biography && (
                    <div>
                      <h4 className="font-medium mb-2">Biography</h4>
                      <p className="text-sm text-muted-foreground">{orcidProfile.biography}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-3">Recent Publications</h4>
                    <div className="space-y-3">
                      {orcidProfile.works.slice(0, 5).map((work, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm">{work.title}</h5>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {work.journal && <span>{work.journal}</span>}
                            <span>•</span>
                            <span>{work.year}</span>
                            {work.doi && (
                              <>
                                <span>•</span>
                                <a 
                                  href={`https://doi.org/${work.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  DOI
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orcidProfile.employments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Employment</h4>
                      <div className="space-y-2">
                        {orcidProfile.employments.slice(0, 3).map((employment, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{employment.role}</span>
                            <span className="text-muted-foreground"> at {employment.institution}</span>
                            <span className="text-muted-foreground">
                              {' '}({employment.startYear}{employment.endYear ? `-${employment.endYear}` : '-present'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading ORCID profile...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Academic Database Search
              </CardTitle>
              <CardDescription>
                Search CrossRef and PubMed databases for related research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-query">Search Query</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="search-query"
                      placeholder="Enter keywords, authors, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={searchCrossRef} disabled={loading || !searchQuery.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      CrossRef
                    </Button>
                    <Button onClick={searchPubMed} disabled={loading || !searchQuery.trim()} variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      PubMed
                    </Button>
                  </div>
                </div>
              </div>

              {crossRefResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">CrossRef Results</h4>
                  <div className="space-y-3">
                    {crossRefResults.map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <h5 className="font-medium text-sm mb-1">{result.title}</h5>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{result.authors.slice(0, 3).join(', ')}</span>
                          {result.authors.length > 3 && <span>et al.</span>}
                          <span>•</span>
                          <span>{result.journal}</span>
                          <span>•</span>
                          <span>{new Date(result.publishedDate).getFullYear()}</span>
                          {result.similarity && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary">{result.similarity}% similar</Badge>
                            </>
                          )}
                        </div>
                        {result.abstract && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {result.abstract.substring(0, 200)}...
                          </p>
                        )}
                        <a 
                          href={`https://doi.org/${result.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Full Paper
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pubMedResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">PubMed Results</h4>
                  <div className="space-y-3">
                    {pubMedResults.map((result) => (
                      <div key={result.pmid} className="p-4 border rounded-lg">
                        <h5 className="font-medium text-sm mb-1">{result.title}</h5>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{result.authors.slice(0, 3).join(', ')}</span>
                          {result.authors.length > 3 && <span>et al.</span>}
                          <span>•</span>
                          <span>{result.journal}</span>
                          <span>•</span>
                          <span>{new Date(result.publishedDate).getFullYear()}</span>
                          <span>•</span>
                          <span>PMID: {result.pmid}</span>
                        </div>
                        {result.abstract && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {result.abstract.substring(0, 200)}...
                          </p>
                        )}
                        <div className="flex gap-2">
                          <a 
                            href={`https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            PubMed
                          </a>
                          {result.doi && (
                            <a 
                              href={`https://doi.org/${result.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              DOI
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                DOI Management
              </CardTitle>
              <CardDescription>
                Register and manage Digital Object Identifiers for your manuscripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {manuscriptId ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">DOI Status</h4>
                      <Badge 
                        variant={
                          doiStatus.status === 'registered' ? 'default' :
                          doiStatus.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {doiStatus.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    {doiStatus.doi ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">DOI:</span>
                          <a 
                            href={`https://doi.org/${doiStatus.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-mono"
                          >
                            {doiStatus.doi}
                          </a>
                          <ExternalLink className="h-3 w-3 text-blue-600" />
                        </div>
                        {doiStatus.registeredAt && (
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(doiStatus.registeredAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          No DOI registered for this manuscript
                        </p>
                        <Button onClick={registerDOI} disabled={loading}>
                          {loading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Link className="h-4 w-4 mr-2" />
                          )}
                          Register DOI
                        </Button>
                      </div>
                    )}
                  </div>

                  {doiStatus.status === 'registered' && (
                    <div className="space-y-4">
                      <h4 className="font-medium">DOI Services</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Download Citation
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Metadata
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Manuscript Selected</h3>
                  <p className="text-muted-foreground">
                    Select a manuscript to manage its DOI registration
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Citation Network Analysis
              </CardTitle>
              <CardDescription>
                Analyze citation networks and research impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Citation Analysis</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive citation network analysis and impact metrics coming soon
                </p>
                <Button variant="outline" disabled>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze Citations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ExternalIntegrationsDashboard
