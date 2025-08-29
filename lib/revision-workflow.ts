import { db } from "@/lib/db"
import { articles, articleVersions, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export interface RevisionSubmission {
  articleId: string
  revisedManuscript: {
    file: File
    cleanCopyFile: File | null
  }
  responseLetterFile: File
  changeTrackingDocument: File | null
  additionalFiles?: File[]
  changeLog: string
  authorNotes: string
}

export interface RevisionTrackingData {
  modifications: Array<{
    type: 'addition' | 'deletion' | 'modification'
    section: string
    lineNumber?: number
    originalText?: string
    newText?: string
    comment?: string
  }>
  summary: {
    totalChanges: number
    additionsCount: number
    deletionsCount: number
    modificationsCount: number
  }
  reviewerResponseStatus: Array<{
    reviewerComment: string
    addressed: boolean
    response: string
    pageNumber?: number
  }>
}

export class RevisionWorkflowManager {
  /**
   * Submit a revision with comprehensive tracking
   */
  async submitRevision(
    authorId: string,
    revisionData: RevisionSubmission
  ): Promise<{
    success: boolean
    versionNumber: number
    revisionId: string
    message: string
  }> {
    try {
      // Get current article and latest version
      const article = await db
        .select()
        .from(articles)
        .where(eq(articles.id, revisionData.articleId))
        .limit(1)

      if (!article.length) {
        throw new NotFoundError("Article not found")
      }

      if (article[0].authorId !== authorId) {
        throw new AuthenticationError("Unauthorized: You can only submit revisions for your own articles")
      }

      // Get latest version number
      const latestVersion = await db
        .select()
        .from(articleVersions)
        .where(eq(articleVersions.articleId, revisionData.articleId))
        .orderBy(desc(articleVersions.versionNumber))
        .limit(1)

      const newVersionNumber = latestVersion.length ? latestVersion[0].versionNumber + 1 : 1

      // Process files and create clean copies
      const processedFiles = await this.processRevisionFiles(revisionData)

      // Create new article version with comprehensive tracking
      const revisionId = uuidv4()
      await db.insert(articleVersions).values({
        id: revisionId,
        articleId: revisionData.articleId,
        versionNumber: newVersionNumber,
        title: article[0].title,
        abstract: article[0].abstract,
        content: article[0].content,
        files: processedFiles,
        changeLog: this.generateComprehensiveChangeLog(revisionData, newVersionNumber),
        createdBy: authorId,
        createdAt: new Date()
      })

      // Update article status to revision_submitted
      await db
        .update(articles)
        .set({
          status: "revision_submitted",
          updatedAt: new Date()
        })
        .where(eq(articles.id, revisionData.articleId))

      return {
        success: true,
        versionNumber: newVersionNumber,
        revisionId,
        message: `Revision v${newVersionNumber} submitted successfully with comprehensive change tracking`
      }

    } catch (error: unknown) {
      logger.error("Error submitting revision:", error)
      return {
        success: false,
        versionNumber: 0,
        revisionId: "",
        message: error.message || "Failed to submit revision"
      }
    }
  }

  /**
   * Process revision files including clean copy generation
   */
  private async processRevisionFiles(revisionData: RevisionSubmission): Promise<any[]> {
    const processedFiles: unknown[] = []

    // Main revised manuscript
    if (revisionData.revisedManuscript.file) {
      processedFiles.push({
        type: 'revised_manuscript',
        name: revisionData.revisedManuscript.file.name,
        size: revisionData.revisedManuscript.file.size,
        fileId: uuidv4(),
        url: `/files/revisions/${revisionData.articleId}/v${Date.now()}_${revisionData.revisedManuscript.file.name}`,
        hasTrackChanges: true,
        uploadedAt: new Date().toISOString()
      })
    }

    // Clean copy manuscript (without track changes)
    if (revisionData.revisedManuscript.cleanCopyFile) {
      processedFiles.push({
        type: 'clean_manuscript',
        name: revisionData.revisedManuscript.cleanCopyFile.name,
        size: revisionData.revisedManuscript.cleanCopyFile.size,
        fileId: uuidv4(),
        url: `/files/revisions/${revisionData.articleId}/clean_v${Date.now()}_${revisionData.revisedManuscript.cleanCopyFile.name}`,
        hasTrackChanges: false,
        isCleanCopy: true,
        uploadedAt: new Date().toISOString()
      })
    } else {
      // Generate clean copy warning in metadata
      processedFiles.push({
        type: 'clean_copy_notice',
        name: 'clean_copy_required.txt',
        size: 0,
        fileId: uuidv4(),
        url: null,
        hasTrackChanges: false,
        isCleanCopy: false,
        message: "Clean copy (without track changes) is required but was not provided. Please upload clean manuscript.",
        uploadedAt: new Date().toISOString()
      })
    }

    // Response letter to reviewers
    if (revisionData.responseLetterFile) {
      processedFiles.push({
        type: 'response_letter',
        name: revisionData.responseLetterFile.name,
        size: revisionData.responseLetterFile.size,
        fileId: uuidv4(),
        url: `/files/revisions/${revisionData.articleId}/response_${Date.now()}_${revisionData.responseLetterFile.name}`,
        uploadedAt: new Date().toISOString()
      })
    }

    // Change tracking document
    if (revisionData.changeTrackingDocument) {
      processedFiles.push({
        type: 'change_tracking',
        name: revisionData.changeTrackingDocument.name,
        size: revisionData.changeTrackingDocument.size,
        fileId: uuidv4(),
        url: `/files/revisions/${revisionData.articleId}/changes_${Date.now()}_${revisionData.changeTrackingDocument.name}`,
        uploadedAt: new Date().toISOString()
      })
    }

    // Additional supplementary files
    if (revisionData.additionalFiles?.length) {
      revisionData.additionalFiles.forEach((file, index) => {
        processedFiles.push({
          type: 'supplementary',
          name: file.name,
          size: file.size,
          fileId: uuidv4(),
          url: `/files/revisions/${revisionData.articleId}/supp_${index}_${Date.now()}_${file.name}`,
          uploadedAt: new Date().toISOString()
        })
      })
    }

    return processedFiles
  }

  /**
   * Generate comprehensive change log
   */
  private generateComprehensiveChangeLog(
    revisionData: RevisionSubmission,
    versionNumber: number
  ): string {
    const timestamp = new Date().toISOString()
    
    let changeLog = `# Revision Version ${versionNumber} - Change Log\n\n`
    changeLog += `**Submission Date:** ${new Date().toLocaleDateString()}\n\n`
    
    changeLog += `## 📋 Revision Summary\n`
    changeLog += `${revisionData.changeLog || 'No summary provided'}\n\n`
    
    changeLog += `## 📝 Author Notes\n`
    changeLog += `${revisionData.authorNotes || 'No additional notes provided'}\n\n`
    
    changeLog += `## 📎 Files Submitted\n`
    changeLog += `- **Revised Manuscript:** ${revisionData.revisedManuscript.file.name}\n`
    
    if (revisionData.revisedManuscript.cleanCopyFile) {
      changeLog += `- **Clean Copy Manuscript:** ${revisionData.revisedManuscript.cleanCopyFile.name} ✅\n`
    } else {
      changeLog += `- **Clean Copy Manuscript:** ⚠️ **MISSING - REQUIRED**\n`
    }
    
    changeLog += `- **Response Letter:** ${revisionData.responseLetterFile.name}\n`
    
    if (revisionData.changeTrackingDocument) {
      changeLog += `- **Change Tracking Document:** ${revisionData.changeTrackingDocument.name}\n`
    }
    
    if (revisionData.additionalFiles?.length) {
      changeLog += `- **Additional Files:** ${revisionData.additionalFiles.length} file(s)\n`
    }
    
    changeLog += `\n## 🔍 Change Tracking Requirements\n`
    changeLog += `- [${revisionData.revisedManuscript.cleanCopyFile ? '✅' : '❌'}] Clean copy manuscript (without track changes)\n`
    changeLog += `- [${revisionData.revisedManuscript.file ? '✅' : '❌'}] Revised manuscript with changes\n`
    changeLog += `- [${revisionData.responseLetterFile ? '✅' : '❌'}] Point-by-point response letter\n`
    changeLog += `- [${revisionData.changeTrackingDocument ? '✅' : '❌'}] Change tracking document\n`
    
    changeLog += `\n## ⏰ Submission Metadata\n`
    changeLog += `- **Timestamp:** ${timestamp}\n`
    changeLog += `- **Version:** ${versionNumber}\n`
    changeLog += `- **Status:** Awaiting Editorial Review\n`
    
    return changeLog
  }

  /**
   * Get revision history for an article
   */
  async getRevisionHistory(articleId: string): Promise<{
    success: boolean
    versions: Array<{
      versionNumber: number
      changeLog: string
      files: unknown[]
      createdAt: string
      createdBy: string
      authorName: string
    }>
  }> {
    try {
      const versions = await db
        .select({
          versionNumber: articleVersions.versionNumber,
          changeLog: articleVersions.changeLog,
          files: articleVersions.files,
          createdAt: articleVersions.createdAt,
          createdBy: articleVersions.createdBy,
          authorName: users.name
        })
        .from(articleVersions)
        .leftJoin(users, eq(articleVersions.createdBy, users.id))
        .where(eq(articleVersions.articleId, articleId))
        .orderBy(desc(articleVersions.versionNumber))

      return {
        success: true,
        versions: versions.map(v => ({
          versionNumber: v.versionNumber,
          changeLog: v.changeLog || '',
          files: v.files as any[] || [],
          createdAt: v.createdAt?.toISOString() || '',
          createdBy: v.createdBy || '',
          authorName: v.authorName || 'Unknown'
        }))
      }
    } catch (error: unknown) {
      logger.error("Error getting revision history:", error)
      return {
        success: false,
        versions: []
      }
    }
  }

  /**
   * Validate revision submission
   */
  validateRevisionSubmission(revisionData: RevisionSubmission): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required files validation
    if (!revisionData.revisedManuscript.file) {
      errors.push("Revised manuscript file is required")
    }

    if (!revisionData.responseLetterFile) {
      errors.push("Response letter to reviewers is required")
    }

    if (!revisionData.changeLog.trim()) {
      errors.push("Change log summary is required")
    }

    // Clean copy validation
    if (!revisionData.revisedManuscript.cleanCopyFile) {
      warnings.push("Clean copy manuscript (without track changes) is strongly recommended")
    }

    // Change tracking document validation
    if (!revisionData.changeTrackingDocument) {
      warnings.push("Change tracking document is recommended for comprehensive review")
    }

    // File format validation
    const allowedFormats = ['.pdf', '.doc', '.docx']
    if (revisionData.revisedManuscript.file) {
      const fileName = revisionData.revisedManuscript.file.name.toLowerCase()
      if (!allowedFormats.some(format => fileName.endsWith(format))) {
        errors.push("Revised manuscript must be in PDF, DOC, or DOCX format")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Generate clean copy from tracked manuscript (utility function)
   */
  async generateCleanCopyInstructions(): Promise<string> {
    return `
# How to Create a Clean Copy Manuscript

## For Microsoft Word Users:
1. Open your revised manuscript with track changes
2. Go to **Review** → **Accept** → **Accept All Changes**
3. Go to **Review** → **Delete** → **Delete All Comments**
4. Save the document with a new name (e.g., "Manuscript_Clean_Copy.docx")
5. Upload this clean version alongside your tracked version

## For Other Word Processors:
1. Accept all tracked changes and delete all comments
2. Ensure no highlighting, colored text, or change marks remain
3. Save as a clean document

## Why Clean Copies Are Required:
- Facilitates final production and typesetting
- Ensures no formatting artifacts in published version
- Provides clear, professional manuscript for publication
- Required by most academic journals for accepted manuscripts

## File Naming Convention:
- Tracked version: "Manuscript_Revised_Tracked.docx"
- Clean version: "Manuscript_Revised_Clean.docx"
    `
  }
}

export const revisionWorkflow = new RevisionWorkflowManager()
