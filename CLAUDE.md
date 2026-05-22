# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

- **Framework**: Next.js 16.2.6 with React 19.2.4
- **Database**: PostgreSQL (pgAdmin)
- **UI**: Material-UI (MUI) with custom theme
- **This is NOT the standard Next.js**: This version has breaking changes from earlier versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `node src/lib/db-init.cjs` | Initialize database with tables and demo users |

## API Documentation

Swagger UI is available at: **http://localhost:3000/swagger**

The API spec JSON is at: **http://localhost:3000/api-docs**

## Demo Accounts

After running database initialization, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Student | student@example.com | student123 |
| Partner | partner@example.com | partner123 |

## Roles and Permissions

The system has three roles with the following permissions:

### Roles
- **admin** - Full system access (create partners, referral codes, view all users)
- **partner** - Referral code management and student tracking
- **student** - Profile and course viewing

### Permissions Configuration
Location: `src/lib/permissions.js`

Key functions:
- `hasPermission(role, permission)` - Check if a role has a specific permission
- `hasAnyPermission(role, permissions)` - Check if role has any of the permissions
- `hasAllPermissions(role, permissions)` - Check if role has all permissions

### Permission Components
Location: `src/components/PermissionGuard.jsx`

- `<AdminOnly>` - Renders children only for admin role
- `<PartnerOnly>` - Renders children only for partner role
- `<StudentOnly>` - Renders children only for student role
- `<PermissionGuard permission={...}>` - Conditional rendering based on permission

### Middleware
Location: `middleware.js`

Protects routes based on roles:
- `/admin/*` - Admin only
- `/partner/*` - Partner only
- `/student/*` - Student only
- `/api/admin/*` - Admin only
- `/api/partner/*` - Partner only
- `/api/student/*` - Student only

## Architecture

- `src/app/` - App Router pages and API routes
- `src/lib/db.js` - PostgreSQL connection pool
- `src/utils/auth.js` - JWT token creation/verification (simple base64 for demo)
- `src/lib/permissions.js` - Role-permission mapping
- `src/components/PermissionGuard.jsx` - Permission-based UI components
- `src/lib/swagger.js` - OpenAPI 3.0 spec configuration
- `src/theme/theme.js` - MUI theme customization
- `src/lib/email.js` - Nodemailer SMTP configuration
- `middleware.js` - Route protection via cookie-based auth

### Database Schema
- **users** - id, email, password, role, name, is_verified, created_at
- **student_details** - user_id, student_id, course, year
- **partner_details** - user_id, position
- **referral_codes** - partner_id, code, is_active

### API Routes
- `/api/auth/*` - Login, register, send-otp, verify-otp
- `/api/admin/*` - Dashboard, users, partners, referral-codes, create-partner
- `/api/partner/*` - Dashboard with referral stats
- `/api/student/*` - Dashboard with profile/courses

**Note**: Before modifying any code, check `node_modules/next/dist/docs/` for the latest API changes in this version.