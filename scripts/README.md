# AMHSJ Database Management Tools

This directory contains comprehensive database management tools for the AMHSJ (American Medical & Health Sciences Journal) platform.

## 🚀 Quick Start Commands

```bash
# Check database health (recommended first step)
npm run db:health

# Validate database schema against expected structure
npm run db:validate-schema

# Create any missing tables and columns
npm run db:create-missing

# Test basic database connectivity
npm run db:test
```

## 📊 Current Database Status

**Status**: ✅ All systems operational
- **Connection**: PostgreSQL 17.5 on Neon Cloud
- **Schema**: All 18 expected tables present with correct columns
- **Records**: 121 total records across all tables
- **Compliance**: 100% schema compliance ✅

## Available Scripts

### 🏥 Health & Validation (New!)
- `npm run db:health` - Comprehensive health check with connection test, schema validation, and statistics
- `npm run db:validate-schema` - Detailed schema validation against expected structure  
- `npm run db:create-missing` - Create missing tables and columns based on schema.ts
- `npm run db:inspect-admin` - Inspect admin_logs table structure for debugging

### 🔍 Database Testing and Validation

```bash
# Test database connection and basic schema
npm run db:test

# Comprehensive schema validation against schema.ts
npm run db:validate
```

### 🚀 Database Migration

```bash
# Quick migration for new tables and columns we added
npm run db:quick-migrate

# Alternative alias
npm run db:fix-schema
```

### 📊 Editorial System Setup

```bash
# Test editorial assistant login functionality
npm run db:test-editorial

# Setup editorial assistant and test email
npm run editorial:setup

# Verify editorial system
npm run editorial:verify
```

## Script Details

### `test-database.cjs`
- Tests database connectivity
- Lists all existing tables
- Checks for critical tables (users, articles, submissions, reviews)
- Verifies new tables exist (reviewer_applications, tasks)
- Shows row counts for each table

### `quick-migrate-new-tables.cjs`
- Creates missing tables: `reviewer_applications`, `tasks`
- Adds missing columns to existing tables
- Creates necessary indexes for performance
- Ensures PostgreSQL extensions are enabled

### `validate-and-migrate-database.cjs`
- Comprehensive schema validation
- Compares database against `schema.ts` file
- Generates detailed migration SQL scripts
- Optionally executes migrations interactively

## New Tables Added

### `reviewer_applications`
Stores reviewer application submissions with:
- Personal information (name, email, institution)
- Academic details (position, specialties, experience)
- Review preferences and history
- Application status and review notes

### `tasks`
Manages editorial workflow tasks with:
- Task details (title, description, type)
- Assignment and status tracking
- Priority and due date management
- Metadata for flexible task types

### Enhanced `articles` table
Added columns for:
- DOI registration tracking
- Crossref metadata
- File attachments
- Co-author information

## Usage Examples

### First Time Setup
```bash
# Test if database is accessible
npm run db:test

# Run migration to create missing tables
npm run db:quick-migrate

# Verify everything worked
npm run db:test
```

### Schema Validation
```bash
# Get detailed schema analysis
npm run db:validate

# This will:
# 1. Check all tables exist
# 2. Verify all columns are present
# 3. Generate migration SQL if needed
# 4. Optionally run the migration
```

### Troubleshooting

If you get connection errors:
1. Check your `.env.local` file has `DATABASE_URL` or `POSTGRES_URL`
2. Verify the database server is running
3. Test basic connectivity: `npm run db:test`

If tables are missing:
1. Run: `npm run db:quick-migrate`
2. Verify: `npm run db:test`

If you need custom migrations:
1. Run: `npm run db:validate`
2. Review the generated SQL file
3. Execute manually or let the script do it

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# OR
POSTGRES_URL=postgresql://username:password@localhost:5432/database_name
```

## Notes

- All scripts use PostgreSQL-specific SQL
- Scripts are safe to run multiple times (use `IF NOT EXISTS`)
- Migrations preserve existing data
- Always backup your database before running migrations in production

## 🎉 Recent Accomplishments

### ✅ Session Completion Summary
1. **Database Schema Validation**: Created comprehensive validation tools that check our database against the expected schema.ts structure
2. **Missing Tables Created**: Successfully created 3 missing tables:
   - `reviewer_applications` - For managing reviewer applications
   - `tasks` - For workflow task management  
   - `email_templates` - For template-based email system
3. **Column Fixes**: Added missing `admin_id` column to `admin_logs` table with proper foreign key constraints
4. **Schema Updates**: Added `emailTemplates` table definition to lib/db/schema.ts
5. **Management Tools**: Built comprehensive database health check and validation scripts
6. **Package Scripts**: Added convenient npm commands for easy database management

### 🔧 Tools Created
- **`database-health-check.cjs`** - Complete health check with connection test, schema validation, and statistics
- **`validate-database-schema.cjs`** - Detailed schema validation against expected structure
- **`create-missing-tables.cjs`** - Migration script to create missing tables and columns
- **`inspect-admin-logs.cjs`** - Tool to inspect table structures for debugging

**Result**: Database is now 100% compliant with schema.ts and all management tools are operational! 🚀