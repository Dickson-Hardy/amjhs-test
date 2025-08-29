/**
 * Citation Management Component
 * Provides citation extraction, validation, and formatting tools
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Search,
  FileText,
  ExternalLink,
  Copy,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface Citation {
  id: string
  type: 'journal' | 'book' | 'website' | 'conference' | 'thesis' | 'other'
  title: string
  authors: Author[]
  year?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  url?: string
}

interface Author {
  firstName: string
  lastName: string
}

interface CitationValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

interface BibliographyEntry {
  citation: Citation
  formattedText: string
  inTextCitation: string
  style: string
}

interface ReferenceAnalysis {
  totalReferences: number
  validReferences: number
  invalidReferences: number
  duplicateReferences: number
  qualityScore: number
  recommendations: string[]
}

type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'vancouver' | 'ieee'

interface CitationManagerProps {
  initialText?: string
  onCitationsChange?: (citations: Citation[]) => void
}

export default function CitationManager({ initialText = '', onCitationsChange }: CitationManagerProps) {
  const [activeTab, setActiveTab] = useState('extract')
  const [inputText, setInputText] = useState(initialText)
  const [citations, setCitations] = useState<Citation[]>([])
  const [validations, setValidations] = useState<CitationValidation[]>([])
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([])
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('apa')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Citation[]>([])

  const citationStyles = [
    { id: 'apa', name: 'APA' },
    { id: 'mla', name: 'MLA' },
    { id: 'chicago', name: 'Chicago' },
    { id: 'harvard', name: 'Harvard' },
    { id: 'vancouver', name: 'Vancouver' },
    { id: 'ieee', name: 'IEEE' }
  ]

  const handleExtractCitations = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to extract citations from')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract',
          data: { text: inputText }
        })
      })

      if (!response.ok) throw new AppError('Failed to extract citations')

      const data = await response.json()
      setCitations(data.citations)
      onCitationsChange?.(data.citations)
      
      toast.success(`Extracted ${data.citations.length} citations`)
      setActiveTab('manage')

    } catch (error) {
      logger.error('Error extracting citations:', error)
      toast.error('Failed to extract citations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateCitations = async () => {
    if (citations.length === 0) {
      toast.error('No citations to validate')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          data: { citations }
        })
      })

      if (!response.ok) throw new AppError('Failed to validate citations')

      const data = await response.json()
      setValidations(data.validations)
      
      const validCount = data.validations.filter((v: CitationValidation) => v.isValid).length
      toast.success(`Validated ${validCount}/${citations.length} citations`)

    } catch (error) {
      logger.error('Error validating citations:', error)
      toast.error('Failed to validate citations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormatCitations = async () => {
    if (citations.length === 0) {
      toast.error('No citations to format')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'format',
          data: { citations, style: selectedStyle }
        })
      })

      if (!response.ok) throw new AppError('Failed to format citations')

      const data = await response.json()
      setBibliography(data.bibliography)
      
      toast.success(`Formatted ${data.bibliography.length} citations in ${selectedStyle.toUpperCase()} style`)
      setActiveTab('bibliography')

    } catch (error) {
      logger.error('Error formatting citations:', error)
      toast.error('Failed to format citations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeCitations = async () => {
    if (citations.length === 0) {
      toast.error('No citations to analyze')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          data: { citations }
        })
      })

      if (!response.ok) throw new AppError('Failed to analyze citations')

      const data = await response.json()
      setAnalysis(data.analysis)
      
      toast.success('Citation analysis completed')
      setActiveTab('analysis')

    } catch (error) {
      logger.error('Error analyzing citations:', error)
      toast.error('Failed to analyze citations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchCitations = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/integrations/citations?action=search&query=${encodeURIComponent(searchQuery)}`)
      
      if (!response.ok) throw new AppError('Failed to search citations')

      const data = await response.json()
      setSearchResults(data.results)
      
      toast.success(`Found ${data.results.length} results`)

    } catch (error) {
      logger.error('Error searching citations:', error)
      toast.error('Failed to search citations')
    } finally {
      setIsLoading(false)
    }
  }

  const addCitationFromSearch = (citation: Citation) => {
    const newCitations = [...citations, { ...citation, id: `added-${Date.now()}` }]
    setCitations(newCitations)
    onCitationsChange?.(newCitations)
    toast.success('Citation added')
  }

  const removeCitation = (citationId: string) => {
    const newCitations = citations.filter(c => c.id !== citationId)
    setCitations(newCitations)
    onCitationsChange?.(newCitations)
    toast.success('Citation removed')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getValidationIcon = (validation: CitationValidation) => {
    if (validation.isValid && validation.warnings.length === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Citation Manager
          </CardTitle>
          <CardDescription>
            Extract, validate, and format citations from your academic text
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="extract">Extract</TabsTrigger>
          <TabsTrigger value="manage">Manage ({citations.length})</TabsTrigger>
          <TabsTrigger value="bibliography">Bibliography</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extract Citations</CardTitle>
              <CardDescription>
                Paste your article text to automatically extract citations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your article text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-48"
              />
              <Button 
                onClick={handleExtractCitations}
                disabled={isLoading || !inputText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Citations...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Extract Citations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Citations</CardTitle>
                  <CardDescription>
                    Review and validate extracted citations
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleValidateCitations}
                    disabled={isLoading || citations.length === 0}
                  >
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Validate
                  </Button>
                  <Select value={selectedStyle} onValueChange={(value: CitationStyle) => setSelectedStyle(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {citationStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleFormatCitations}
                    disabled={isLoading || citations.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Format
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {citations.map((citation, index) => {
                    const validation = validations[index]
                    return (
                      <Card key={citation.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{citation.type}</Badge>
                              {validation && getValidationIcon(validation)}
                            </div>
                            <h4 className="font-medium text-sm">{citation.title}</h4>
                            {citation.authors.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {citation.authors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}
                              </p>
                            )}
                            {citation.journal && (
                              <p className="text-xs text-muted-foreground">
                                {citation.journal} {citation.year && `(${citation.year})`}
                              </p>
                            )}
                            {citation.doi && (
                              <p className="text-xs text-blue-600">DOI: {citation.doi}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCitation(citation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                          <div className="mt-3 space-y-1">
                            {validation.errors.map((error, i) => (
                              <Alert key={i} variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                              </Alert>
                            ))}
                            {validation.warnings.map((warning, i) => (
                              <Alert key={i} className="py-2">
                                <AlertDescription className="text-xs">{warning}</AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        )}
                      </Card>
                    )
                  })}

                  {citations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No citations found. Use the Extract tab to extract citations from your text.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bibliography" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bibliography</CardTitle>
                  <CardDescription>
                    Formatted citations in {selectedStyle.toUpperCase()} style
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAnalyzeCitations}>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {bibliography.map((entry, index) => (
                    <Card key={entry.citation.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Reference {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(entry.formattedText)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm">{entry.formattedText}</p>
                        <div className="text-xs text-muted-foreground">
                          In-text: {entry.inTextCitation}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {bibliography.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No formatted bibliography available. Use the Format button in the Manage tab.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Reference Analysis</CardTitle>
                <CardDescription>
                  Quality assessment of your citations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{analysis.totalReferences}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysis.validReferences}</div>
                    <div className="text-sm text-muted-foreground">Valid</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analysis.invalidReferences}</div>
                    <div className="text-sm text-muted-foreground">Invalid</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.qualityScore}%</div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  {analysis.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Citations</CardTitle>
              <CardDescription>
                Search for citation metadata by DOI, title, or author
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter DOI, title, or author name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCitations()}
                />
                <Button 
                  onClick={handleSearchCitations}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{result.title}</h4>
                          {result.authors.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.authors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}
                            </p>
                          )}
                          {result.journal && (
                            <p className="text-xs text-muted-foreground">
                              {result.journal} {result.year && `(${result.year})`}
                            </p>
                          )}
                          {result.doi && (
                            <p className="text-xs text-blue-600">DOI: {result.doi}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addCitationFromSearch(result)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {searchResults.length === 0 && searchQuery && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
