"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Book,
  Tag,
  Upload,
  FileSpreadsheet,
  Import
} from 'lucide-react'

interface Article {
  id: string
  title: string
  category: string
  status: string
  submittedDate: string
  publishedDate?: string
  views: number
  downloads: number
  doi?: string
  volume?: string
  issue?: string
  pages?: string
  articleNumber?: number
  author: string
  authorEmail: string
}

interface CoAuthor {
  name: string
  email: string
  affiliation: string
  isCorresponding: boolean
}

interface CreateArticleForm {
  title: string
  abstract: string
  content: string
  keywords: string[]
  category: string
  authorName: string
  authorEmail: string
  coAuthors: CoAuthor[]
  status: string
  volume: string
  issue: string
  pages: string
  articleNumber: string
  doi: string
  publishedDate: string
  pdfFile: File | null
}

const ARTICLE_CATEGORIES = [
  'Clinical Research',
  'Basic Science Research', 
  'Public Health',
  'Medical Education',
  'Case Studies',
  'Review Articles',
  'Editorial',
  'Commentary',
  'Letter to Editor'
]

const ARTICLE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'submitted', label: 'Submitted', color: 'blue' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'published', label: 'Published', color: 'purple' }
]

export default function AdminArticlesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkJsonInput, setBulkJsonInput] = useState('')
  const [bulkResults, setBulkResults] = useState<any>(null)

  // Form state for article creation
  const [form, setForm] = useState<CreateArticleForm>({
    title: '',
    abstract: '',
    content: '',
    keywords: [],
    category: '',
    authorName: '',
    authorEmail: '',
    coAuthors: [],
    status: 'submitted',
    volume: '1', // Default to Volume 1 (2025)
    issue: '',
    pages: '',
    articleNumber: '',
    doi: '',
    publishedDate: '',
    pdfFile: null
  })

  const [keywordInput, setKeywordInput] = useState('')

  // Memoize router.push to prevent unnecessary re-renders
  const redirectToLogin = React.useCallback(() => {
    router.push("/auth/login")
  }, [router])

  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user || !["admin", "editor"].includes(session.user.role)) {
      redirectToLogin()
      return
    }
    
    fetchArticles()
  }, [session?.user, status, redirectToLogin])

  const fetchArticles = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const response = await fetch(`/api/admin/articles?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setArticles(data.articles)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch articles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter]) // Add dependencies for useCallback

  const handleCreateArticle = async () => {
    // Enhanced validation with detailed logging
    console.log('Form validation check:', {
      title: form.title,
      titleLength: form.title?.length || 0,
      abstract: form.abstract,
      abstractLength: form.abstract?.length || 0,
      keywords: form.keywords,
      keywordsCount: form.keywords?.length || 0,
      category: form.category,
      authorName: form.authorName,
      authorEmail: form.authorEmail,
      pdfFile: form.pdfFile,
      pdfFileType: form.pdfFile?.type,
      pdfFileSize: form.pdfFile?.size
    })

    // Required fields for direct admin upload (abstract is optional)
    if (!form.title || !form.category || !form.authorName || !form.authorEmail || !form.pdfFile) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: title, category, author name, author email, and PDF file",
        variant: "destructive"
      })
      return
    }

    // Check field length requirements
    if (form.title.length < 10) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 10 characters long",
        variant: "destructive"
      })
      return
    }

    // For direct admin uploads, abstract and keywords are optional
    // Only validate if they're provided
    if (form.abstract && form.abstract.length > 0 && form.abstract.length < 100) {
      toast({
        title: "Validation Error",
        description: "If provided, abstract must be at least 100 characters long",
        variant: "destructive"
      })
      return
    }

    if (form.pdfFile.type !== 'application/pdf') {
      toast({
        title: "Validation Error",
        description: "Please upload a valid PDF file",
        variant: "destructive"
      })
      return
    }

    try {
      setCreateLoading(true)
      
      // Create FormData to handle file upload
      const formData = new FormData()
      
      // Add all form fields
      formData.append('title', form.title)
      formData.append('abstract', form.abstract)
      formData.append('content', form.content)
      formData.append('keywords', JSON.stringify(form.keywords))
      formData.append('category', form.category)
      formData.append('authorName', form.authorName)
      formData.append('authorEmail', form.authorEmail)
      formData.append('coAuthors', JSON.stringify(form.coAuthors))
      formData.append('status', form.status)
      formData.append('volume', form.volume)
      formData.append('issue', form.issue)
      formData.append('pages', form.pages)
      formData.append('articleNumber', form.articleNumber)
      formData.append('doi', form.doi)
      if (form.publishedDate) {
        formData.append('publishedDate', new Date(form.publishedDate).toISOString())
      }
      
      // Add the PDF file
      formData.append('pdfFile', form.pdfFile)

      // Log the FormData contents for debugging
      console.log('FormData being sent:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size
          })
        } else {
          console.log(`${key}:`, value)
        }
      }

      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        body: formData // Remove Content-Type header to let browser set it with boundary
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        toast({
          title: "Success",
          description: "Article created successfully with PDF uploaded",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchArticles()
      } else {
        console.error('API Error:', data)
        toast({
          title: "Error",
          description: data.error || "Failed to create article",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Network/Parse Error:', error)
      toast({
        title: "Error",
        description: "Network error or invalid response",
        variant: "destructive"
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const resetForm = React.useCallback(() => {
    setForm({
      title: '',
      abstract: '',
      content: '',
      keywords: [],
      category: '',
      authorName: '',
      authorEmail: '',
      coAuthors: [],
      status: 'submitted',
      volume: '1',
      issue: '',
      pages: '',
      articleNumber: '',
      doi: '',
      publishedDate: '',
      pdfFile: null
    })
    setKeywordInput('')
  }, [])

  const handleBulkCreate = async () => {
    if (!bulkJsonInput.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide JSON data for bulk import",
        variant: "destructive"
      })
      return
    }

    try {
      setBulkLoading(true)
      const jsonData = JSON.parse(bulkJsonInput)

      const response = await fetch('/api/admin/articles/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      })

      const data = await response.json()

      if (data.success) {
        setBulkResults(data)
        toast({
          title: "Bulk Import Completed",
          description: `Successfully created ${data.summary.successful} out of ${data.summary.total} articles`,
        })
        fetchArticles()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create articles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error in bulk create:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse JSON or create articles",
        variant: "destructive"
      })
    } finally {
      setBulkLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/articles/bulk/template')
      const template = await response.json()
      
      const blob = new Blob([JSON.stringify(template, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-articles-template.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Template Downloaded",
        description: "Use this template to prepare your bulk article data",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive"
      })
    }
  }

  const addKeyword = React.useCallback(() => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      setForm(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }, [keywordInput, form.keywords])

  const removeKeyword = React.useCallback((keyword: string) => {
    setForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }, [])

  const addCoAuthor = React.useCallback(() => {
    setForm(prev => ({
      ...prev,
      coAuthors: [...prev.coAuthors, {
        name: '',
        email: '',
        affiliation: '',
        isCorresponding: false
      }]
    }))
  }, [])

  const updateCoAuthor = React.useCallback((index: number, field: keyof CoAuthor, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      coAuthors: prev.coAuthors.map((author, i) => 
        i === index ? { ...author, [field]: value } : author
      )
    }))
  }, [])

  const removeCoAuthor = React.useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      coAuthors: prev.coAuthors.filter((_, i) => i !== index)
    }))
  }, [])

  const getStatusBadge = React.useCallback((status: string) => {
    const statusConfig = ARTICLE_STATUSES.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.color as any || 'secondary'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }, [])

  // Memoize filtered articles to prevent unnecessary recalculations
  const filteredArticles = React.useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.author.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [articles, searchTerm, statusFilter])

  // Early return for loading state
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Article Management</h1>
          <p className="text-muted-foreground">
            Create and manage articles for AMHSJ
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Import className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Import Articles</DialogTitle>
                <DialogDescription>
                  Import multiple articles at once. Use JSON format to add multiple papers efficiently.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={downloadTemplate} variant="outline">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={() => setBulkJsonInput(JSON.stringify({
                      articles: [
                        {
                          title: "Your Article Title Here",
                          abstract: "Your comprehensive abstract describing the research methodology, key findings, and implications of the study. This should be at least 100 characters long.",
                          keywords: ["keyword1", "keyword2", "keyword3"],
                          category: "Clinical Research",
                          authorEmail: "author@institution.edu",
                          authorName: "Dr. Author Name",
                          authorAffiliation: "Institution Name",
                          status: "accepted",
                          volume: "1",
                          pages: "1-15"
                        }
                      ]
                    }, null, 2))}
                    variant="outline"
                  >
                    Load Template
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="bulkJson">JSON Data</Label>
                  <Textarea
                    id="bulkJson"
                    value={bulkJsonInput}
                    onChange={(e) => setBulkJsonInput(e.target.value)}
                    placeholder="Paste your JSON data here..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Paste your JSON data following the template format. Each article should include title, abstract, keywords, category, and author information.
                  </p>
                </div>
                
                {bulkResults && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Import Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {bulkResults.summary.successful}
                            </div>
                            <div className="text-sm text-muted-foreground">Successful</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">
                              {bulkResults.summary.failed}
                            </div>
                            <div className="text-sm text-muted-foreground">Failed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">
                              {bulkResults.summary.total}
                            </div>
                            <div className="text-sm text-muted-foreground">Total</div>
                          </div>
                        </div>
                        
                        {bulkResults.errors.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                            <ul className="space-y-1">
                              {bulkResults.errors.map((error: any, index: number) => (
                                <li key={index} className="text-sm">
                                  Article {error.index}: {error.title} - {error.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {bulkResults.createdArticles.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-green-600 mb-2">Created Articles:</h4>
                            <ul className="space-y-1">
                              {bulkResults.createdArticles.map((article: any) => (
                                <li key={article.id} className="text-sm">
                                  ✓ {article.title} (Volume {article.volume})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBulkDialogOpen(false)
                      setBulkResults(null)
                      setBulkJsonInput('')
                    }}
                  >
                    Close
                  </Button>
                  <Button onClick={handleBulkCreate} disabled={bulkLoading}>
                    {bulkLoading ? 'Importing...' : 'Import Articles'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
                <DialogDescription>
                  Add a new article directly to the journal
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="authors">Authors</TabsTrigger>
                    <TabsTrigger value="publication">Publication</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter article title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="abstract">Abstract *</Label>
                      <Textarea
                        id="abstract"
                        value={form.abstract}
                        onChange={(e) => setForm(prev => ({ ...prev, abstract: e.target.value }))}
                        placeholder="Enter article abstract (minimum 100 characters)"
                        rows={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Full Content</Label>
                      <Textarea
                        id="content"
                        value={form.content}
                        onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter full article content"
                        rows={8}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={form.category}
                        onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ARTICLE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="keywords">Keywords *</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Add keyword"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        />
                        <Button type="button" onClick={addKeyword} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="cursor-pointer"
                                 onClick={() => removeKeyword(keyword)}>
                            {keyword} ×
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum 3 keywords required. Click on keyword to remove.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="pdfFile">Article PDF *</Label>
                      <Input
                        id="pdfFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setForm(prev => ({ ...prev, pdfFile: file }))
                        }}
                        className="cursor-pointer"
                      />
                      {form.pdfFile && (
                        <p className="text-sm text-green-600 mt-1">
                          Selected: {form.pdfFile.name} ({(form.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload the full article PDF file. Maximum size: 50MB.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="authors" className="space-y-4">
                    <div>
                      <Label htmlFor="authorName">Primary Author Name *</Label>
                      <Input
                        id="authorName"
                        type="text"
                        value={form.authorName}
                        onChange={(e) => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="authorEmail">Primary Author Email *</Label>
                      <Input
                        id="authorEmail"
                        type="email"
                        value={form.authorEmail}
                        onChange={(e) => setForm(prev => ({ ...prev, authorEmail: e.target.value }))}
                        placeholder="author@institution.edu"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Co-Authors</Label>
                        <Button type="button" onClick={addCoAuthor} variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Add Co-Author
                        </Button>
                      </div>
                      
                      {form.coAuthors.map((author, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={author.name}
                                onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                                placeholder="Author Name"
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={author.email}
                                onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                                placeholder="author@email.com"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label>Affiliation</Label>
                              <Input
                                value={author.affiliation}
                                onChange={(e) => updateCoAuthor(index, 'affiliation', e.target.value)}
                                placeholder="University/Institution"
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-between">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={author.isCorresponding}
                                  onChange={(e) => updateCoAuthor(index, 'isCorresponding', e.target.checked)}
                                />
                                <span>Corresponding Author</span>
                              </label>
                              <Button
                                type="button"
                                onClick={() => removeCoAuthor(index)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="publication" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={form.status}
                          onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ARTICLE_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="volume">Volume</Label>
                        <Input
                          id="volume"
                          value={form.volume}
                          onChange={(e) => {
                            const newVolume = e.target.value
                            setForm(prev => ({ 
                              ...prev, 
                              volume: newVolume,
                              // Auto-generate DOI when volume or article number changes
                              doi: newVolume && prev.articleNumber ? 
                                `${newVolume}:${prev.articleNumber.padStart(3, '0')}` : prev.doi
                            }))
                          }}
                          placeholder="1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Volume 1 (2025) uses volume-only structure. Future volumes may include issues.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="articleNumber">Article Number</Label>
                        <Input
                          id="articleNumber"
                          value={form.articleNumber}
                          onChange={(e) => {
                            const newArticleNumber = e.target.value
                            setForm(prev => ({ 
                              ...prev, 
                              articleNumber: newArticleNumber,
                              // Auto-generate DOI when volume or article number changes
                              doi: prev.volume && newArticleNumber ? 
                                `${prev.volume}:${newArticleNumber.padStart(3, '0')}` : prev.doi
                            }))
                          }}
                          placeholder="1"
                          type="number"
                          min="1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Sequential number within the volume (e.g., 1→1:001, 2→1:002)
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issue">Issue (Optional)</Label>
                        <Input
                          id="issue"
                          value={form.issue}
                          onChange={(e) => setForm(prev => ({ ...prev, issue: e.target.value }))}
                          placeholder="Leave empty for Volume 1"
                          disabled={form.volume === '1'}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.volume === '1' 
                            ? 'Volume 1 uses sequential article numbering without issues' 
                            : 'Issue number within the volume (e.g., 1, 2, 3...)'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="pages">Pages</Label>
                        <Input
                          id="pages"
                          value={form.pages}
                          onChange={(e) => setForm(prev => ({ ...prev, pages: e.target.value }))}
                          placeholder="1-15"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="doi">DOI</Label>
                      <div className="space-y-2">
                        <Input
                          id="doi"
                          value={form.doi}
                          onChange={(e) => setForm(prev => ({ ...prev, doi: e.target.value }))}
                          placeholder="Auto-generated from volume:article number (e.g., 1:001)"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (form.volume && form.articleNumber) {
                                const generatedDOI = `${form.volume}:${form.articleNumber.padStart(3, '0')}`
                                setForm(prev => ({ ...prev, doi: generatedDOI }))
                              }
                            }}
                            disabled={!form.volume || !form.articleNumber}
                          >
                            Auto-Generate DOI
                          </Button>
                          {form.volume && form.articleNumber && (
                            <span className="text-sm text-muted-foreground">
                              Preview: {form.volume}:{form.articleNumber.padStart(3, '0')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          DOI follows pattern: volume:article_number (e.g., 1:001, 1:002, 2:001)
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="publishedDate">Published Date (for published articles)</Label>
                      <Input
                        id="publishedDate"
                        type="datetime-local"
                        value={form.publishedDate}
                        onChange={(e) => setForm(prev => ({ ...prev, publishedDate: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateArticle} disabled={createLoading}>
                    {createLoading ? 'Creating...' : 'Create Article'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search articles by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ARTICLE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchArticles} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Articles ({filteredArticles.length})</CardTitle>
          <CardDescription>
            Manage all journal articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first article for the journal
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Submitted: {new Date(article.submittedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{article.author}</div>
                        <div className="text-sm text-muted-foreground">{article.authorEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(article.status)}
                    </TableCell>
                    <TableCell>
                      {article.volume ? (
                        <div className="flex items-center gap-1">
                          <Book className="w-4 h-4" />
                          {article.volume === '1' ? (
                            <div>
                              <span>Vol. {article.volume}</span>
                              {article.doi && article.doi.includes(':') && (
                                <div className="text-xs text-muted-foreground">
                                  Article {article.doi.split(':')[1]}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>
                              Vol. {article.volume}
                              {article.issue && `, Issue ${article.issue}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{article.views} views</span>
                        <span>{article.downloads} downloads</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/article/${article.id}`, '_blank')}
                          title="View article"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // TODO: Add edit functionality
                            toast({
                              title: "Edit Article",
                              description: "Edit functionality coming soon",
                            })
                          }}
                          title="Edit article"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {article.doi && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://doi.org/${article.doi}`, '_blank')}
                            title="View DOI"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}