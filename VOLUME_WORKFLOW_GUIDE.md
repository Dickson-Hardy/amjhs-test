# Volume and Issue Management Workflow Guide
## African Medical and Health Sciences Journal (AMHSJ)

### Overview

In academic journal publishing, a **Volume** represents a collection of issues published within a single year, while an **Issue** is a specific collection of articles published together at one time. This system allows for organized, structured publication and helps readers navigate the journal's archive systematically.

---

## How Volumes Work in AMHSJ

### 1. Volume Structure
- **Volume Number**: Sequential numbering (e.g., Volume 1, Volume 2, etc.)
- **Year**: The publication year (e.g., 2025)
- **Title**: Optional descriptive title for the volume
- **Status**: Draft → Published → Archived

### 2. Issue Structure Within Volumes
- **Issue Number**: Sequential within each volume (e.g., Issue 1, Issue 2, etc.)
- **Title**: Optional thematic title
- **Articles**: Collection of accepted papers assigned to that issue
- **Publication Date**: When the issue is officially published
- **Special Issues**: Can be designated for specific themes or guest editors

---

## Publication Workflow for Volume 1

Based on your requirement to upload 6 accepted papers for Volume 1, here's the recommended workflow:

### Step 1: Create Volume 1 (if not exists)
1. Navigate to **Admin Dashboard** → **Archive Management**
2. Click **"New Volume"**
3. Set:
   - Number: `1`
   - Year: `2025`
   - Title: `Volume 1 - Inaugural Issue`
   - Description: `First volume of AMHSJ featuring foundational research`

### Step 2: Create Issue 1 within Volume 1
1. Select Volume 1
2. Click **"New Issue"**
3. Set:
   - Number: `1`
   - Title: `Inaugural Issue`
   - Description: `First published issue featuring 6 accepted papers`

### Step 3: Upload and Assign Articles
For each of the 6 accepted papers:

1. **Upload the Articles**:
   - Go to **Submissions** section
   - Mark articles as `accepted` status
   - Upload final formatted PDFs
   - Assign DOIs (automatically generated)

2. **Assign Articles to Issue**:
   - Navigate to **Archive Management** → **Issues** tab
   - Select Issue 1 of Volume 1
   - Click **"Assign Articles"**
   - Select all 6 accepted papers
   - Assign page numbers (e.g., 1-10, 11-22, 23-35, etc.)

### Step 4: Review and Publish
1. **Review Assignment**:
   - Verify all 6 articles are properly assigned
   - Check metadata (titles, authors, abstracts)
   - Confirm page numbering is sequential

2. **Publish Issue 1**:
   - Click **"Publish Issue"** button
   - This will:
     - Set issue status to `published`
     - Set all assigned articles to `published`
     - Generate publication links
     - Make articles publicly accessible

3. **Publish Volume 1**:
   - After publishing Issue 1
   - Click **"Publish Volume"** button
   - This finalizes the entire volume

---

## Generated Publication Links

Once published, the system will generate several types of links:

### 1. Volume-Level Links
```
https://yourdomain.com/archive/volume/1
https://yourdomain.com/volume/1/2025
```

### 2. Issue-Level Links
```
https://yourdomain.com/archive/volume/1/issue/1
https://yourdomain.com/volume/1/issue/1
```

### 3. Individual Article Links
```
https://yourdomain.com/article/{article-id}
https://yourdomain.com/volume/1/issue/1/article/{article-id}
```

### 4. Archive Browse Page
```
https://yourdomain.com/archive
https://yourdomain.com/archive/enhanced
```

---

## Technical Implementation Details

### Database Structure
The system uses three main tables:
- **volumes**: Stores volume metadata
- **issues**: Stores issue information linked to volumes
- **articles**: Individual papers with volume/issue assignments

### Article Assignment Process
```sql
-- Articles are assigned volume and issue numbers
UPDATE articles 
SET 
  volume = '1',
  issue = '1',
  pages = '1-10',
  published_date = NOW(),
  status = 'published'
WHERE id = 'article_id';
```

### Metadata Management
Each volume and issue can store additional metadata:
- Guest editors for special issues
- Theme descriptions
- Cover images
- Publication schedules

---

## Administrative Features

### Archive Management Dashboard
Located at `/admin/archive-management`, provides:
- Volume creation and management
- Issue organization
- Article assignment interface
- Bulk operations for multiple articles
- Publication status tracking

### Key Features:
1. **Drag-and-drop** article assignment
2. **Bulk assignment** of multiple articles
3. **Publication preview** before going live
4. **Status tracking** (draft → published → archived)
5. **Statistics dashboard** for publication metrics

---

## Best Practices for Volume 1

### 1. Content Organization
- Group related articles by theme if possible
- Ensure diverse representation of research areas
- Maintain consistent formatting across all papers

### 2. Publication Timeline
- Review all articles thoroughly before assignment
- Set a specific publication date for Issue 1
- Coordinate with authors for any final revisions

### 3. Quality Assurance
- Verify all author information is correct
- Check that abstracts and keywords are properly formatted
- Ensure DOIs are properly assigned
- Test all generated links before announcement

### 4. Communication Plan
- Draft acceptance letters with publication links
- Prepare announcement for journal website
- Notify editorial board of successful publication
- Share links with institutional repositories

---

## Next Steps for Your Client

1. **Access the Admin Dashboard**: `/admin/archive-management`
2. **Create Volume 1** if it doesn't exist
3. **Create Issue 1** within Volume 1
4. **Upload the 6 accepted papers** to the system
5. **Assign articles** to Issue 1 with proper page numbering
6. **Review everything** for accuracy
7. **Publish Issue 1** to generate public links
8. **Share the publication link** for your review
9. **Notify authors** once you approve the publication

---

## Support and Troubleshooting

### Common Issues:
- **Articles not appearing**: Check if they're marked as "accepted" status
- **Assignment errors**: Verify issue is in "draft" status before assignment
- **Publication failures**: Ensure all articles have required metadata
- **Link generation**: Allow a few minutes after publication for links to be active

### Contact Information:
For technical support with the volume publication process, contact the system administrator or refer to the detailed API documentation in the codebase.

---

*This guide provides a comprehensive overview of the volume management system in AMHSJ. The workflow is designed to be user-friendly while maintaining academic publishing standards and ensuring proper organization of scholarly content.*