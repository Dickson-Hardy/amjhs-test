'use client'

import { useState } from 'react'
import { AdvancedSearch } from '@/components/advanced-search'

interface SearchFilters {
  query: string
  status: string
  category: string
  dateRange: string
  author: string
  editor: string
  reviewer: string
}

interface SearchResult {
  id: string
  title: string
  status: string
  category: string
  author: string
  submittedDate: string
  lastUpdated: string
  type: "manuscript" | "review" | "assignment"
}

export default function SearchPageClient() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (filters: SearchFilters) => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock search results based on filters
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Advanced Machine Learning Applications in Healthcare',
        status: 'under_review',
        category: 'Computer Science',
        author: 'Dr. Sarah Johnson',
        submittedDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        type: 'manuscript'
      },
      {
        id: '2',
        title: 'Quantum Computing: A Review of Current Developments',
        status: 'accepted',
        category: 'Physics',
        author: 'Prof. Michael Chen',
        submittedDate: '2023-12-10',
        lastUpdated: '2024-01-18',
        type: 'manuscript'
      },
      {
        id: '3',
        title: 'Environmental Impact Assessment of Renewable Energy',
        status: 'revision_requested',
        category: 'Environmental Science',
        author: 'Dr. Emily Rodriguez',
        submittedDate: '2024-01-05',
        lastUpdated: '2024-01-19',
        type: 'manuscript'
      }
    ]
    
    // Filter results based on search criteria
    let filteredResults = mockResults
    
    if (filters.query) {
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.author.toLowerCase().includes(filters.query.toLowerCase())
      )
    }
    
    if (filters.status) {
      filteredResults = filteredResults.filter(result => result.status === filters.status)
    }
    
    if (filters.category) {
      filteredResults = filteredResults.filter(result => result.category === filters.category)
    }
    
    if (filters.author) {
      filteredResults = filteredResults.filter(result =>
        result.author.toLowerCase().includes(filters.author.toLowerCase())
      )
    }
    
    setSearchResults(filteredResults)
    setIsLoading(false)
  }

  const handleClear = () => {
    setSearchResults([])
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
        <p className="text-gray-600">
          Search through our collection of academic articles with advanced filtering and sorting options.
        </p>
      </div>
      
      <AdvancedSearch
        onSearch={handleSearch}
        onClear={handleClear}
        results={searchResults}
        isLoading={isLoading}
        placeholder="Search manuscripts, reviews, assignments..."
        showFilters={true}
      />
    </div>
  )
}