# API Documentation

## Overview

The AMHSJ API provides a comprehensive RESTful interface for managing all aspects of the academic journal platform. The API is built using Next.js API routes with TypeScript and follows REST conventions.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT-based authentication through NextAuth.js. Include the session token in requests:

```javascript
// Using fetch
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json'
  }
})

// The session is automatically handled by NextAuth in browser requests
```

## Common Response Format

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message"?: string
}

// Error Response
{
  "success": false,
  "error": string,
  "details"?: any
}
```

## Rate Limiting

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Admin users**: 5000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```typescript
{
  "name": string,
  "email": string,
  "password": string,
  "role": "author" | "reviewer" | "editor",
  "affiliation": string,
  "orcid"?: string,
  "researchInterests"?: string[],
  "expertise"?: string[]
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "User created successfully. Please verify your email.",
  "userId": string,
  "requiresApproval": boolean
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```typescript
{
  "email": string,
  "password": string
}
```

#### Verify Email
```http
GET /api/auth/verify-email?token={token}
```

#### Reset Password Request
```http
POST /api/auth/reset-password
```

**Request Body:**
```typescript
{
  "email": string
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```

**Request Body:**
```typescript
{
  "token": string,
  "newPassword": string
}
```

### Articles

#### List Articles
```http
GET /api/articles
```

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `status`: "draft" | "submitted" | "under_review" | "published"
- `category`: string
- `search`: string
- `author`: string

**Response:**
```typescript
{
  "success": true,
  "data": {
    "articles": Article[],
    "total": number,
    "page": number,
    "totalPages": number
  }
}
```

#### Get Article
```http
GET /api/articles/{id}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": string,
    "title": string,
    "abstract": string,
    "keywords": string[],
    "category": string,
    "status": string,
    "doi": string,
    "publishedDate": string,
    "authors": Author[],
    "metrics": {
      "views": number,
      "downloads": number,
      "citations": number
    }
  }
}
```

#### Create Article
```http
POST /api/articles
```

**Request Body:**
```typescript
{
  "title": string,
  "abstract": string,
  "keywords": string[],
  "category": string,
  "content": string,
  "authors": {
    "userId": string,
    "role": "primary" | "corresponding" | "co-author",
    "order": number
  }[],
  "files": {
    "type": "manuscript" | "figure" | "supplementary",
    "url": string,
    "filename": string
  }[]
}
```

#### Update Article
```http
PUT /api/articles/{id}
```

#### Delete Article
```http
DELETE /api/articles/{id}
```

### Reviews

#### List Reviews
```http
GET /api/reviews
```

**Query Parameters:**
- `articleId`: string
- `reviewerId`: string
- `status`: "pending" | "in_progress" | "completed"

#### Get Review
```http
GET /api/reviews/{id}
```

#### Create Review
```http
POST /api/reviews
```

**Request Body:**
```typescript
{
  "articleId": string,
  "reviewerId": string,
  "dueDate": string,
  "reviewType": "peer" | "editorial"
}
```

#### Submit Review
```http
POST /api/reviews/{id}/submit
```

**Request Body:**
```typescript
{
  "recommendation": "accept" | "minor_revision" | "major_revision" | "reject",
  "confidentialComments": string,
  "publicComments": string,
  "rating": {
    "novelty": number, // 1-5
    "methodology": number,
    "clarity": number,
    "significance": number
  },
  "attachments"?: string[]
}
```

#### Accept Review Assignment
```http
POST /api/reviews/{id}/accept
```

#### Decline Review Assignment
```http
POST /api/reviews/{id}/decline
```

**Request Body:**
```typescript
{
  "reason": string
}
```

### Users

#### Get Current User Profile
```http
GET /api/users/me
```

#### Update Profile
```http
PUT /api/users/me
```

**Request Body:**
```typescript
{
  "name"?: string,
  "affiliation"?: string,
  "bio"?: string,
  "expertise"?: string[],
  "researchInterests"?: string[],
  "languagesSpoken"?: string[]
}
```

#### Get User Statistics
```http
GET /api/users/me/stats
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "articlesSubmitted": number,
    "articlesPublished": number,
    "reviewsCompleted": number,
    "reviewsPending": number,
    "citationCount": number,
    "hIndex": number
  }
}
```

#### Get User Submissions
```http
GET /api/users/{id}/submissions
```

### Notifications

#### List Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `type`: string
- `read`: boolean
- `limit`: number

#### Mark Notification as Read
```http
PATCH /api/notifications/{id}/read
```

#### Mark All Notifications as Read
```http
PATCH /api/notifications/read-all
```

### Search

#### Full-text Search
```http
GET /api/search
```

**Query Parameters:**
- `q`: string (search query)
- `type`: "articles" | "users" | "all"
- `category`: string
- `dateFrom`: string (ISO date)
- `dateTo`: string (ISO date)
- `page`: number
- `limit`: number

**Response:**
```typescript
{
  "success": true,
  "data": {
    "results": SearchResult[],
    "total": number,
    "suggestions": string[],
    "facets": {
      "categories": { name: string, count: number }[],
      "authors": { name: string, count: number }[],
      "years": { year: number, count: number }[]
    }
  }
}
```

### File Management

#### Upload File
```http
POST /api/files/upload
```

**Request:** Multipart form data
- `file`: File
- `type`: "manuscript" | "figure" | "avatar" | "document"
- `articleId`?: string

**Response:**
```typescript
{
  "success": true,
  "data": {
    "url": string,
    "filename": string,
    "size": number,
    "mimeType": string
  }
}
```

#### Delete File
```http
DELETE /api/files/{fileId}
```

### Editorial Dashboard

#### Get Editorial Statistics
```http
GET /api/editors/stats
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "articlesUnderReview": number,
    "reviewsOverdue": number,
    "averageReviewTime": number,
    "submissionsThisMonth": number,
    "acceptanceRate": number
  }
}
```

#### Get Reviewer Pool
```http
GET /api/editors/reviewers
```

**Query Parameters:**
- `expertise`: string
- `availability`: "available" | "busy" | "unavailable"
- `workload`: "low" | "medium" | "high"

#### Assign Reviewer
```http
POST /api/editors/assign-reviewer
```

**Request Body:**
```typescript
{
  "articleId": string,
  "reviewerId": string,
  "dueDate": string,
  "message"?: string
}
```

### Admin Endpoints

#### Get Platform Statistics
```http
GET /api/admin/stats
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalUsers": number,
    "totalArticles": number,
    "totalReviews": number,
    "monthlyGrowth": {
      "users": number,
      "articles": number,
      "reviews": number
    },
    "systemHealth": {
      "database": "healthy" | "degraded" | "down",
      "redis": "healthy" | "degraded" | "down",
      "email": "healthy" | "degraded" | "down"
    }
  }
}
```

#### Manage Users
```http
GET /api/admin/users
PUT /api/admin/users/{id}
DELETE /api/admin/users/{id}
```

#### Manage Applications
```http
GET /api/admin/applications
POST /api/admin/applications/{id}/approve
POST /api/admin/applications/{id}/reject
```

#### SEO Management
```http
GET /api/admin/seo?page={page}
PUT /api/admin/seo
```

### Integrations

#### Generate DOI (CrossRef)
```http
POST /api/integrations/crossref
```

**Request Body:**
```typescript
{
  "articleId": string,
  "metadata": {
    "title": string,
    "authors": string[],
    "volume": string,
    "issue": string,
    "pages": string,
    "year": string
  }
}
```

#### ORCID Integration
```http
GET /api/integrations/orcid
POST /api/integrations/orcid/connect
DELETE /api/integrations/orcid/disconnect
```

#### Plagiarism Check
```http
POST /api/integrations/plagiarism
```

**Request Body:**
```typescript
{
  "text": string,
  "articleId": string
}
```

### Health Check

#### System Health
```http
GET /api/health
```

**Response:**
```typescript
{
  "status": "healthy" | "degraded" | "down",
  "timestamp": string,
  "uptime": number,
  "services": {
    "database": "healthy" | "unhealthy",
    "redis": "healthy" | "unhealthy",
    "email": "healthy" | "unhealthy"
  },
  "memory": {
    "used": number,
    "total": number,
    "percentage": number
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - System maintenance |

## WebSocket Events

For real-time features, the platform uses WebSocket connections:

### Connection
```javascript
const socket = io('/api/socket')
```

### Events

#### Notifications
```javascript
// Listen for new notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification)
})

// Mark notification as read
socket.emit('markNotificationRead', { notificationId })
```

#### Real-time Collaboration
```javascript
// Join document editing session
socket.emit('joinDocument', { documentId })

// Listen for document updates
socket.on('documentUpdate', (update) => {
  // Apply update to editor
})

// Send document update
socket.emit('documentUpdate', { documentId, changes })
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class AMHSJClient {
  private baseUrl: string
  private token?: string

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    }

    const response = await fetch(url, { ...options, headers })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'API request failed')
    }

    return data
  }

  // Article methods
  async getArticles(params?: any) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/articles?${query}`)
  }

  async createArticle(article: any) {
    return this.request('/api/articles', {
      method: 'POST',
      body: JSON.stringify(article)
    })
  }

  // Review methods
  async submitReview(reviewId: string, review: any) {
    return this.request(`/api/reviews/${reviewId}/submit`, {
      method: 'POST',
      body: JSON.stringify(review)
    })
  }
}

// Usage
const client = new AMHSJClient('https://api.amhsj.org', 'your-token')
const articles = await client.getArticles({ category: 'clinical-medicine' })
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class AMHSJClient:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.session = requests.Session()
        if token:
            self.session.headers.update({'Authorization': f'Bearer {token}'})
    
    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
    
    def get_articles(self, **params) -> Dict[Any, Any]:
        return self.request('/api/articles', params=params)
    
    def create_article(self, article: Dict[Any, Any]) -> Dict[Any, Any]:
        return self.request('/api/articles', method='POST', json=article)

# Usage
client = AMHSJClient('https://api.amhsj.org', 'your-token')
articles = client.get_articles(category='clinical-medicine')
```

## Postman Collection

A Postman collection is available for testing all API endpoints:

```json
{
  "info": {
    "name": "AMHSJ API",
    "description": "Complete API collection for AMHSJ platform"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{authToken}}",
        "type": "string"
      }
    ]
  }
}
```

## Changelog

### v1.2.0 (Latest)
- Added real-time collaboration endpoints
- Enhanced search with faceted search
- Added plagiarism check integration
- Improved error handling and responses

### v1.1.0
- Added WebSocket support for real-time features
- Enhanced file upload with multiple formats
- Added editorial dashboard endpoints
- Improved rate limiting

### v1.0.0
- Initial API release
- Core CRUD operations for articles, reviews, users
- Authentication and authorization
- Basic search functionality
