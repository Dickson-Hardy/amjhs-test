# AMHSJ Role Setup Documentation

## Overview
This script sets up all the necessary roles and users for the AMHSJ academic journal workflow system. It creates a complete hierarchical role structure with sample data for testing and development.

## Quick Start

### Using npm script (Recommended)
```bash
npm run setup-roles
```

### Direct execution
```bash
node scripts/setup-roles.cjs
```

## Prerequisites

1. **Database**: PostgreSQL database must be running and accessible
2. **Environment**: `DATABASE_URL` must be set in `.env.local`
3. **Dependencies**: Run `npm install` to ensure all dependencies are installed

## Roles Created

### Administrative Roles
- **System Administrator** (`admin`)
  - Email: `admin@amhsj.org`
  - Password: `password123`
  - Authority Level: 100 (Highest)

### Editorial Hierarchy
- **Editor-in-Chief** (`editor-in-chief`)
  - Email: `eic@amhsj.org`
  - Authority Level: 90
  - Final decision authority

- **Managing Editor** (`managing-editor`)
  - Email: `managing@amhsj.org`
  - Authority Level: 80
  - Operational oversight

- **Section Editors** (`section-editor`)
  - Cardiology: `cardiology.editor@amhsj.org`
  - Neurology: `neurology.editor@amhsj.org`
  - Oncology: `oncology.editor@amhsj.org`
  - Authority Level: 70
  - Subject-specific management

- **Production Editor** (`production-editor`)
  - Email: `production@amhsj.org`
  - Authority Level: 60
  - Post-acceptance workflow

- **Guest Editor** (`guest-editor`)
  - Email: `guest.ai@amhsj.org`
  - Authority Level: 50
  - Special issues management

- **Associate Editors** (`editor`)
  - associate1@amhsj.org
  - associate2@amhsj.org
  - Authority Level: 40
  - Editorial support

### Review and Author Roles
- **Reviewers** (`reviewer`)
  - reviewer1@amhsj.org (Senior)
  - reviewer2@amhsj.org (Senior)
  - reviewer3@amhsj.org (Mid-level)
  - reviewer4@amhsj.org (Junior)
  - Authority Level: 30

- **Authors** (`author`)
  - author1@example.org (Active researcher)
  - author2@example.org (Early career)
  - grad.student@example.org (Graduate student)
  - Authority Level: 20

## Features Created

### User Profiles
- Complete user information with ORCID IDs
- Professional affiliations and bio
- Research expertise and specializations
- Publications and qualifications data

### Editorial Profiles
- Workload management (current/max capacity)
- Section assignments
- Editorial experience tracking
- Availability status

### Reviewer Profiles
- Review capacity and availability
- Quality scores and performance metrics
- Completed review history
- Average review time tracking

### Sample Data
- Current volume (Volume 15, 2025)
- Published issue (Cardiovascular Medicine in Africa)
- Special issue setup (AI in Medicine)
- Welcome notifications for all roles

## Database Tables Populated

- `users` - All user accounts with complete profiles
- `editor_profiles` - Editorial capacity and assignments
- `reviewer_profiles` - Review capacity and performance
- `user_publications` - Sample publication records
- `user_qualifications` - Educational and professional credentials
- `volumes` - Current journal volume
- `issues` - Published and upcoming issues
- `notifications` - Welcome messages for new roles

## Security Notes

⚠️ **Important Security Considerations:**

1. **Default Passwords**: All accounts use `password123` for demo purposes
2. **Production Setup**: Change all passwords before deploying to production
3. **Email Verification**: All accounts are pre-verified for testing
4. **ORCID Integration**: Sample ORCID IDs are provided but not live-connected

## Workflow Testing

After running the setup, you can test:

1. **Login Flow**: Try logging in with different role credentials
2. **Dashboard Access**: Each role has a specialized dashboard
3. **Permission Testing**: Verify role-based access controls
4. **Editorial Workflow**: Test submission → review → decision flow
5. **Communication**: Test messaging between different roles

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` in `.env.local`
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Permission Denied**
   - Ensure database user has CREATE/INSERT permissions
   - Check if tables already exist with conflicts

3. **Constraint Violations**
   - Script uses `ON CONFLICT DO NOTHING` to prevent duplicates
   - Safe to run multiple times

### Verification
```bash
# Check if roles were created successfully
psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

# Verify editor profiles
psql $DATABASE_URL -c "SELECT editor_type, COUNT(*) FROM editor_profiles GROUP BY editor_type;"

# Check reviewer profiles
psql $DATABASE_URL -c "SELECT availability_status, COUNT(*) FROM reviewer_profiles GROUP BY availability_status;"
```

## Development Workflow

1. **Initial Setup**: Run `npm run setup-roles` once
2. **Testing**: Use various role accounts to test workflows
3. **Reset**: Drop and recreate database if needed, then re-run setup
4. **Customization**: Modify script to add more users or adjust profiles

## Next Steps

1. Start the application: `npm run dev`
2. Navigate to `/auth/signin`
3. Login with any of the created accounts
4. Explore role-specific dashboards
5. Test the complete editorial workflow

## Support

For issues with role setup:
1. Check the console output for detailed error messages
2. Verify database schema matches expectations
3. Ensure all required tables exist
4. Check environment variables and database connectivity
