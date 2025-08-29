import { z } from "zod"
import { DatabaseService } from "./database"
import { logger } from "./logger"
import { CacheManager } from "./cache"
import { WebSocket, WebSocketServer } from "ws"
import { IncomingMessage } from "http"

// Real-time collaboration interfaces
export interface CollaborationSession {
  id: string
  manuscriptId: string
  userId: string
  userName: string
  userRole: string
  isActive: boolean
  lastActivity: Date
  cursorPosition?: number
  selectedText?: {
    start: number
    end: number
  }
  connectionId: string
}

export interface CollaborativeEdit {
  id: string
  sessionId: string
  manuscriptId: string
  userId: string
  operation: EditOperation
  timestamp: Date
  applied: boolean
  version: number
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace' | 'format'
  position: number
  content?: string
  length?: number
  metadata?: {
    formatting?: TextFormatting
    section?: string
    field?: string
  }
}

export interface TextFormatting {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  color?: string
  highlight?: string
}

export interface Comment {
  id: string
  manuscriptId: string
  userId: string
  userName: string
  userRole: string
  content: string
  position: number
  length: number
  thread: CommentThread[]
  status: 'open' | 'resolved' | 'archived'
  createdAt: Date
  updatedAt: Date
  mentions: string[]
  attachments?: CommentAttachment[]
}

export interface CommentThread {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: Date
  edited?: boolean
  editedAt?: Date
}

export interface CommentAttachment {
  id: string
  filename: string
  fileType: string
  fileSize: number
  url: string
  uploadedAt: Date
}

export interface VersionControl {
  id: string
  manuscriptId: string
  version: number
  content: string
  changes: ChangeLog[]
  createdBy: string
  createdAt: Date
  description?: string
  isPublished: boolean
  parentVersion?: number
}

export interface ChangeLog {
  userId: string
  userName: string
  operation: EditOperation
  timestamp: Date
  description?: string
}

export interface ConflictResolution {
  id: string
  manuscriptId: string
  conflictingEdits: CollaborativeEdit[]
  resolvedBy?: string
  resolution: EditOperation
  timestamp: Date
  status: 'pending' | 'resolved' | 'rejected'
}

// WebSocket message types
export interface WSMessage {
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor' | 'presence' | 'conflict' | 'sync'
  payload: unknown
  sessionId: string
  userId: string
  timestamp: Date
}

// Validation schemas
const EditOperationSchema = z.object({
  type: z.enum(['insert', 'delete', 'replace', 'format']),
  position: z.number().min(0),
  content: z.string().optional(),
  length: z.number().min(0).optional(),
  metadata: z.object({
    formatting: z.object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional(),
      fontSize: z.number().optional(),
      color: z.string().optional(),
      highlight: z.string().optional()
    }).optional(),
    section: z.string().optional(),
    field: z.string().optional()
  }).optional()
})

const CommentSchema = z.object({
  content: z.string().min(1).max(5000),
  position: z.number().min(0),
  length: z.number().min(0),
  mentions: z.array(z.string()).optional()
})

export class RealTimeCollaborationService {
  private static instance: RealTimeCollaborationService
  private wss: WebSocketServer | null = null
  private sessions = new Map<string, CollaborationSession>()
  private connections = new Map<string, WebSocket>()
  private manuscriptSessions = new Map<string, Set<string>>() // manuscriptId -> sessionIds
  private operationalTransform = new OperationalTransform()

  private constructor() {}

  public static getInstance(): RealTimeCollaborationService {
    if (!RealTimeCollaborationService.instance) {
      RealTimeCollaborationService.instance = new RealTimeCollaborationService()
    }
    return RealTimeCollaborationService.instance
  }

  /**
   * Initialize WebSocket server for real-time collaboration
   */
  initializeWebSocketServer(server: unknown) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/collaboration'
    })

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request)
    })

    logger.info("Real-time collaboration WebSocket server initialized")
  }

  /**
   * Session Management
   */

  /**
   * Create a new collaboration session
   */
  async createSession(
    manuscriptId: string,
    userId: string,
    userName: string,
    userRole: string,
    connectionId: string
  ): Promise<CollaborationSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session: CollaborationSession = {
        id: sessionId,
        manuscriptId,
        userId,
        userName,
        userRole,
        isActive: true,
        lastActivity: new Date(),
        connectionId
      }

      // Store session in memory and cache
      this.sessions.set(sessionId, session)
      await CacheManager.set(`session:${sessionId}`, session, 3600) // 1 hour

      // Add to manuscript sessions mapping
      if (!this.manuscriptSessions.has(manuscriptId)) {
        this.manuscriptSessions.set(manuscriptId, new Set())
      }
      this.manuscriptSessions.get(manuscriptId)!.add(sessionId)

      // Save to database
      await DatabaseService.query(`
        INSERT INTO collaboration_sessions (
          id, manuscript_id, user_id, user_name, user_role, 
          is_active, last_activity, connection_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
      `, [sessionId, manuscriptId, userId, userName, userRole, connectionId])

      // Notify other collaborators
      await this.broadcastToManuscript(manuscriptId, {
        type: 'presence',
        payload: { type: 'user_joined', session },
        sessionId,
        userId,
        timestamp: new Date()
      }, sessionId)

      logger.info("Collaboration session created", { sessionId, manuscriptId, userId })

      return session
    } catch (error) {
      logger.error("Failed to create collaboration session", { error, manuscriptId, userId })
      throw new AppError("Failed to create collaboration session")
    }
  }

  /**
   * End a collaboration session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId)
      if (!session) {
        return
      }

      // Update session status
      session.isActive = false
      await DatabaseService.query(`
        UPDATE collaboration_sessions 
        SET is_active = false, ended_at = NOW() 
        WHERE id = ?
      `, [sessionId])

      // Remove from active sessions
      this.sessions.delete(sessionId)
      this.connections.delete(session.connectionId)
      
      // Remove from manuscript sessions
      const manuscriptSessions = this.manuscriptSessions.get(session.manuscriptId)
      if (manuscriptSessions) {
        manuscriptSessions.delete(sessionId)
        if (manuscriptSessions.size === 0) {
          this.manuscriptSessions.delete(session.manuscriptId)
        }
      }

      // Clean up cache
      await CacheManager.delete(`session:${sessionId}`)

      // Notify other collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'presence',
        payload: { type: 'user_left', session },
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      }, sessionId)

      logger.info("Collaboration session ended", { sessionId })
    } catch (error) {
      logger.error("Failed to end collaboration session", { error, sessionId })
    }
  }

  /**
   * Real-time Editing
   */

  /**
   * Apply collaborative edit with operational transformation
   */
  async applyEdit(
    sessionId: string,
    operation: EditOperation,
    version: number
  ): Promise<{
    success: boolean
    transformedOperation?: EditOperation
    newVersion: number
    conflicts?: ConflictResolution[]
  }> {
    try {
      const session = this.sessions.get(sessionId)
      if (!session || !session.isActive) {
        throw new ValidationError("Invalid or inactive session")
      }

      // Validate operation
      const validatedOperation = EditOperationSchema.parse(operation)

      // Get current manuscript version
      const currentVersion = await this.getCurrentVersion(session.manuscriptId)
      
      // Check for conflicts and apply operational transformation
      const transformResult = await this.operationalTransform.transform(
        validatedOperation,
        version,
        currentVersion,
        session.manuscriptId
      )

      if (!transformResult.success) {
        return {
          success: false,
          newVersion: currentVersion,
          conflicts: transformResult.conflicts
        }
      }

      // Create collaborative edit record
      const editId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const collaborativeEdit: CollaborativeEdit = {
        id: editId,
        sessionId,
        manuscriptId: session.manuscriptId,
        userId: session.userId,
        operation: transformResult.transformedOperation,
        timestamp: new Date(),
        applied: true,
        version: currentVersion + 1
      }

      // Apply edit to manuscript content
      await this.applyEditToContent(session.manuscriptId, transformResult.transformedOperation)

      // Save edit to database
      await DatabaseService.query(`
        INSERT INTO collaborative_edits (
          id, session_id, manuscript_id, user_id, operation, 
          timestamp, applied, version
        ) VALUES (?, ?, ?, ?, ?, NOW(), true, ?)
      `, [
        editId, sessionId, session.manuscriptId, session.userId,
        JSON.stringify(transformResult.transformedOperation), currentVersion + 1
      ])

      // Broadcast edit to other collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'edit',
        payload: { 
          edit: collaborativeEdit,
          operation: transformResult.transformedOperation
        },
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      }, sessionId)

      // Update session activity
      session.lastActivity = new Date()

      logger.info("Collaborative edit applied", { 
        editId, 
        sessionId, 
        operation: validatedOperation.type,
        version: currentVersion + 1
      })

      return {
        success: true,
        transformedOperation: transformResult.transformedOperation,
        newVersion: currentVersion + 1
      }
    } catch (error) {
      logger.error("Failed to apply collaborative edit", { error, sessionId })
      return {
        success: false,
        newVersion: version
      }
    }
  }

  /**
   * Comment System
   */

  /**
   * Add comment to manuscript
   */
  async addComment(
    sessionId: string,
    commentData: z.infer<typeof CommentSchema>
  ): Promise<Comment | null> {
    try {
      const session = this.sessions.get(sessionId)
      if (!session) {
        throw new ValidationError("Invalid session")
      }

      const validatedComment = CommentSchema.parse(commentData)
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const comment: Comment = {
        id: commentId,
        manuscriptId: session.manuscriptId,
        userId: session.userId,
        userName: session.userName,
        userRole: session.userRole,
        content: validatedComment.content,
        position: validatedComment.position,
        length: validatedComment.length,
        thread: [],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        mentions: validatedComment.mentions || []
      }

      // Save to database
      await DatabaseService.query(`
        INSERT INTO manuscript_comments (
          id, manuscript_id, user_id, user_name, user_role,
          content, position, length, status, created_at, updated_at, mentions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), NOW(), ?)
      `, [
        commentId, session.manuscriptId, session.userId, session.userName,
        session.userRole, validatedComment.content, validatedComment.position,
        validatedComment.length, JSON.stringify(validatedComment.mentions || [])
      ])

      // Broadcast comment to collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'comment',
        payload: { type: 'comment_added', comment },
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      })

      // Send notifications to mentioned users
      if (validatedComment.mentions && validatedComment.mentions.length > 0) {
        await this.notifyMentionedUsers(validatedComment.mentions, comment)
      }

      logger.info("Comment added", { commentId, sessionId, manuscriptId: session.manuscriptId })

      return comment
    } catch (error) {
      logger.error("Failed to add comment", { error, sessionId })
      return null
    }
  }

  /**
   * Reply to comment thread
   */
  async replyToComment(
    sessionId: string,
    commentId: string,
    replyContent: string
  ): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId)
      if (!session) {
        throw new ValidationError("Invalid session")
      }

      const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const reply: CommentThread = {
        id: replyId,
        userId: session.userId,
        userName: session.userName,
        content: replyContent,
        createdAt: new Date()
      }

      // Add reply to comment thread
      await DatabaseService.query(`
        INSERT INTO comment_threads (
          id, comment_id, user_id, user_name, content, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [replyId, commentId, session.userId, session.userName, replyContent])

      // Update comment updated_at
      await DatabaseService.query(`
        UPDATE manuscript_comments 
        SET updated_at = NOW() 
        WHERE id = ?
      `, [commentId])

      // Broadcast reply to collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'comment',
        payload: { type: 'reply_added', commentId, reply },
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      })

      logger.info("Comment reply added", { replyId, commentId, sessionId })

      return true
    } catch (error) {
      logger.error("Failed to add comment reply", { error, sessionId, commentId })
      return false
    }
  }

  /**
   * Resolve comment
   */
  async resolveComment(sessionId: string, commentId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId)
      if (!session) {
        throw new ValidationError("Invalid session")
      }

      await DatabaseService.query(`
        UPDATE manuscript_comments 
        SET status = 'resolved', updated_at = NOW() 
        WHERE id = ?
      `, [commentId])

      // Broadcast resolution to collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'comment',
        payload: { type: 'comment_resolved', commentId },
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      })

      logger.info("Comment resolved", { commentId, sessionId })

      return true
    } catch (error) {
      logger.error("Failed to resolve comment", { error, sessionId, commentId })
      return false
    }
  }

  /**
   * Version Control
   */

  /**
   * Create version snapshot
   */
  async createVersion(
    manuscriptId: string,
    userId: string,
    description?: string
  ): Promise<VersionControl | null> {
    try {
      // Get current manuscript content
      const manuscript = await DatabaseService.query(`
        SELECT content, version FROM manuscripts WHERE id = ?
      `, [manuscriptId])

      if (manuscript.length === 0) {
        throw new NotFoundError("Manuscript not found")
      }

      const currentContent = manuscript[0].content
      const currentVersion = manuscript[0].version || 0
      const newVersion = currentVersion + 1

      // Get recent changes for change log
      const recentEdits = await DatabaseService.query(`
        SELECT ce.*, u.name as user_name 
        FROM collaborative_edits ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.manuscript_id = ? AND ce.version > ?
        ORDER BY ce.timestamp DESC
      `, [manuscriptId, currentVersion - 10]) // Last 10 versions of changes

      const changes: ChangeLog[] = recentEdits.map(edit => ({
        userId: edit.user_id,
        userName: edit.user_name,
        operation: JSON.parse(edit.operation),
        timestamp: edit.timestamp,
        description: `${edit.operation.type} operation`
      }))

      const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const version: VersionControl = {
        id: versionId,
        manuscriptId,
        version: newVersion,
        content: currentContent,
        changes,
        createdBy: userId,
        createdAt: new Date(),
        description,
        isPublished: false,
        parentVersion: currentVersion > 0 ? currentVersion : undefined
      }

      // Save version to database
      await DatabaseService.query(`
        INSERT INTO manuscript_versions (
          id, manuscript_id, version, content, changes, created_by,
          created_at, description, is_published, parent_version
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, false, ?)
      `, [
        versionId, manuscriptId, newVersion, currentContent,
        JSON.stringify(changes), userId, description, version.parentVersion
      ])

      // Update manuscript version
      await DatabaseService.query(`
        UPDATE manuscripts SET version = ? WHERE id = ?
      `, [newVersion, manuscriptId])

      logger.info("Version created", { versionId, manuscriptId, version: newVersion })

      return version
    } catch (error) {
      logger.error("Failed to create version", { error, manuscriptId })
      return null
    }
  }

  /**
   * Compare versions
   */
  async compareVersions(
    manuscriptId: string,
    version1: number,
    version2: number
  ): Promise<{
    differences: Array<{
      type: 'added' | 'removed' | 'modified'
      position: number
      content: string
      length?: number
    }>
    summary: {
      additions: number
      deletions: number
      modifications: number
    }
  }> {
    try {
      const versions = await DatabaseService.query(`
        SELECT version, content FROM manuscript_versions 
        WHERE manuscript_id = ? AND version IN (?, ?)
        ORDER BY version
      `, [manuscriptId, version1, version2])

      if (versions.length !== 2) {
        throw new NotFoundError("One or both versions not found")
      }

      const content1 = versions[0].content
      const content2 = versions[1].content

      const differences = this.calculateTextDifferences(content1, content2)
      const summary = {
        additions: differences.filter(d => d.type === 'added').length,
        deletions: differences.filter(d => d.type === 'removed').length,
        modifications: differences.filter(d => d.type === 'modified').length
      }

      return { differences, summary }
    } catch (error) {
      logger.error("Failed to compare versions", { error, manuscriptId })
      return {
        differences: [],
        summary: { additions: 0, deletions: 0, modifications: 0 }
      }
    }
  }

  /**
   * WebSocket Connection Handling
   */

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.connections.set(connectionId, ws)

    logger.info("WebSocket connection established", { connectionId })

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())
        await this.handleMessage(connectionId, message)
      } catch (error) {
        logger.error("Failed to handle WebSocket message", { error, connectionId })
        this.sendError(ws, "Invalid message format")
      }
    })

    ws.on('close', () => {
      this.handleDisconnection(connectionId)
    })

    ws.on('error', (error) => {
      logger.error("WebSocket error", { error, connectionId })
      this.handleDisconnection(connectionId)
    })
  }

  private async handleMessage(connectionId: string, message: WSMessage) {
    switch (message.type) {
      case 'join':
        await this.handleJoinMessage(connectionId, message)
        break
      case 'leave':
        await this.handleLeaveMessage(connectionId, message)
        break
      case 'edit':
        await this.handleEditMessage(connectionId, message)
        break
      case 'comment':
        await this.handleCommentMessage(connectionId, message)
        break
      case 'cursor':
        await this.handleCursorMessage(connectionId, message)
        break
      case 'sync':
        await this.handleSyncMessage(connectionId, message)
        break
      default:
        logger.warn("Unknown message type", { type: message.type, connectionId })
    }
  }

  private async handleJoinMessage(connectionId: string, message: WSMessage) {
    const { manuscriptId, userId, userName, userRole } = message.payload
    
    const session = await this.createSession(
      manuscriptId, userId, userName, userRole, connectionId
    )

    const ws = this.connections.get(connectionId)
    if (ws) {
      this.sendMessage(ws, {
        type: 'join_success',
        payload: { session },
        sessionId: session.id,
        userId,
        timestamp: new Date()
      })
    }
  }

  private async handleLeaveMessage(connectionId: string, message: WSMessage) {
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    if (session) {
      await this.endSession(session.id)
    }
  }

  private async handleEditMessage(connectionId: string, message: WSMessage) {
    const { operation, version } = message.payload
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    
    if (session) {
      const result = await this.applyEdit(session.id, operation, version)
      
      const ws = this.connections.get(connectionId)
      if (ws) {
        this.sendMessage(ws, {
          type: 'edit_result',
          payload: result,
          sessionId: session.id,
          userId: session.userId,
          timestamp: new Date()
        })
      }
    }
  }

  private async handleCommentMessage(connectionId: string, message: WSMessage) {
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    
    if (session) {
      const { action, data } = message.payload
      
      switch (action) {
        case 'add':
          await this.addComment(session.id, data)
          break
        case 'reply':
          await this.replyToComment(session.id, data.commentId, data.content)
          break
        case 'resolve':
          await this.resolveComment(session.id, data.commentId)
          break
      }
    }
  }

  private async handleCursorMessage(connectionId: string, message: WSMessage) {
    const { position, selectedText } = message.payload
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    
    if (session) {
      session.cursorPosition = position
      session.selectedText = selectedText
      session.lastActivity = new Date()

      // Broadcast cursor position to other collaborators
      await this.broadcastToManuscript(session.manuscriptId, {
        type: 'cursor',
        payload: { userId: session.userId, position, selectedText },
        sessionId: session.id,
        userId: session.userId,
        timestamp: new Date()
      }, session.id)
    }
  }

  private async handleSyncMessage(connectionId: string, message: WSMessage) {
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    
    if (session) {
      // Get current manuscript state
      const manuscript = await DatabaseService.query(`
        SELECT content, version FROM manuscripts WHERE id = ?
      `, [session.manuscriptId])

      const comments = await DatabaseService.query(`
        SELECT * FROM manuscript_comments 
        WHERE manuscript_id = ? AND status != 'archived'
        ORDER BY position
      `, [session.manuscriptId])

      const activeSessions = Array.from(this.sessions.values())
        .filter(s => s.manuscriptId === session.manuscriptId && s.isActive)

      const ws = this.connections.get(connectionId)
      if (ws) {
        this.sendMessage(ws, {
          type: 'sync_response',
          payload: {
            content: manuscript[0]?.content || '',
            version: manuscript[0]?.version || 0,
            comments,
            activeSessions
          },
          sessionId: session.id,
          userId: session.userId,
          timestamp: new Date()
        })
      }
    }
  }

  private handleDisconnection(connectionId: string) {
    const session = Array.from(this.sessions.values()).find(s => s.connectionId === connectionId)
    if (session) {
      this.endSession(session.id)
    }
    
    this.connections.delete(connectionId)
    logger.info("WebSocket connection closed", { connectionId })
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error },
      sessionId: '',
      userId: '',
      timestamp: new Date()
    })
  }

  private async broadcastToManuscript(
    manuscriptId: string,
    message: WSMessage,
    excludeSessionId?: string
  ) {
    const manuscriptSessions = this.manuscriptSessions.get(manuscriptId)
    if (!manuscriptSessions) return

    for (const sessionId of manuscriptSessions) {
      if (excludeSessionId && sessionId === excludeSessionId) continue

      const session = this.sessions.get(sessionId)
      if (session && session.isActive) {
        const ws = this.connections.get(session.connectionId)
        if (ws) {
          this.sendMessage(ws, message)
        }
      }
    }
  }

  // Helper methods

  private async getCurrentVersion(manuscriptId: string): Promise<number> {
    const result = await DatabaseService.query(`
      SELECT version FROM manuscripts WHERE id = ?
    `, [manuscriptId])
    
    return result[0]?.version || 0
  }

  private async applyEditToContent(manuscriptId: string, operation: EditOperation): Promise<void> {
    const manuscript = await DatabaseService.query(`
      SELECT content FROM manuscripts WHERE id = ?
    `, [manuscriptId])

    if (manuscript.length === 0) {
      throw new NotFoundError("Manuscript not found")
    }

    let content = manuscript[0].content

    // Apply operation to content
    switch (operation.type) {
      case 'insert':
        content = content.slice(0, operation.position) + 
                 (operation.content || '') + 
                 content.slice(operation.position)
        break
      case 'delete':
        content = content.slice(0, operation.position) + 
                 content.slice(operation.position + (operation.length || 0))
        break
      case 'replace':
        content = content.slice(0, operation.position) + 
                 (operation.content || '') + 
                 content.slice(operation.position + (operation.length || 0))
        break
    }

    // Update manuscript content
    await DatabaseService.query(`
      UPDATE manuscripts 
      SET content = ?, updated_at = NOW() 
      WHERE id = ?
    `, [content, manuscriptId])
  }

  private async notifyMentionedUsers(mentions: string[], comment: Comment): Promise<void> {
    // Implementation would send notifications to mentioned users
    // This could integrate with the notification system
    for (const userId of mentions) {
      logger.info("User mentioned in comment", { userId, commentId: comment.id })
      // Send notification logic here
    }
  }

  private calculateTextDifferences(text1: string, text2: string) {
    // Simplified diff algorithm - in production, use a proper diff library
    const differences: Array<{
      type: 'added' | 'removed' | 'modified'
      position: number
      content: string
      length?: number
    }> = []

    // This is a simplified implementation
    // In production, you would use libraries like diff-match-patch

    return differences
  }
}

/**
 * Operational Transform implementation for conflict resolution
 */
class OperationalTransform {
  async transform(
    operation: EditOperation,
    originalVersion: number,
    currentVersion: number,
    manuscriptId: string
  ): Promise<{
    success: boolean
    transformedOperation: EditOperation
    conflicts?: ConflictResolution[]
  }> {
    try {
      // If versions match, no transformation needed
      if (originalVersion === currentVersion) {
        return {
          success: true,
          transformedOperation: operation
        }
      }

      // Get operations between versions
      const intermediateOps = await this.getOperationsBetweenVersions(
        manuscriptId, originalVersion, currentVersion
      )

      // Transform the operation against intermediate operations
      let transformedOp = { ...operation }
      
      for (const intermediateOp of intermediateOps) {
        transformedOp = this.transformOperation(transformedOp, intermediateOp.operation)
      }

      return {
        success: true,
        transformedOperation: transformedOp
      }
    } catch (error) {
      logger.error("Operational transform failed", { error, operation })
      return {
        success: false,
        transformedOperation: operation,
        conflicts: []
      }
    }
  }

  private async getOperationsBetweenVersions(
    manuscriptId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<CollaborativeEdit[]> {
    const operations = await DatabaseService.query(`
      SELECT * FROM collaborative_edits 
      WHERE manuscript_id = ? AND version > ? AND version <= ?
      ORDER BY version, timestamp
    `, [manuscriptId, fromVersion, toVersion])

    return operations.map(op => ({
      id: op.id,
      sessionId: op.session_id,
      manuscriptId: op.manuscript_id,
      userId: op.user_id,
      operation: JSON.parse(op.operation),
      timestamp: op.timestamp,
      applied: op.applied,
      version: op.version
    }))
  }

  private transformOperation(op1: EditOperation, op2: EditOperation): EditOperation {
    // Simplified operational transform
    // In production, implement full OT algorithm for insert/delete operations

    const transformed = { ...op1 }

    if (op2.type === 'insert' && op2.position <= op1.position) {
      // Adjust position for prior insertion
      transformed.position += op2.content?.length || 0
    } else if (op2.type === 'delete' && op2.position < op1.position) {
      // Adjust position for prior deletion
      transformed.position -= op2.length || 0
    }

    return transformed
  }
}

export const realTimeCollaborationService = RealTimeCollaborationService.getInstance()
