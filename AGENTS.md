<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Next.js 16.2.6 has breaking changes. Read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start custom server (Next.js + Socket.io) at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `node src/lib/db-init.cjs` | Initialize PostgreSQL schema + demo users (mandatory before first run) |
| `npm run lint` | Run ESLint |

## Required Setup

1. PostgreSQL must be running (check docker-compose.yml or .env)
2. Run `node src/lib/db-init.cjs` to create tables and seed demo users

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Partner | partner@example.com | partner123 |
| Student | student@example.com | student123 |

## Architecture

- **Custom server**: `server.js` integrates Next.js with Socket.io. Uses `npm run dev` (not `next dev`)
- **Auth**: Cookie-based (`token` + `user` JSON). Token verification in `src/utils/auth.js`
- **Middleware**: `middleware.js` protects routes by role (admin/partner/student)
- **Permissions**: `src/lib/permissions.js` - use `hasPermission()`, `hasAnyPermission()`
- **UI guards**: `src/components/PermissionGuard.jsx` - `<AdminOnly>`, `<PartnerOnly>`, `<StudentOnly>`
- **Real-time**: Socket.io rooms for `admin` and `partner-{id}` (global.io available in API routes)
- **API docs**: Swagger at http://localhost:3000/swagger

## Important Notes

- Prefer `react-bootstrap` over MUI (MUI is being phased out)
- Theme toggle uses Bootstrap 5.3 `data-bs-theme` attribute
- API routes go in `src/app/api/` using App Router
- Check `CLAUDE.md` and `GEMINI.md` for more detailed guidance

## API Endpoints

- **POST /api/save-transaction**: Saves transaction data (transactionId, studentName, email, code, class) in JSON format to `src/lib/transactions.json`. Email is optional. Implemented in `src/app/api/save-transaction/route.js`.

