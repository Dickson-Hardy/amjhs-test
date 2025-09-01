#!/usr/bin/env tsx
/**
 * Database Verification Script
 * 
 * This script:
 * 1. Tests database connection using the URL from .env
 * 2. Compares actual database schema with schema.ts definitions
 * 3. Analyzes database calls throughout the codebase
 * 4. Reports inconsistencies and potential issues
 */

import { Pool } from 'pg'
import { readFile, readdir } from 'fs/promises'
import { join, extname } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })
config({ path: '.env.local' })

interface DatabaseTable {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface SchemaAnalysis {
  tables: string[]
  columns: Record<string, string[]>
  types: Record<string, string>
  foreignKeys: Record<string, string[]>
}

interface DatabaseCall {
  file: string
  line: number
  type: 'select' | 'insert' | 'update' | 'delete' | 'schema'
  table?: string
  columns?: string[]
  operation: string
}

class DatabaseVerifier {
  private pool: Pool
  private schemaPath: string = './lib/db/schema.ts'
  private projectRoot: string = process.cwd()

  constructor() {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    
    if (!databaseUrl) {
      throw new Error('Database URL not found in environment variables')
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...')
      const client = await this.pool.connect()
      const result = await client.query('SELECT NOW() as current_time, version() as db_version')
      client.release()
      
      console.log('✅ Database connection successful!')
      console.log(`📅 Current time: ${result.rows[0].current_time}`)
      console.log(`🗄️  Database version: ${result.rows[0].db_version.split(',')[0]}`)
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
  }

  /**
   * Get actual database schema
   */
  async getDatabaseSchema(): Promise<DatabaseTable[]> {
    try {
      console.log('📊 Fetching database schema...')
      const query = `
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `
      
      const result = await this.pool.query(query)
      console.log(`✅ Found ${result.rows.length} columns across multiple tables`)
      return result.rows
    } catch (error) {
      console.error('❌ Failed to fetch database schema:', error)
      return []
    }
  }

  /**
   * Get foreign key relationships
   */
  async getForeignKeys(): Promise<Record<string, string[]>> {
    try {
      const query = `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
      `
      
      const result = await this.pool.query(query)
      const foreignKeys: Record<string, string[]> = {}
      
      for (const row of result.rows) {
        const key = `${row.table_name}.${row.column_name}`
        const reference = `${row.foreign_table_name}.${row.foreign_column_name}`
        
        if (!foreignKeys[row.table_name]) {
          foreignKeys[row.table_name] = []
        }
        foreignKeys[row.table_name].push(`${row.column_name} -> ${reference}`)
      }
      
      return foreignKeys
    } catch (error) {
      console.error('❌ Failed to fetch foreign keys:', error)
      return {}
    }
  }

  /**
   * Parse schema.ts file
   */
  async parseSchemaFile(): Promise<SchemaAnalysis> {
    try {
      console.log('📖 Parsing schema.ts file...')
      const schemaContent = await readFile(this.schemaPath, 'utf-8')
      
      const analysis: SchemaAnalysis = {
        tables: [],
        columns: {},
        types: {},
        foreignKeys: {}
      }

      // Extract table definitions
      const tableRegex = /export const (\w+) = pgTable\("(\w+)",([\s\S]*?)\)/g
      let tableMatch

      while ((tableMatch = tableRegex.exec(schemaContent)) !== null) {
        const [, variableName, tableName, tableContent] = tableMatch
        analysis.tables.push(tableName)
        analysis.columns[tableName] = []

        // Extract column definitions
        const columnRegex = /(\w+):\s*(\w+)\("(\w+)"\)([^,\n]*)/g
        let columnMatch

        while ((columnMatch = columnRegex.exec(tableContent)) !== null) {
          const [, columnName, columnType, , modifiers] = columnMatch
          analysis.columns[tableName].push(columnName)
          analysis.types[`${tableName}.${columnName}`] = `${columnType}${modifiers}`
        }
      }

      console.log(`✅ Parsed ${analysis.tables.length} tables from schema.ts`)
      return analysis
    } catch (error) {
      console.error('❌ Failed to parse schema.ts:', error)
      return { tables: [], columns: {}, types: {}, foreignKeys: {} }
    }
  }

  /**
   * Find all database calls in the codebase
   */
  async findDatabaseCalls(): Promise<DatabaseCall[]> {
    console.log('🔍 Scanning codebase for database calls...')
    const calls: DatabaseCall[] = []
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath)
          } else if (entry.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry.name))) {
            await this.scanFile(fullPath, calls)
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await scanDirectory(this.projectRoot)
    console.log(`✅ Found ${calls.length} database calls`)
    return calls
  }

  /**
   * Scan a file for database calls
   */
  private async scanFile(filePath: string, calls: DatabaseCall[]): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        
        // Look for Drizzle ORM patterns
        if (trimmedLine.includes('db.select') || trimmedLine.includes('db.insert') || 
            trimmedLine.includes('db.update') || trimmedLine.includes('db.delete')) {
          
          const operation = this.extractOperation(trimmedLine)
          const table = this.extractTableName(trimmedLine, content)
          
          calls.push({
            file: filePath.replace(this.projectRoot, ''),
            line: index + 1,
            type: this.getOperationType(trimmedLine),
            table,
            operation: operation || trimmedLine
          })
        }

        // Look for schema imports
        if (trimmedLine.includes('from "@/lib/db/schema"') || trimmedLine.includes('from "./db/schema"')) {
          calls.push({
            file: filePath.replace(this.projectRoot, ''),
            line: index + 1,
            type: 'schema',
            operation: trimmedLine
          })
        }
      })
    } catch (error) {
      // Skip files we can't read
    }
  }

  private extractOperation(line: string): string {
    return line.split('//')[0].trim()
  }

  private extractTableName(line: string, content: string): string | undefined {
    // Look for table references like .from(tableName)
    const fromMatch = line.match(/\.from\((\w+)\)/)
    if (fromMatch) {
      return fromMatch[1]
    }

    // Look for table references like .insert(tableName)
    const insertMatch = line.match(/\.insert\((\w+)\)/)
    if (insertMatch) {
      return insertMatch[1]
    }

    // Look for table references like .update(tableName)
    const updateMatch = line.match(/\.update\((\w+)\)/)
    if (updateMatch) {
      return updateMatch[1]
    }

    return undefined
  }

  private getOperationType(line: string): 'select' | 'insert' | 'update' | 'delete' | 'schema' {
    if (line.includes('.select')) return 'select'
    if (line.includes('.insert')) return 'insert'
    if (line.includes('.update')) return 'update'
    if (line.includes('.delete')) return 'delete'
    return 'schema'
  }

  /**
   * Compare database schema with schema.ts
   */
  compareSchemas(dbSchema: DatabaseTable[], codeSchema: SchemaAnalysis): void {
    console.log('\n📋 Schema Comparison Report')
    console.log('=' .repeat(50))

    // Get actual database tables
    const dbTables = [...new Set(dbSchema.map(row => row.table_name))]
    const codeTables = codeSchema.tables

    // Tables in database but not in schema.ts
    const extraDbTables = dbTables.filter(table => !codeTables.includes(table))
    if (extraDbTables.length > 0) {
      console.log(`\n⚠️  Tables in database but not in schema.ts:`)
      extraDbTables.forEach(table => console.log(`   - ${table}`))
    }

    // Tables in schema.ts but not in database
    const extraCodeTables = codeTables.filter(table => !dbTables.includes(table))
    if (extraCodeTables.length > 0) {
      console.log(`\n⚠️  Tables in schema.ts but not in database:`)
      extraCodeTables.forEach(table => console.log(`   - ${table}`))
    }

    // Check columns for common tables
    const commonTables = dbTables.filter(table => codeTables.includes(table))
    console.log(`\n✅ Common tables (${commonTables.length}):`)
    
    commonTables.forEach(tableName => {
      const dbColumns = dbSchema
        .filter(row => row.table_name === tableName)
        .map(row => row.column_name)
      
      const codeColumns = codeSchema.columns[tableName] || []
      
      const extraDbColumns = dbColumns.filter(col => !codeColumns.includes(col))
      const extraCodeColumns = codeColumns.filter(col => !dbColumns.includes(col))
      
      console.log(`\n   📊 ${tableName}:`)
      console.log(`      Database columns: ${dbColumns.length}`)
      console.log(`      Schema.ts columns: ${codeColumns.length}`)
      
      if (extraDbColumns.length > 0) {
        console.log(`      ⚠️  Extra in DB: ${extraDbColumns.join(', ')}`)
      }
      
      if (extraCodeColumns.length > 0) {
        console.log(`      ⚠️  Extra in schema.ts: ${extraCodeColumns.join(', ')}`)
      }
    })
  }

  /**
   * Analyze database usage patterns
   */
  analyzeDatabaseUsage(calls: DatabaseCall[], codeSchema: SchemaAnalysis): void {
    console.log('\n🔍 Database Usage Analysis')
    console.log('=' .repeat(50))

    // Group calls by type
    const callsByType = calls.reduce((acc, call) => {
      if (!acc[call.type]) acc[call.type] = 0
      acc[call.type]++
      return acc
    }, {} as Record<string, number>)

    console.log('\n📈 Operation counts:')
    Object.entries(callsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })

    // Find tables that are used but not defined
    const usedTables = [...new Set(calls.map(call => call.table).filter(Boolean))]
    const definedTables = codeSchema.tables
    
    const undefinedTables = usedTables.filter(table => table && !definedTables.includes(table))
    if (undefinedTables.length > 0) {
      console.log(`\n⚠️  Tables used but not defined in schema.ts:`)
      undefinedTables.forEach(table => console.log(`   - ${table}`))
    }

    // Find tables that are defined but never used
    const unusedTables = definedTables.filter(table => !usedTables.includes(table))
    if (unusedTables.length > 0) {
      console.log(`\n💡 Tables defined but not used:`)
      unusedTables.forEach(table => console.log(`   - ${table}`))
    }

    // Show files with most database calls
    const fileCallCounts = calls.reduce((acc, call) => {
      if (!acc[call.file]) acc[call.file] = 0
      acc[call.file]++
      return acc
    }, {} as Record<string, number>)

    const topFiles = Object.entries(fileCallCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    console.log(`\n📁 Files with most database calls:`)
    topFiles.forEach(([file, count]) => {
      console.log(`   ${count.toString().padStart(3)} - ${file}`)
    })
  }

  /**
   * Check for potential issues
   */
  checkForIssues(dbSchema: DatabaseTable[], calls: DatabaseCall[]): void {
    console.log('\n🚨 Potential Issues')
    console.log('=' .repeat(50))

    // Check for missing indexes on foreign keys
    const foreignKeyColumns = dbSchema.filter(row => 
      row.column_name.endsWith('_id') || row.column_name.endsWith('Id')
    )

    if (foreignKeyColumns.length > 0) {
      console.log('\n🔗 Potential foreign key columns (consider indexing):')
      foreignKeyColumns.forEach(col => {
        console.log(`   - ${col.table_name}.${col.column_name}`)
      })
    }

    // Check for large text columns without limits
    const unlimitedTextColumns = dbSchema.filter(row => 
      row.data_type === 'text' && !row.character_maximum_length
    )

    if (unlimitedTextColumns.length > 0) {
      console.log('\n📝 Unlimited text columns (consider adding limits):')
      unlimitedTextColumns.forEach(col => {
        console.log(`   - ${col.table_name}.${col.column_name}`)
      })
    }

    // Check for columns that allow null but might not need to
    const nullableColumns = dbSchema.filter(row => 
      row.is_nullable === 'YES' && 
      !row.column_name.includes('_at') && 
      !row.column_name.includes('_date') &&
      !row.column_name.startsWith('optional_')
    )

    console.log(`\n❓ Nullable columns (${nullableColumns.length} found - review if intentional)`)
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(): void {
    console.log('\n💡 Recommendations')
    console.log('=' .repeat(50))
    
    console.log(`
1. 🔄 Keep schema.ts in sync with database migrations
2. 📊 Add indexes for frequently queried columns
3. 🔒 Review nullable columns for data integrity
4. 📝 Consider adding length limits to text fields
5. 🧪 Run this script after schema changes
6. 📋 Document any intentional schema differences
7. 🔍 Review unused tables for cleanup opportunities
8. ⚡ Monitor slow queries and add appropriate indexes
`)
  }

  /**
   * Main verification process
   */
  async verify(): Promise<void> {
    console.log('🚀 Starting Database Verification...\n')

    try {
      // Test connection
      const connected = await this.testConnection()
      if (!connected) {
        process.exit(1)
      }

      // Get schemas
      const [dbSchema, codeSchema, databaseCalls] = await Promise.all([
        this.getDatabaseSchema(),
        this.parseSchemaFile(),
        this.findDatabaseCalls()
      ])

      // Get foreign keys
      const foreignKeys = await this.getForeignKeys()

      // Perform analysis
      this.compareSchemas(dbSchema, codeSchema)
      this.analyzeDatabaseUsage(databaseCalls, codeSchema)
      this.checkForIssues(dbSchema, databaseCalls)
      this.generateRecommendations()

      console.log('\n✅ Database verification completed!')

    } catch (error) {
      console.error('❌ Verification failed:', error)
      process.exit(1)
    } finally {
      await this.pool.end()
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new DatabaseVerifier()
  verifier.verify().catch(console.error)
}

export { DatabaseVerifier }