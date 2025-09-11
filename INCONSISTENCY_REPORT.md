# 🚨 AMJHS Project Inconsistency Report

Generated on: September 10, 2025

## 🔴 Critical Issues

### 1. **Hardcoded Database Credentials**
**Severity: CRITICAL**

Multiple files contain hardcoded database URLs with credentials exposed:

- `fix-screening-db.js` (Line 4)
- `fix-notification-constraints.js` (Line 3)  
- `create-associate-editors.js` (Line 3)
- `apply-db-fixes.js` (Line 4)

```javascript
const DATABASE_URL = "postgresql://neondb_owner:npg_gifD5p1lIBTc@ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
```

**Impact**: Security vulnerability, credentials exposed in version control
**Action Required**: Replace with `process.env.DATABASE_URL`

### 2. **Database Connection Failure**
**Severity: CRITICAL**

Database health check failed with network error:
```
❌ Database connection failed: getaddrinfo ENOTFOUND ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech
```

**Impact**: Application cannot function, database unreachable
**Action Required**: Verify database URL and network connectivity

## 🟡 High Priority Issues

### 3. **Environment Configuration Inconsistencies**

#### NODE_ENV Configuration
- `.env` file has `NODE_ENV=development` (line appears twice)
- Multiple files check for production/development mode
- Potential configuration conflicts

#### Placeholder API Keys
- `RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` (placeholder)
- `TAWK_TO_PROPERTY_ID=your_property_id_here` (placeholder)
- `TAWK_TO_WIDGET_ID=your_widget_id_here` (placeholder)
- `CROSSREF_USERNAME=your-crossref-username` (placeholder)
- `ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXX` (placeholder)

**Impact**: Features won't work with placeholder values
**Action Required**: Replace with actual API keys or disable features

### 4. **Script Organization Issues**

#### Duplicate Functionality
Multiple scripts with similar purposes:
- `check-*.cjs` files (11 files)
- `fix-*.js` files (8 files)
- `test-*.cjs` files (15 files)

#### File Extension Inconsistency
- Mix of `.js`, `.cjs`, `.mjs`, `.ts` extensions
- Some scripts use ES modules, others CommonJS
- `package.json` has `"type": "module"` but many `.cjs` files exist

**Impact**: Maintenance complexity, potential execution issues
**Action Required**: Standardize file extensions and module system

### 5. **Database Schema Inconsistencies**

#### Schema Definition Issues
- Multiple database connection patterns used
- Some files use hardcoded URLs, others use environment variables
- Potential schema drift between files

**Files Affected**:
- `lib/db/index.ts` (uses `process.env.DATABASE_URL`)
- `lib/constants.ts` (has fallback URL)
- Various script files (hardcoded URLs)

## 🟢 Medium Priority Issues

### 6. **Import Path Inconsistencies**

#### Relative Import Patterns
Mixed import patterns found:
- Some use `../lib/` paths
- Some use `@/lib/` paths
- Inconsistent across test files

**Files Affected**:
- `__tests__/*.test.ts` files use relative imports
- App files use absolute imports with `@/` alias

### 7. **TypeScript Configuration**

#### Module System Confusion
- `package.json` specifies `"type": "module"`
- Many `.cjs` files exist (CommonJS)
- Some `.mjs` files exist (ES modules)
- `.ts` files compiled to different targets

**Impact**: Build issues, runtime errors possible
**Action Required**: Align module system choices

### 8. **Logging and Error Handling**

#### Inconsistent Error Patterns
- Multiple error handling approaches
- Different logging patterns across files
- Some files have debug information in production

## 📋 Recommendations

### Immediate Actions (Critical)

1. **Replace hardcoded database URLs**:
   ```bash
   # Replace in all affected files
   find . -name "*.js" -exec sed -i 's/const DATABASE_URL = "postgresql:\/\/.*"/const DATABASE_URL = process.env.DATABASE_URL/g' {} \;
   ```

2. **Fix database connectivity**:
   - Verify Neon database is running
   - Check network connectivity
   - Validate DATABASE_URL in environment

3. **Replace placeholder API keys**:
   - Get actual Resend API key
   - Configure ORCID properly
   - Set up CrossRef credentials

### Medium-term Actions

1. **Consolidate scripts**:
   - Remove duplicate functionality
   - Standardize on `.ts` or `.js` with consistent module system
   - Create a `/scripts` directory structure

2. **Standardize configurations**:
   - Create single source of truth for environment variables
   - Implement proper environment validation
   - Use TypeScript for better type safety

3. **Improve error handling**:
   - Standardize error patterns
   - Implement consistent logging
   - Add proper monitoring

### Long-term Actions

1. **Database migration strategy**:
   - Implement proper migration system
   - Use Drizzle migrations consistently
   - Remove manual database scripts

2. **CI/CD improvements**:
   - Add environment validation
   - Implement proper testing
   - Add security scanning

## 🎯 Priority Matrix

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| Hardcoded DB URLs | Critical | Low | 🔴 Immediate |
| DB Connection | Critical | Medium | 🔴 Immediate |
| API Key Placeholders | High | Low | 🟡 This Week |
| Script Consolidation | Medium | High | 🟢 This Month |
| Module System | Medium | Medium | 🟢 This Month |

## 📊 Summary

- **Critical Issues**: 2
- **High Priority**: 3  
- **Medium Priority**: 3
- **Total Files Affected**: 25+
- **Estimated Fix Time**: 2-3 days

**Next Steps**: Address critical security issues first, then work on standardization and consolidation.