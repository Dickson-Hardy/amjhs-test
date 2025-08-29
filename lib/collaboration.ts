/**
 * Real-time Collaboration System
 * Provides live collaborative editing, comments, and version control
 */

import { sql } from '@vercel/postgres'
import { logger } from './logger'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Types for collaboration system
export interface CollaborationSession {
  id: string
  manuscriptId: string
  title: string
  participants: Participant[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  userId: string
  userName: string
  userAvatar?: string
  role: 'owner' | 'editor' | 'reviewer' | 'viewer'
  joinedAt: Date
  lastActivity: Date
  isOnline: boolean
  cursor?: CursorPosition
  selection?: TextSelection
}

export interface CursorPosition {
  line: number
  column: number
  sectionId: string
}

export interface TextSelection {
  start: CursorPosition
  end: CursorPosition
  text: string
}

export interface CollaborativeEdit {
  id: string
  sessionId: string
  userId: string
  operation: EditOperation
  timestamp: Date
  appliedAt?: Date
  reverted?: boolean
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace' | 'format'
  position: CursorPosition
  content?: string
  oldContent?: string
  length?: number
  formatting?: TextFormatting
}

export interface TextFormatting {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  backgroundColor?: string
  fontSize?: number
  fontFamily?: string
}

export interface Comment {
  id: string
  sessionId: string
  manuscriptId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  position: CursorPosition
  selection?: TextSelection
  isResolved: boolean
  replies: CommentReply[]
  createdAt: Date
  updatedAt: Date
}

export interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: Date
}

export interface VersionSnapshot {
  id: string
  sessionId: string
  manuscriptId: string
  content: string
  title: string
  abstract: string
  version: number
  authorId: string
  authorName: string
  changesSummary: string
  createdAt: Date
}

export interface ConflictResolution {
  id: string
  sessionId: string
  conflictingEdits: CollaborativeEdit[]
  resolvedBy: string
  resolution: 'accept_all' | 'reject_all' | 'merge' | 'manual'
  finalContent: string
  createdAt: Date
}

/**
 * Real-time Collaboration Service
 */
export class CollaborationService {
  private static io: SocketIOServer | null = null
  private static activeSessions = new Map<string, CollaborationSession>()
  private static userSockets = new Map<string, string[]>() // userId -> socketIds

  /**
   * Initialize WebSocket server
   */
  static initializeWebSocket(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL",
        methods: ["GET", "POST"]
      }
    })

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          const { userId, sessionId } = data
          socket.userId = userId
          socket.sessionId = sessionId

          // Add user to session
          await this.addUserToSession(sessionId, userId, socket.id)
          
          // Notify other participants
          socket.to(sessionId).emit('user_joined', {
            userId,
            socketId: socket.id,
            timestamp: new Date()
          })

          socket.join(sessionId)
          logger.info(`User ${userId} joined session ${sessionId}`)
        } catch (error) {
          logger.error('Authentication error:', error)
          socket.emit('error', { message: 'Authentication failed' })
        }
      })

      // Handle real-time editing
      socket.on('edit_operation', async (data) => {
        try {
          await this.handleEditOperation(socket, data)
        } catch (error) {
          logger.error('Edit operation error:', error)
          socket.emit('error', { message: 'Failed to process edit operation' })
        }
      })

      // Handle cursor movement
      socket.on('cursor_move', (data) => {
        socket.to(socket.sessionId).emit('cursor_update', {
          userId: socket.userId,
          cursor: data.cursor,
          timestamp: new Date()
        })
      })

      // Handle text selection
      socket.on('text_select', (data) => {
        socket.to(socket.sessionId).emit('selection_update', {
          userId: socket.userId,
          selection: data.selection,
          timestamp: new Date()
        })
      })

      // Handle comments
      socket.on('add_comment', async (data) => {
        try {
          const comment = await this.addComment(socket.sessionId, socket.userId, data)
          this.io!.to(socket.sessionId).emit('comment_added', comment)
        } catch (error) {
          logger.error('Add comment error:', error)
          socket.emit('error', { message: 'Failed to add comment' })
        }
      })

      socket.on('reply_comment', async (data) => {
        try {
          const reply = await this.addCommentReply(data.commentId, socket.userId, data.content)
          this.io!.to(socket.sessionId).emit('comment_reply_added', {
            commentId: data.commentId,
            reply
          })
        } catch (error) {
          logger.error('Reply comment error:', error)
          socket.emit('error', { message: 'Failed to add reply' })
        }
      })

      socket.on('resolve_comment', async (data) => {
        try {
          await this.resolveComment(data.commentId, socket.userId)
          this.io!.to(socket.sessionId).emit('comment_resolved', {
            commentId: data.commentId,
            resolvedBy: socket.userId,
            timestamp: new Date()
          })
        } catch (error) {
          logger.error('Resolve comment error:', error)
          socket.emit('error', { message: 'Failed to resolve comment' })
        }
      })

      // Handle version control
      socket.on('create_snapshot', async (data) => {
        try {
          const snapshot = await this.createVersionSnapshot(
            socket.sessionId,
            socket.userId,
            data
          )
          this.io!.to(socket.sessionId).emit('snapshot_created', snapshot)
        } catch (error) {
          logger.error('Create snapshot error:', error)
          socket.emit('error', { message: 'Failed to create snapshot' })
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          if (socket.userId && socket.sessionId) {
            await this.removeUserFromSession(socket.sessionId, socket.userId, socket.id)
            socket.to(socket.sessionId).emit('user_left', {
              userId: socket.userId,
              timestamp: new Date()
            })
          }
          logger.info(`Client disconnected: ${socket.id}`)
        } catch (error) {
          logger.error('Disconnect error:', error)
        }
      })
    })
  }

  /**
   * Create a new collaboration session
   */
  static async createSession(
    manuscriptId: string,
    title: string,
    ownerId: string
  ): Promise<CollaborationSession> {
    try {
      const { rows } = await sql`
        INSERT INTO collaboration_sessions (
          manuscript_id, title, owner_id, is_active, created_at, updated_at
        ) VALUES (
          ${manuscriptId}, ${title}, ${ownerId}, true, NOW(), NOW()
        )
        RETURNING *
      `

      const session = this.mapSessionFromDB(rows[0])
      this.activeSessions.set(session.id, session)

      logger.info(`Collaboration session created: ${session.id}`)
      return session
    } catch (error) {
      logger.error('Error creating collaboration session:', error)
      throw new AppError('Failed to create collaboration session')
    }
  }

  /**
   * Join a collaboration session
   */
  static async joinSession(
    sessionId: string,
    userId: string,
    role: 'editor' | 'reviewer' | 'viewer' = 'viewer'
  ): Promise<CollaborationSession> {
    try {
      // Check if session exists and is active
      const { rows: sessionRows } = await sql`
        SELECT * FROM collaboration_sessions 
        WHERE id = ${sessionId} AND is_active = true
      `

      if (sessionRows.length === 0) {
        throw new NotFoundError('Session not found or inactive')
      }

      // Add participant
      await sql`
        INSERT INTO collaboration_participants (
          session_id, user_id, role, joined_at, last_activity, is_online
        ) VALUES (
          ${sessionId}, ${userId}, ${role}, NOW(), NOW(), true
        )
        ON CONFLICT (session_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          last_activity = NOW(),
          is_online = true
      `

      // Get updated session with participants
      const session = await this.getSession(sessionId)
      this.activeSessions.set(sessionId, session)

      return session
    } catch (error) {
      logger.error('Error joining collaboration session:', error)
      throw new AppError('Failed to join collaboration session')
    }
  }

  /**
   * Get collaboration session with participants
   */
  static async getSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const { rows: sessionRows } = await sql`
        SELECT * FROM collaboration_sessions WHERE id = ${sessionId}
      `

      if (sessionRows.length === 0) {
        throw new NotFoundError('Session not found')
      }

      const { rows: participantRows } = await sql`
        SELECT cp.*, u.name as user_name, u.avatar_url as user_avatar
        FROM collaboration_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.session_id = ${sessionId}
        ORDER BY cp.joined_at
      `

      const session = this.mapSessionFromDB(sessionRows[0])
      session.participants = participantRows.map(this.mapParticipantFromDB)

      return session
    } catch (error) {
      logger.error('Error getting collaboration session:', error)
      throw new AppError('Failed to get collaboration session')
    }
  }

  /**
   * Handle edit operation with conflict resolution
   */
  private static async handleEditOperation(socket: unknown, data: any): Promise<void> {
    const { operation, clientTimestamp } = data
    const sessionId = socket.sessionId
    const userId = socket.userId

    // Store the edit operation
    const edit = await this.storeEditOperation(sessionId, userId, operation)

    // Check for conflicts
    const conflicts = await this.detectConflicts(edit, clientTimestamp)

    if (conflicts.length > 0) {
      // Handle conflicts
      const resolution = await this.resolveConflicts(sessionId, userId, conflicts)
      socket.emit('conflict_resolved', resolution)
    }

    // Broadcast the edit to other participants
    socket.to(sessionId).emit('edit_applied', {
      editId: edit.id,
      userId,
      operation,
      timestamp: edit.timestamp
    })

    // Update last activity
    await this.updateLastActivity(sessionId, userId)
  }

  /**
   * Store edit operation in database
   */
  private static async storeEditOperation(
    sessionId: string,
    userId: string,
    operation: EditOperation
  ): Promise<CollaborativeEdit> {
    const { rows } = await sql`
      INSERT INTO collaborative_edits (
        session_id, user_id, operation, timestamp
      ) VALUES (
        ${sessionId}, ${userId}, ${JSON.stringify(operation)}, NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      sessionId: rows[0].session_id,
      userId: rows[0].user_id,
      operation: rows[0].operation,
      timestamp: rows[0].timestamp,
      appliedAt: rows[0].applied_at,
      reverted: rows[0].reverted
    }
  }

  /**
   * Detect editing conflicts
   */
  private static async detectConflicts(
    edit: CollaborativeEdit,
    clientTimestamp: Date
  ): Promise<CollaborativeEdit[]> {
    // Get recent edits from other users that might conflict
    const { rows } = await sql`
      SELECT * FROM collaborative_edits
      WHERE session_id = ${edit.sessionId}
        AND user_id != ${edit.userId}
        AND timestamp > ${clientTimestamp}
        AND reverted = false
      ORDER BY timestamp ASC
    `

    const conflicts: CollaborativeEdit[] = []

    for (const row of rows) {
      const otherEdit = {
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        operation: row.operation,
        timestamp: row.timestamp,
        appliedAt: row.applied_at,
        reverted: row.reverted
      }

      // Check if operations conflict (same position or overlapping)
      if (this.operationsConflict(edit.operation, otherEdit.operation)) {
        conflicts.push(otherEdit)
      }
    }

    return conflicts
  }

  /**
   * Check if two operations conflict
   */
  private static operationsConflict(op1: EditOperation, op2: EditOperation): boolean {
    // Check if operations affect the same position or overlapping ranges
    const pos1 = op1.position
    const pos2 = op2.position

    // Same line and overlapping columns
    if (pos1.line === pos2.line && pos1.sectionId === pos2.sectionId) {
      const range1Start = pos1.column
      const range1End = range1Start + (op1.length || op1.content?.length || 0)
      const range2Start = pos2.column
      const range2End = range2Start + (op2.length || op2.content?.length || 0)

      return (range1Start < range2End && range2Start < range1End)
    }

    return false
  }

  /**
   * Resolve editing conflicts
   */
  private static async resolveConflicts(
    sessionId: string,
    userId: string,
    conflicts: CollaborativeEdit[]
  ): Promise<ConflictResolution> {
    // Simple last-write-wins strategy for now
    // In production, this could be more sophisticated
    const { rows } = await sql`
      INSERT INTO conflict_resolutions (
        session_id, conflicting_edits, resolved_by, resolution, created_at
      ) VALUES (
        ${sessionId}, ${JSON.stringify(conflicts.map(c => c.id))}, 
        ${userId}, 'accept_all', NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      sessionId: rows[0].session_id,
      conflictingEdits: conflicts,
      resolvedBy: rows[0].resolved_by,
      resolution: rows[0].resolution,
      finalContent: rows[0].final_content,
      createdAt: rows[0].created_at
    }
  }

  /**
   * Add comment to manuscript
   */
  private static async addComment(
    sessionId: string,
    userId: string,
    data: unknown
  ): Promise<Comment> {
    const { rows: userRows } = await sql`
      SELECT name, avatar_url FROM users WHERE id = ${userId}
    `
    const user = userRows[0]

    const { rows } = await sql`
      INSERT INTO collaboration_comments (
        session_id, manuscript_id, user_id, content, position, selection, created_at, updated_at
      ) VALUES (
        ${sessionId}, ${data.manuscriptId}, ${userId}, ${data.content},
        ${JSON.stringify(data.position)}, ${JSON.stringify(data.selection)}, NOW(), NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      sessionId: rows[0].session_id,
      manuscriptId: rows[0].manuscript_id,
      userId: rows[0].user_id,
      userName: user.name,
      userAvatar: user.avatar_url,
      content: rows[0].content,
      position: rows[0].position,
      selection: rows[0].selection,
      isResolved: rows[0].is_resolved,
      replies: [],
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at
    }
  }

  /**
   * Add reply to comment
   */
  private static async addCommentReply(
    commentId: string,
    userId: string,
    content: string
  ): Promise<CommentReply> {
    const { rows: userRows } = await sql`
      SELECT name, avatar_url FROM users WHERE id = ${userId}
    `
    const user = userRows[0]

    const { rows } = await sql`
      INSERT INTO comment_replies (
        comment_id, user_id, content, created_at
      ) VALUES (
        ${commentId}, ${userId}, ${content}, NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      userId: rows[0].user_id,
      userName: user.name,
      userAvatar: user.avatar_url,
      content: rows[0].content,
      createdAt: rows[0].created_at
    }
  }

  /**
   * Resolve comment
   */
  private static async resolveComment(commentId: string, userId: string): Promise<void> {
    await sql`
      UPDATE collaboration_comments 
      SET is_resolved = true, resolved_by = ${userId}, resolved_at = NOW()
      WHERE id = ${commentId}
    `
  }

  /**
   * Create version snapshot
   */
  private static async createVersionSnapshot(
    sessionId: string,
    userId: string,
    data: unknown
  ): Promise<VersionSnapshot> {
    const { rows: userRows } = await sql`
      SELECT name FROM users WHERE id = ${userId}
    `
    const user = userRows[0]

    // Get current version number
    const { rows: versionRows } = await sql`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version
      FROM version_snapshots WHERE session_id = ${sessionId}
    `
    const nextVersion = versionRows[0].next_version

    const { rows } = await sql`
      INSERT INTO version_snapshots (
        session_id, manuscript_id, content, title, abstract, version,
        author_id, author_name, changes_summary, created_at
      ) VALUES (
        ${sessionId}, ${data.manuscriptId}, ${data.content}, ${data.title},
        ${data.abstract}, ${nextVersion}, ${userId}, ${user.name},
        ${data.changesSummary}, NOW()
      )
      RETURNING *
    `

    return {
      id: rows[0].id,
      sessionId: rows[0].session_id,
      manuscriptId: rows[0].manuscript_id,
      content: rows[0].content,
      title: rows[0].title,
      abstract: rows[0].abstract,
      version: rows[0].version,
      authorId: rows[0].author_id,
      authorName: rows[0].author_name,
      changesSummary: rows[0].changes_summary,
      createdAt: rows[0].created_at
    }
  }

  /**
   * Get version history for session
   */
  static async getVersionHistory(sessionId: string): Promise<VersionSnapshot[]> {
    const { rows } = await sql`
      SELECT * FROM version_snapshots
      WHERE session_id = ${sessionId}
      ORDER BY version DESC
    `

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      manuscriptId: row.manuscript_id,
      content: row.content,
      title: row.title,
      abstract: row.abstract,
      version: row.version,
      authorId: row.author_id,
      authorName: row.author_name,
      changesSummary: row.changes_summary,
      createdAt: row.created_at
    }))
  }

  /**
   * Get comments for manuscript
   */
  static async getComments(sessionId: string): Promise<Comment[]> {
    const { rows } = await sql`
      SELECT cc.*, u.name as user_name, u.avatar_url as user_avatar
      FROM collaboration_comments cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.session_id = ${sessionId}
      ORDER BY cc.created_at ASC
    `

    const comments: Comment[] = []

    for (const row of rows) {
      // Get replies for each comment
      const { rows: replyRows } = await sql`
        SELECT cr.*, u.name as user_name, u.avatar_url as user_avatar
        FROM comment_replies cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.comment_id = ${row.id}
        ORDER BY cr.created_at ASC
      `

      const replies = replyRows.map(reply => ({
        id: reply.id,
        userId: reply.user_id,
        userName: reply.user_name,
        userAvatar: reply.user_avatar,
        content: reply.content,
        createdAt: reply.created_at
      }))

      comments.push({
        id: row.id,
        sessionId: row.session_id,
        manuscriptId: row.manuscript_id,
        userId: row.user_id,
        userName: row.user_name,
        userAvatar: row.user_avatar,
        content: row.content,
        position: row.position,
        selection: row.selection,
        isResolved: row.is_resolved,
        replies,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })
    }

    return comments
  }

  // Helper methods
  private static async addUserToSession(sessionId: string, userId: string, socketId: string): Promise<void> {
    // Add socket to user mapping
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, [])
    }
    this.userSockets.get(userId)!.push(socketId)

    // Update participant status
    await sql`
      UPDATE collaboration_participants 
      SET is_online = true, last_activity = NOW()
      WHERE session_id = ${sessionId} AND user_id = ${userId}
    `
  }

  private static async removeUserFromSession(sessionId: string, userId: string, socketId: string): Promise<void> {
    // Remove socket from user mapping
    const userSocketIds = this.userSockets.get(userId) || []
    const updatedSockets = userSocketIds.filter(id => id !== socketId)
    
    if (updatedSockets.length === 0) {
      this.userSockets.delete(userId)
      // Mark user as offline
      await sql`
        UPDATE collaboration_participants 
        SET is_online = false, last_activity = NOW()
        WHERE session_id = ${sessionId} AND user_id = ${userId}
      `
    } else {
      this.userSockets.set(userId, updatedSockets)
    }
  }

  private static async updateLastActivity(sessionId: string, userId: string): Promise<void> {
    await sql`
      UPDATE collaboration_participants 
      SET last_activity = NOW()
      WHERE session_id = ${sessionId} AND user_id = ${userId}
    `
  }

  private static mapSessionFromDB(row: unknown): CollaborationSession {
    return {
      id: row.id,
      manuscriptId: row.manuscript_id,
      title: row.title,
      participants: [],
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  private static mapParticipantFromDB(row: unknown): Participant {
    return {
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      role: row.role,
      joinedAt: row.joined_at,
      lastActivity: row.last_activity,
      isOnline: row.is_online,
      cursor: row.cursor_position,
      selection: row.text_selection
    }
  }

  /**
   * End collaboration session
   */
  static async endSession(sessionId: string, userId: string): Promise<void> {
    await sql`
      UPDATE collaboration_sessions 
      SET is_active = false, ended_at = NOW(), ended_by = ${userId}
      WHERE id = ${sessionId}
    `

    // Remove from active sessions
    this.activeSessions.delete(sessionId)

    // Notify all participants
    if (this.io) {
      this.io.to(sessionId).emit('session_ended', {
        sessionId,
        endedBy: userId,
        timestamp: new Date()
      })
    }
  }

  /**
   * Get active collaboration sessions for user
   */
  static async getUserSessions(userId: string): Promise<CollaborationSession[]> {
    const { rows } = await sql`
      SELECT cs.*, cp.role
      FROM collaboration_sessions cs
      JOIN collaboration_participants cp ON cs.id = cp.session_id
      WHERE cp.user_id = ${userId} AND cs.is_active = true
      ORDER BY cs.updated_at DESC
    `

    return rows.map(this.mapSessionFromDB)
  }
}

export default CollaborationService
