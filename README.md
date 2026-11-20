# FixMyArea

A community issue reporting and tracking platform. Residents report local problems (potholes, broken streetlights, garbage, water leaks) on an interactive map, support existing reports, and track progress. Admins review, update status, and resolve issues with proof.

Built for the Salim Habib University FYP.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How to Run Locally](#how-to-run-locally)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Design System](#design-system)
7. [API Routes](#api-routes)
8. [State of the Project](#state-of-the-project)
9. [Known Issues & Gotchas](#known-issues--gotchas)
10. [What's Next](#whats-next)
11. [Credentials (local only)](#credentials-local-only)

---

## Features

### Public (no login)
- Browse all reports on an interactive Leaflet map
- Filter reports by status and category
- View report details: photos, location, severity, status timeline
- See who supports a report
- View public user profiles (name, member since, report counts)

### Authenticated users
- Register / login (JWT in httpOnly cookie)
- Forgot password via 6-digit OTP email
- Submit new reports with photos, location picker, severity
- Duplicate detection — warns when a similar report exists nearby
- Support / unsupport existing reports
- Track your own reports on `/dashboard`
- Receive notifications when:
  - An admin changes your report's status
  - Someone supports your report

### Admins
- Admin dashboard at `/admin`
- View all reports, filter, sort, search
- Change report status (reported → under review → in progress → resolved)
- Resolve reports with a required resolution note + proof photo
- Delete reports
- View analytics (totals, resolution rate, category breakdown)
- Receive notifications when any user submits a new report

### Smart features
- **Duplicate detection** — spatial + text similarity check before insert. 200m radius, token overlap scoring, category-filtered.
- **Priority scoring** — severity × support count × age. Recomputed on create and support. Public list sorted by live priority.
- **Urdu-aware text similarity** — empty token sets score 0 instead of 1 (prevents Urdu descriptions from matching everything).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.4.5 (App Router, Turbopack) |
| Runtime | React 19, Node.js 20+ |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet + react-leaflet (OpenStreetMap tiles) |
| Database | PostgreSQL (local) |
| DB client | `pg` (node-postgres) with connection pool |
| Auth | Custom — bcrypt password hashing + JWT in httpOnly cookie |
| Email | Nodemailer + Gmail SMTP (app password) |
| Animations | GSAP, CSS keyframes, Tailwind transitions |
| Storage | Supabase Storage (planned) / local `public/uploads/` (current) |
| Package manager | pnpm |

**Notably NOT using Supabase Auth** — custom JWT auth was chosen so the schema and login flow are fully controlled.

---

## How to Run Locally

### Prerequisites

- Node.js 20+ (`node --version`)
- pnpm (`npm install -g pnpm`)
- PostgreSQL 16+ (`psql --version`)
- Git

### 1. Clone and install

```bash
git clone <repo-url>
cd fixmyarea/client
pnpm installcd ~/Projects/fixmyarea
cat > README.md << 'ENDOFFILE'
# FixMyArea

A community issue reporting and tracking platform. Residents report local problems (potholes, broken streetlights, garbage, water leaks) on an interactive map, support existing reports, and track progress. Admins review, update status, and resolve issues with proof.

Built for the Salim Habib University FYP.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How to Run Locally](#how-to-run-locally)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Design System](#design-system)
7. [API Routes](#api-routes)
8. [State of the Project](#state-of-the-project)
9. [Known Issues & Gotchas](#known-issues--gotchas)
10. [What's Next](#whats-next)
11. [Credentials (local only)](#credentials-local-only)

---

## Features

### Public (no login)
- Browse all reports on an interactive Leaflet map
- Filter reports by status and category
- View report details: photos, location, severity, status timeline
- See who supports a report
- View public user profiles (name, member since, report counts)

### Authenticated users
- Register / login (JWT in httpOnly cookie)
- Forgot password via 6-digit OTP email
- Submit new reports with photos, location picker, severity
- Duplicate detection — warns when a similar report exists nearby
- Support / unsupport existing reports
- Track your own reports on `/dashboard`
- Receive notifications when:
  - An admin changes your report's status
  - Someone supports your report

### Admins
- Admin dashboard at `/admin`
- View all reports, filter, sort, search
- Change report status (reported → under review → in progress → resolved)
- Resolve reports with a required resolution note + proof photo
- Delete reports
- View analytics (totals, resolution rate, category breakdown)
- Receive notifications when any user submits a new report

### Smart features
- **Duplicate detection** — spatial + text similarity check before insert. 200m radius, token overlap scoring, category-filtered.
- **Priority scoring** — severity × support count × age. Recomputed on create and support. Public list sorted by live priority.
- **Urdu-aware text similarity** — empty token sets score 0 instead of 1 (prevents Urdu descriptions from matching everything).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.4.5 (App Router, Turbopack) |
| Runtime | React 19, Node.js 20+ |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet + react-leaflet (OpenStreetMap tiles) |
| Database | PostgreSQL (local) |
| DB client | `pg` (node-postgres) with connection pool |
| Auth | Custom — bcrypt password hashing + JWT in httpOnly cookie |
| Email | Nodemailer + Gmail SMTP (app password) |
| Animations | GSAP, CSS keyframes, Tailwind transitions |
| Storage | Supabase Storage (planned) / local `public/uploads/` (current) |
| Package manager | pnpm |

**Notably NOT using Supabase Auth** — custom JWT auth was chosen so the schema and login flow are fully controlled.

---

## How to Run Locally

### Prerequisites

- Node.js 20+ (`node --version`)
- pnpm (`npm install -g pnpm`)
- PostgreSQL 16+ (`psql --version`)
- Git

### 1. Clone and install

```bash
git clone <repo-url>
cd fixmyarea/client
pnpm install### 2. Create the local database
sudo -u postgres psql

text
Inside psql:
CREATE USER fixmyarea_user WITH PASSWORD 'your-password';
CREATE DATABASE fixmyarea_db OWNER fixmyarea_user;
GRANT ALL PRIVILEGES ON DATABASE fixmyarea_db TO fixmyarea_user;
\q

text

### 3. Apply the schema
psql -U fixmyarea_user -d fixmyarea_db -h localhost -f client/db/schema.sql

text

If password_reset_otps or notifications tables are missing:
CREATE TABLE IF NOT EXISTS password_reset_otps (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) ON DELETE CASCADE,
otp_hash TEXT NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
used_at TIMESTAMPTZ,
attempts INT NOT NULL DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user
ON password_reset_otps (user_id, used_at, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
report_id INT REFERENCES reports(id) ON DELETE CASCADE,
type VARCHAR(30) NOT NULL,
message TEXT NOT NULL,
is_read BOOLEAN NOT NULL DEFAULT FALSE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications (user_id, is_read, created_at DESC);


### 4. Create .env.local
Copy client/.env.example to client/.env.local and fill in:DATABASE_URL=postgresql://fixmyarea_user:your-password@localhost:5432/fixmyarea_db
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=<run: openssl rand -hex 32>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="FixMyArea" your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

text
Never commit .env.local. It contains secrets.

### 5. Seed the admin user
cd client
ADMIN_PASSWORD='ChooseAStrongPassword' node db/seed-admin.mjs

text

### 6. Run
cd client
pnpm dev

text
Open http://localhost:3000. First compile of each page takes 30–60s on a slow disk.

---

## Project Structure
fixmyarea/
+-- client/
| +-- src/
| | +-- app/
| | | +-- page.js (Home - map + recent reports)
| | | +-- layout.js (Root layout)
| | | +-- globals.css (Design tokens, Leaflet fixes, animations)
| | | +-- login/
| | | +-- register/
| | | +-- forgot-password/
| | | +-- reset-password/
| | | +-- dashboard/
| | | +-- admin/
| | | +-- notifications/
| | | +-- reports/
| | | | +-- page.js (List + filters)
| | | | +-- new/page.js (Submit form)
| | | | +-- [id]/page.js (Detail + timeline + supporters)
| | | +-- users/[id]/page.js (Public profile)
| | | +-- not-found.js
| | | +-- api/
| | | +-- auth/
| | | +-- reports/
| | | +-- admin/reports/
| | | +-- users/[id]/
| | | +-- notifications/
| | | +-- categories/
| | | +-- stats/
| | +-- components/
| | | +-- ui.js (Design system)
| | | +-- Header.js
| | | +-- BottomNav.js
| | | +-- AuthProvider.js
| | | +-- ThemeProvider.js
| | | +-- ThemeToggle.js
| | | +-- ReportCard.js
| | | +-- SupportButton.js
| | | +-- ReportImage.js
| | | +-- ReportsMap.js
| | | +-- ReportDetailMap.js
| | | +-- ReportDetailMapWrapper.js
| | | +-- HomeMapSection.js
| | | +-- LocationPicker.js
| | | +-- Modal.js
| | | +-- Motion.js
| | | +-- AdminRedirectGuard.js
| | +-- lib/
| | +-- db.js
| | +-- auth.js
| | +-- http.js
| | +-- status.js
| | +-- duplicate.service.js
| | +-- priority.service.js
| | +-- supporters.service.js
| | +-- notifications.service.js
| | +-- otp.js
| | +-- mail.js
| | +-- storage.js
| | +-- upload.js
| | +-- rate-limit.js
| | +-- motion.js
| +-- public/
| +-- db/
| +-- package.json
| +-- .env.example
+-- .gitignore
+-- README.md

text

---

## Database Schema

### users
id (PK), name, email (unique), password_hash (bcrypt), role ('user'|'admin'), created_at

### categories
id (PK), name, icon

### reports
id (PK), user_id (FK), category_id (FK), title, description, latitude, longitude, severity (1-5), status, priority_score, duplicate_of, address, created_at, updated_at, resolution_image_url, resolution_note, resolved_by, resolved_at

Statuses: reported, under_review, in_progress, resolved

### report_images
id (PK), report_id (FK), url

### supports
PRIMARY KEY (user_id, report_id), created_at

### status_history
id (PK), report_id (FK), old_status, new_status, changed_by (FK), note, created_at

### password_reset_otps
id (PK), user_id (FK), otp_hash, expires_at, used_at, attempts, created_at

### notifications
id (PK), user_id (FK), report_id (FK), type, message, is_read, created_at

---

## Design System

### Palette — "Aubergine"
Plum + coral + cream. 50/40/10 ratio.

All colors defined as CSS variables in globals.css:
:root {
--background: #fdf4f7;
--surface: #ffffff;
--surface-muted: #fbe9f0;
--accent: #7c3aed;
--accent-hover: #6d28d9;
--accent-soft: #ede9fe;
--coral: #f97316;
--coral-hover: #ea580c;
--coral-soft: #ffedd5;
--foreground: #2e1065;
--foreground-muted: #7c6d7f;
--border: #e9d5f0;
--border-strong: #d4b8e0;
}
.dark {
--background: #1a0f1a;
--surface: #2d1b2e;
--accent: #a78bfa;
--foreground: #faf5ff;
}

text

Rule: use bg-[var(--surface)], text-[var(--foreground)], etc. Never raw Tailwind colors like bg-stone-50.

### Components — ui.js
- Button (primary|secondary|danger)
- Input, Textarea, Card
- Alert (error|success)
- StatusBadge
- LoadingNote, EmptyState, ErrorState, ReportsSkeleton
- PageHero (with hero mesh pattern)
- Footer
- Icons: PinIcon, CameraIcon, CheckIcon, ThumbsUpIcon

### Animations
- .btn-lift — hover lift
- .card-lift — card hover raise
- .skeleton-shimmer — loading skeleton
- .page-enter — page content fade-in
- .hero-pattern — centered mesh fade
- .hero-pattern-left — left-aligned mesh fade
- .animate-fade-in — alerts

All respect prefers-reduced-motion.

---

## API Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Returns JWT cookie |
| POST | /api/auth/logout | user | Clears cookie |
| GET | /api/auth/me | user | Current user |
| POST | /api/auth/forgot-password | — | Send OTP email |
| POST | /api/auth/verify-reset-otp | — | Check OTP |
| POST | /api/auth/reset-password | — | Set new password |
| GET | /api/reports | — | List (filter: status, category, mine, limit, offset) |
| POST | /api/reports | user | Create (supports ?force=true) |
| GET | /api/reports/[id] | — | Detail |
| POST | /api/reports/[id]/support | user | Toggle support |
| GET | /api/reports/[id]/support | user | Check support status |
| POST | /api/reports/[id]/images | user | Upload photos |
| GET | /api/users/[id] | — | Public profile |
| GET | /api/notifications | user | List + unread count |
| POST | /api/notifications/[id]/read | user | Mark one |
| POST | /api/notifications/read-all | user | Mark all |
| GET | /api/admin/reports | admin | List all |
| PATCH | /api/admin/reports/[id]/status | admin | Change status |
| DELETE | /api/admin/reports/[id] | admin | Delete |
| GET | /api/stats | — | Analytics |
| GET | /api/categories | — | List categories |

---

## State of the Project

### Fully working (tested locally)
- User registration, login, logout
- Forgot password -> OTP email -> reset
- Report submission with photos + map picker
- Duplicate detection with ?force=true override
- Support / unsupport toggle
- Supporters list on report detail
- Public user profiles
- Admin dashboard with status changes + resolution proof
- Notifications: bell + badge + page + mark read
- Notifications trigger on: status change, new support, new report (admins)
- Full Aubergine design in light + dark mode
- Leaflet maps don't overlap header/nav on scroll
- Duplicate check + insert in one transaction

### Not yet tested / partially done
- Notification badge refresh after mark-all-read (logic in place, smoke-tested)
- Photo upload via Supabase Storage (currently uses local public/uploads/)

### Known issues
- Admin password can be reset but is easy to forget (see Gotchas)
- Slow first compile (Turbopack 30–60s per new route on slow disk)
- Supabase direct DB unreachable (IPv6-only DNS) — must use pooler URL

---

## Known Issues & Gotchas

### Admin password reset
If you can't log in as admin:
cd client
node -e "const b = require('bcrypt'); b.hash('NewPassword', 10).then(h => console.log(h))"

text
Copy the hash (starts with $2b$10$...), then:
psql -U fixmyarea_user -d fixmyarea_db -h localhost -c "UPDATE users SET password_hash = '$2b$10$<PASTE_REST>' WHERE email = 'admin@fixmyarea.pk';"

text
Escape $ as \$ in bash double-quotes.

### Turbopack hangs
If pnpm dev starts but no request responds:
kill -9 $(lsof -t -i:3000) 2>/dev/null
rm -rf .next
pnpm dev

text

### Leaflet map escapes container on scroll
Fixed via .leaflet-container { isolation: isolate; overflow: hidden; } and z-index caps in globals.css.

### Color classes must use CSS variables
Never text-stone-500, always text-[var(--foreground-muted)].

### .env.local is never committed
Verify with: git check-ignore client/.env.local

---

## What's Next

### Priority 1 — Finish Supabase migration
- Get pooler URL from teammate or Supabase dashboard
- Update .env.local DATABASE_URL to pooler URL
- Create notifications + password_reset_otps tables on Supabase
- Verify reports table has all resolution columns
- Test end-to-end against hosted DB

### Priority 2 — Deploy
- Deploy frontend to Vercel
- Set env vars in Vercel dashboard (with pooler URL)
- Update NEXT_PUBLIC_APP_URL to deployed URL

### Priority 3 — Polish
- Loading indicator during page navigation
- Empty state illustrations
- Map clustering
- "Near me" GPS button

### Feature ideas (not in proposal)
- Comments on reports
- Report status email notifications
- Export admin reports to CSV
- Search by title on /reports

---

## Credentials (local only)

These are for your local dev database only. Never commit real credentials.

- Admin: admin@fixmyarea.pk / FixMyAreaAdmin2026
- DB user: fixmyarea_user / FixMyArea2026x
- DB name: fixmyarea_db
- Connection: postgresql://fixmyarea_user:FixMyArea2026x@localhost:5432/fixmyarea_db

If you switch to Supabase, replace these with the pooler URL and the Supabase admin password.

---

## Continuing in a New Chat

If you're picking this up in a new conversation with an AI assistant:

1. Branch: main
2. Last known working state: All features in the "Fully working" list above
3. The stack: Next.js 16 + React 19 + Postgres + custom JWT auth
4. The design: Aubergine palette (plum/coral/cream), CSS variables only
5. The next step: Supabase migration OR deployment to Vercel OR polish features

Paste this README into the new chat and say "continue from where we left off, the next step is X".
