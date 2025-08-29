/**
 * ORCID Integration Component
 * Provides ORCID authentication and profile management
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, User, Check, X, RefreshCw, Unlink } from 'lucide-react'
import { toast } from 'sonner'

interface ORCIDProfile {
  orcidId: string
  name: {
    displayName: string
    givenNames: string
    familyName: string
  }
  biography?: string
  emails: Array<{
    email: string
    primary: boolean
    verified: boolean
  }>
  lastModified: string
}

interface User {
  orcid?: string
  orcidVerified?: boolean
  orcidProfile?: ORCIDProfile
  orcidLastSync?: string
}

export default function ORCIDIntegration({ user }: { user: User }) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleConnectORCID = async () => {
    setIsLoading(true)
    try {
      // Redirect to ORCID OAuth
      window.location.href = '/api/auth/orcid'
    } catch (error) {
      logger.error('Error connecting ORCID:', error)
      toast.error('Failed to connect ORCID')
      setIsLoading(false)
    }
  }

  const handleDisconnectORCID = async () => {
    if (!confirm('Are you sure you want to disconnect your ORCID account?')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/integrations/orcid', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new AppError('Failed to disconnect ORCID')
      }

      toast.success('ORCID account disconnected successfully')
      // Refresh the page to update the UI
      window.location.reload()
    } catch (error) {
      logger.error('Error disconnecting ORCID:', error)
      toast.error('Failed to disconnect ORCID')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleSyncProfile = async () => {
    if (!user.orcid) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/orcid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          orcidId: user.orcid,
          accessToken: user.orcidProfile?.orcidId, // This would need proper token handling
        }),
      })

      if (!response.ok) {
        throw new AppError('Failed to sync ORCID profile')
      }

      toast.success('ORCID profile synced successfully')
      window.location.reload()
    } catch (error) {
      logger.error('Error syncing ORCID:', error)
      toast.error('Failed to sync ORCID profile')
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never'
    return new Date(lastSync).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user.orcid || !user.orcidVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ORCID Integration
          </CardTitle>
          <CardDescription>
            Connect your ORCID iD to verify your identity and sync your academic profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              ORCID provides a persistent digital identifier that distinguishes you from other researchers.
              Connecting your ORCID iD helps verify your authorship and academic credentials.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleConnectORCID}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect with ORCID
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              You'll be redirected to ORCID to authorize the connection
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          ORCID Profile
          <Badge variant="secondary" className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Connected
          </Badge>
        </CardTitle>
        <CardDescription>
          Your ORCID iD is connected and verified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ORCID Profile Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">ORCID iD</div>
              <div className="text-sm text-muted-foreground">{user.orcid}</div>
            </div>
            <a
              href={`https://orcid.org/${user.orcid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {user.orcidProfile && (
            <>
              <Separator />
              <div>
                <div className="font-medium">Display Name</div>
                <div className="text-sm text-muted-foreground">
                  {user.orcidProfile.name.displayName}
                </div>
              </div>

              {user.orcidProfile.biography && (
                <div>
                  <div className="font-medium">Biography</div>
                  <div className="text-sm text-muted-foreground">
                    {user.orcidProfile.biography}
                  </div>
                </div>
              )}

              {user.orcidProfile.emails.length > 0 && (
                <div>
                  <div className="font-medium">Email Addresses</div>
                  <div className="space-y-1">
                    {user.orcidProfile.emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{email.email}</span>
                        {email.primary && (
                          <Badge variant="outline" className="text-xs">Primary</Badge>
                        )}
                        {email.verified && (
                          <Check className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Separator />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Synced</span>
            <span className="font-medium">{formatLastSync(user.orcidLastSync)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <Button
            variant="outline"
            onClick={handleSyncProfile}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Profile
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            onClick={handleDisconnectORCID}
            disabled={isDisconnecting}
            className="w-full"
          >
            {isDisconnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect ORCID
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            Your ORCID information is used to verify your authorship and enhance your academic profile.
            All data is handled according to ORCID's privacy policies.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
