# 📁 File Download Permissions for Editorial Roles

## Overview

This document describes the enhanced file download system that allows editorial assistants and associate editors to access manuscript files based on their role and workflow permissions.

## 🚀 New Features

### 1. Manuscript Download API
- **Endpoint**: `/api/manuscripts/[id]/download`
- **Methods**: GET, POST
- **Purpose**: Download manuscript files with role-based access control

### 2. Enhanced File Download Permissions
- **Endpoint**: `/api/files/[id]/download` (updated)
- **Enhancement**: Added editorial role support for accessing manuscript-related files

### 3. Workflow-Based Access Control
- **Utility**: `canUserAccessManuscript()` in `/lib/workflow.ts`
- **Purpose**: Centralized permission checking based on user role and manuscript workflow status

## 📋 Permission Matrix

| Role | Access Scope | Conditions |
|------|--------------|------------|
| **Admin** | All manuscripts | Unrestricted access |
| **Author** | Own manuscripts | Must be the manuscript author |
| **Editorial Assistant** | Queue manuscripts | Manuscripts in statuses: `submitted`, `editorial_assistant_review`, `associate_editor_assignment` |
| **Associate Editor** | Assigned manuscripts | Must be assigned as editor or have active editor assignment |
| **Managing Editor** | All manuscripts | Broad editorial oversight |
| **Editor-in-Chief** | All manuscripts | Full editorial authority |
| **Section Editor** | Section manuscripts | Access to manuscripts in their editorial sections |
| **Production Editor** | Production manuscripts | Manuscripts in statuses: `accepted`, `in_production`, `ready_for_publication` |

## 🔧 Technical Implementation

### Manuscript Download API

```typescript
// GET /api/manuscripts/[manuscriptId]/download
{
  "success": true,
  "downloadUrl": "/api/files/file123/download",
  "fileName": "manuscript-title.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "articleTitle": "Research Article Title"
}
```

### Permission Checking

```typescript
import { canUserAccessManuscript } from "@/lib/workflow"

const hasAccess = await canUserAccessManuscript(
  manuscriptId,
  userId,
  userRole
)
```

## 📚 Usage Examples

### Editorial Assistant Downloading Manuscript

```javascript
// Editorial assistant accessing manuscript in their queue
const response = await fetch('/api/manuscripts/article123/download')
const data = await response.json()

if (data.success) {
  // Download the file
  window.open(data.downloadUrl, '_blank')
}
```

### Associate Editor Accessing Assigned Manuscript

```javascript
// Associate editor downloading assigned manuscript
const response = await fetch('/api/manuscripts/article456/download', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionToken
  }
})

if (response.ok) {
  const data = await response.json()
  // Handle download...
}
```

## 🛡️ Security Features

### 1. Role-Based Access Control
- Users can only access manuscripts appropriate for their role
- Editorial assistants limited to their workflow queue
- Associate editors limited to assigned manuscripts

### 2. Workflow Status Validation
- Access is granted based on current manuscript status
- Prevents access to manuscripts outside user's workflow scope

### 3. Authentication Required
- All download requests require valid session authentication
- Unauthorized requests are rejected with 401 status

### 4. Audit Logging
- All download attempts are logged for security auditing
- Failed access attempts are tracked and reported

## 🧪 Testing

### Manual Testing

1. **Editorial Assistant Test**:
   - Login as editorial assistant
   - Navigate to manuscript in queue
   - Attempt download - should succeed

2. **Associate Editor Test**:
   - Login as associate editor
   - Access assigned manuscript
   - Attempt download - should succeed

3. **Unauthorized Access Test**:
   - Login as regular author
   - Attempt to access unowned manuscript
   - Download should be denied

### Automated Testing

```typescript
import { testManuscriptAccess } from "@/lib/test-manuscript-access"

// Run permission tests
const results = await testManuscriptAccess()
console.log("Test results:", results)
```

## 🔄 Integration with Existing System

### Enhanced Document Viewer
The `EnhancedDocumentViewer` component automatically uses the new manuscript download API:

```typescript
const handleDownload = async () => {
  const response = await fetch(`/api/manuscripts/${manuscriptId}/download`)
  // Handle download response...
}
```

### Backward Compatibility
- Existing file download functionality remains unchanged
- New editorial permissions are additive, not replacing existing access
- Published article downloads continue to work as before

## 📈 Future Enhancements

### Planned Improvements

1. **Reviewer Access**: Add support for reviewers to access assigned manuscripts
2. **Time-Limited Access**: Implement expiring download links for enhanced security
3. **Download Analytics**: Track download patterns for editorial workflow optimization
4. **Version Control**: Support downloading specific manuscript versions
5. **Bulk Downloads**: Allow downloading multiple related files at once

### Configuration Options

Future versions will include configurable access rules:

```typescript
// Example configuration
const accessConfig = {
  editorialAssistant: {
    allowedStatuses: ["submitted", "editorial_assistant_review"],
    downloadLimit: 10, // per day
    timeRestriction: "business_hours"
  },
  associateEditor: {
    allowedStatuses: ["associate_editor_review", "under_review"],
    downloadLimit: -1, // unlimited
    timeRestriction: null
  }
}
```

## 🚨 Important Notes

### For Editorial Assistants
- Can download manuscripts in their screening and assignment queue
- Access is automatically granted for manuscripts requiring editorial assistant attention
- Cannot access manuscripts outside their workflow responsibilities

### For Associate Editors
- Can download manuscripts they are assigned to review or manage
- Access is based on editor assignment records
- Must be actively assigned to access manuscript files

### For System Administrators
- Have unrestricted access to all manuscripts
- Can download files for troubleshooting and system maintenance
- Should use admin access responsibly and maintain audit trails

## 📞 Support

For technical issues or questions about file download permissions:

1. Check user role and manuscript assignment status
2. Verify manuscript is in appropriate workflow status
3. Review server logs for permission errors
4. Contact system administrator if issues persist

---

**Last Updated**: September 15, 2025  
**Version**: 1.0  
**Author**: AMHSJ Development Team