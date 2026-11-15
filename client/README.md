# FixMyArea — client

The FixMyArea app: a Next.js 16 (App Router) application with its API
routes, server helpers, and database schema all in this directory. There
is no separate backend server.

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 16+

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables (create .env.local)
#    DATABASE_URL=postgres://fixmyarea_user:your_password@localhost:5432/fixmyarea_db
#    JWT_SECRET=<a random secret, at least 32 characters>

# 3. Create the database and apply the schema
psql -U fixmyarea_user -d fixmyarea_db -f db/schema.sql

# 4. (Optional) Create the first admin user
#    Set ADMIN_PASSWORD in the environment, then run:
node db/seed-admin.mjs

# 5. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable         | Required | Description                                         |
| ---------------- | -------- | --------------------------------------------------- |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                        |
| `JWT_SECRET`     | Yes      | Secret for signing auth tokens (min. 32 characters) |
| `ADMIN_PASSWORD` | Seed only | Password for the admin created by `db/seed-admin.mjs` |

## Scripts

| Command      | What it does               |
| ------------ | -------------------------- |
| `pnpm dev`   | Start the dev server       |
| `pnpm build` | Production build           |
| `pnpm start` | Serve the production build |
| `pnpm lint`  | Run ESLint                 |

## Project Layout

```
src/app/            Pages + API routes (App Router)
src/app/api/        API routes: auth, reports, admin, stats, categories
src/components/     Client components (Header, AuthProvider, maps, ...)
src/lib/            Server helpers: db pool, auth, duplicate/priority logic
db/schema.sql       Full database schema (tables, indexes, seed categories)
db/seed-admin.mjs   Creates the first admin user (ADMIN_PASSWORD from env)
public/uploads/     Locally stored report/resolution photos
```

## Auth

Auth is cookie-based: login/register set an httpOnly `fixmyarea_token`
cookie (7 days). The client never stores tokens in `localStorage` and never
sends `Authorization` headers — all fetches use `credentials: 'include'`.
