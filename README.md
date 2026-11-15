# FixMyArea

A community issue reporting and tracking platform. Residents report local
problems (potholes, broken streetlights, garbage, water leaks) with photos
and map locations, track their status, and support issues that matter to
them. Admins triage reports, update statuses, and post resolution proof.

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| App      | Next.js 16 (App Router), React 19, plain JS |
| Styling  | Tailwind CSS 4                              |
| Database | PostgreSQL (`pg` Pool, plain SQL)           |
| Auth     | bcrypt + JSON Web Tokens in an httpOnly cookie |
| Maps     | Leaflet / react-leaflet + OpenStreetMap     |

The whole app lives in `client/` — there is no separate backend server.
API routes live in `client/src/app/api/`, shared server code in
`client/src/lib/`, and the database schema in `client/db/schema.sql`.

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 16+

## Local Development Setup

```bash
# 1. Install dependencies
cd client
pnpm install

# 2. Set up environment variables (create client/.env.local)
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

| Variable         | Required | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                             |
| `JWT_SECRET`     | Yes      | Secret for signing auth tokens (min. 32 characters)      |
| `ADMIN_PASSWORD` | Seed only | Password for the admin created by `db/seed-admin.mjs`   |

## Scripts (run inside `client/`)

| Command       | What it does                              |
| ------------- | ----------------------------------------- |
| `pnpm dev`    | Start the dev server                      |
| `pnpm build`  | Production build                          |
| `pnpm start`  | Serve the production build                |
| `pnpm lint`   | Run ESLint                                |

## Project Layout

```
client/
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
