# Gemini CLI - Referral System Project Context

This document provides foundational context and instructions for the Gemini CLI agent to interact effectively with the Referral System codebase.

## Project Overview

- **Purpose**: A referral management system for students, partners, and administrators.
- **Framework**: Next.js 16.2.6 (App Router) with React 19.2.4.
- **Architecture**: Monolithic Next.js application with a custom Node.js server (`server.js`) to support Socket.io.
- **Frontend**: Hybrid Material-UI (MUI) and react-bootstrap UI. (MUI is being phased out).
- **Backend**: Next.js API routes (`src/app/api/`) and a custom middleware (`middleware.js`) for authentication and authorization.
- **Database**: PostgreSQL using the `pg` library.
- **Real-time**: Socket.io for live updates (e.g., admin/partner notifications).
- **Documentation**: Swagger UI integrated for API exploration.

## Core Technologies

- **Frontend**: Next.js 16, React 19, react-bootstrap, React Hot Toast. (MUI is partially present but being phased out).
- **Styling**: Prefer `react-bootstrap` components. Theme toggling is handled via the `ThemeToggle` component using the Bootstrap `data-bs-theme` attribute.
- **Real-time**: Socket.io (server-side integrated in `server.js`).
- **Mailing**: Nodemailer for OTP and notifications.

## Building and Running

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the custom development server (`server.js`) at http://localhost:3000 |
| `npm run build` | Builds the Next.js application for production |
| `npm run start` | Starts the custom production server (`server.js`) |
| `npm run lint` | Executes ESLint for code quality checks |
| `node src/lib/db-init.cjs` | **Mandatory**: Initializes PostgreSQL database schema and seeds demo data |

## Development Conventions

- **Next.js 16 Warning**: This version contains breaking changes from earlier versions. Refer to internal docs or specific Next.js 16 documentation when modifying core routing or server-side behavior.
- **Authentication**: Auth is handled via `middleware.js`. It checks for a `token` cookie or `authorization` header and a `user` cookie containing JSON data.
- **Permissions**: Use `src/lib/permissions.js` for role-based logic. UI components should be wrapped in `PermissionGuard.jsx` or specialized guards like `AdminOnly`, `PartnerOnly`, or `StudentOnly`.
- **Styling**: Prefer `react-bootstrap` components. The `ThemeToggle` component manages the theme using the Bootstrap 5.3 `data-bs-theme` attribute.
- **API Documentation**: All new API routes should be documented in the Swagger configuration located in `src/lib/swagger.js`.

## Project Structure

- `server.js`: Custom server entry point integrating Next.js and Socket.io.
- `middleware.js`: Centralized authentication and role-based route protection.
- `src/app/`: App Router structure for pages and API routes.
- `src/lib/`: Core libraries (database connection, permissions, email, swagger).
- `src/components/`: Shared UI components, including permission guards.
- `src/utils/`: Helper functions for authentication and password hashing.

## Key Logic Locations

- **Auth Logic**: `src/utils/auth.js` (Token creation/verification) and `src/app/api/auth/` (Auth routes).
- **Permission Mapping**: `src/lib/permissions.js` defines roles and their associated permission strings.
- **Database Connection**: `src/lib/db.js` exports the PostgreSQL pool.
- **Socket Rooms**: `server.js` defines rooms for `admin` and `partner-{id}`.

## Database Schema

- **users**: Base table for all account types.
- **student_details**: Extended profile for students.
- **partner_details**: Extended profile for partners.
- **referral_codes**: Active and inactive codes managed by partners/admins.

---
*Note: This file is a foundational mandate and takes precedence over general defaults.*
