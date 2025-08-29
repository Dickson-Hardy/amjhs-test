"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DOIDisplayProps {
  doi?: string
  doiRegistered?: boolean
  title: string
  className?: string
}

export function DOIDisplay({ doi, doiRegistered, title, className = "" }: DOIDisplayProps) {
  const [copying, setCopying] = useState(false)

  if (!doi) return null

  const doiUrl = `https://doi.org/${doi}`
  
  const copyDOI = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(doiUrl)
      toast({
        title: "DOI Copied",
        description: "DOI link has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy DOI link",
        variant: "destructive"
      })
    } finally {
      setCopying(false)
    }
  }

  const copyBibTeX = async () => {
    try {
      // Generate simple BibTeX citation
      const year = new Date().getFullYear()
      const bibtex = `@article{${doi.replace(/[^a-zA-Z0-9]/g, '_')},
  title={${title}},
  journal={Advancing Modern Hardware & Software Journal},
  year={${year}},
  doi={${doi}},
  url={${doiUrl}}
}`
      
      await navigator.clipboard.writeText(bibtex)
      toast({
        title: "BibTeX Copied",
        description: "BibTeX citation has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy BibTeX citation",
        variant: "destructive"
      })
    }
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">DOI:</span>
        <a 
          href={doiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-mono"
        >
          {doi}
        </a>
        
        {doiRegistered ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Registered
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={copyDOI}
          disabled={copying}
          className="text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          {copying ? "Copying..." : "Copy DOI"}
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={copyBibTeX}
          className="text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy BibTeX
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.open(doiUrl, '_blank')}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View on CrossRef
        </Button>
      </div>
    </div>
  )
}

interface DOIManagementProps {
  articleId: string
  currentDOI?: string
  doiRegistered?: boolean
  userRole: string
}

export function DOIManagement({ articleId, currentDOI, doiRegistered, userRole }: DOIManagementProps) {
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)

  const canManageDOI = ["admin", "editor"].includes(userRole)

  const generateAndRegisterDOI = async () => {
    if (!canManageDOI) return

    setRegistering(true)
    try {
      const response = await fetch('/api/integrations/crossref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "DOI Registered",
          description: `DOI ${result.doi} has been registered with CrossRef`,
        })
        // Refresh the page to show updated DOI
        window.location.reload()
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to register DOI",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "An error occurred while registering DOI",
        variant: "destructive"
      })
    } finally {
      setRegistering(false)
    }
  }

  const verifyDOI = async () => {
    if (!currentDOI) return

    setLoading(true)
    try {
      const response = await fetch(`/api/integrations/crossref?doi=${encodeURIComponent(currentDOI)}`)
      const result = await response.json()

      if (result.success && result.verification.exists) {
        toast({
          title: "DOI Verified",
          description: "DOI is registered and accessible in CrossRef",
        })
      } else {
        toast({
          title: "DOI Not Found",
          description: "DOI is not registered in CrossRef database",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying DOI",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canManageDOI) return null

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-medium">DOI Management</h4>
      
      {currentDOI ? (
        <div className="space-y-2">
          <DOIDisplay doi={currentDOI} doiRegistered={doiRegistered} title="Current Article" />
          
          {!doiRegistered && (
            <Button 
              onClick={generateAndRegisterDOI}
              disabled={registering}
              size="sm"
              className="w-full"
            >
              {registering ? "Registering with CrossRef..." : "Register DOI with CrossRef"}
            </Button>
          )}
          
          <Button 
            onClick={verifyDOI}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify DOI Status"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">No DOI assigned to this article.</p>
          <Button 
            onClick={generateAndRegisterDOI}
            disabled={registering}
            size="sm"
            className="w-full"
          >
            {registering ? "Generating DOI..." : "Generate & Register DOI"}
          </Button>
        </div>
      )}
    </div>
  )
}
