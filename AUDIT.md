# FixMyArea — Audit Report (2026-11-15)

Senior-engineer audit + fix pass over the FixMyArea repo (Next.js 16 app in
`client/`, API routes in `client/src/app/api/`, data layer in `client/src/lib/`,
schema in `client/db/schema.sql`). Auth is custom JWT + bcrypt; the database is
plain PostgreSQL via a `pg` Pool; images are local files under
`client/public/uploads/`.

Scope audited: every file under `client/src/app/api/`, `client/src/lib/`,
`client/src/app/` (all pages), `client/src/components/`, `client/db/`,
`client/package.json`, `client/next.config.mjs`, and both READMEs.

Verification after fixes: `cd client && pnpm install && pnpm lint` (clean) and
`pnpm build` (passes, all 18 routes). No test suite exists in the repo, so
verification is lint + build + code review; live behaviour against a database
was not exercised here — that is covered by the Supabase phase.

## Findings fixed

### Critical
- **Resolve flow could never work — schema missing 4 columns.** The admin
  status route wrote `resolution_image_url`, `resolution_note`, `resolved_by`,
  `resolved_at`, but `db/schema.sql` created none of them, so every resolve
  failed with PG 42703 → 500. Fixed: the four columns are now in the schema
  (`resolution_image_url TEXT`, `resolution_note TEXT`,
  `resolved_by INT REFERENCES users(id)`, `resolved_at TIMESTAMPTZ`).
- **Dashboard `?mine=true` ignored — every user saw every report.**
  The reports list API only read `status`/`category_id` and had no auth, so
  "My Reports" showed all reports with wrong counts. Fixed: `mine=true` now
  requires auth and filters `r.user_id = $n`; the public list is unchanged.
- **Hardcoded admin password in the seed script.** `db/seed-admin.mjs`
  contained a plaintext admin password, re-applied it on every run via UPDATE,
  and printed it to stdout. Fixed: the seed reads `ADMIN_PASSWORD` from the
  environment only (exits with a clear error if unset), never logs it, and
  refuses to overwrite an existing admin row. Rotate the old credential on any
  database the seed ever ran against — the old value is in git history.
- **Support toggle race.** SELECT-then-INSERT/DELETE with no transaction:
  concurrent toggles could 500 on the `supports` PK or land in the wrong
  state. Fixed: one transaction, `INSERT ... ON CONFLICT DO NOTHING RETURNING`
  / `DELETE ... RETURNING`, `supported` derived from the statement that
  changed a row.
- **AuthProvider deleted valid tokens on transient failures.** A 5s abort or
  any non-OK `/api/auth/me` response wiped the token. Fixed: only a 401
  triggers logout; timeout/network/5xx keep the session (one retry).
- **Support state was never known — first click unsupports.** The button
  defaulted to "not supported" and the detail page never passed the real
  state. Fixed: new `GET /api/reports/[id]/support` returns `{ supported }`
  for the logged-in user; the button seeds its state from it.

### High
- **JWT in `localStorage`.** Any XSS meant full account takeover, including
  admin. Fixed: auth now uses an httpOnly `fixmyarea_token` cookie
  (`SameSite=Lax`, `Path=/`, 7-day maxAge, `Secure` in production);
  login/register set it and return `{ user }` only; `POST /api/auth/logout`
  clears it. All client fetches use `credentials: 'include'`; no
  `localStorage` token remains (only the theme preference uses localStorage).
- **No rate limiting.** Login was brute-forceable; register/reports/support
  were spam-able. Fixed: `lib/rate-limit.js` (in-memory per-IP/per-user
  windows): login 5/15 min, register 10/15 min, report create 20/15 min,
  support 30/15 min; 429 with `Retry-After`.
- **JWT secret never validated; no algorithm pinned.** A missing secret broke
  all auth with a generic 500; a weak secret allowed forged admin tokens.
  Fixed: `JWT_SECRET` must be set and ≥ 32 chars (checked on first use),
  `HS256` pinned on sign and verify.
- **Resolution-image extension from the attacker-controlled filename.**
  `.html`/`.svg` uploads could be served from `public/` as stored XSS.
  Fixed: the extension is derived from the validated MIME type, and both
  upload routes verify magic bytes (JPEG/PNG/WebP) via a shared
  `lib/upload.js` helper.
- **Admin role trusted from the JWT alone.** A demoted/deleted admin kept
  admin rights until the 7-day token expired. Fixed: `getUserFromRequest`
  re-checks the role from the `users` table on every authenticated request
  and returns null when the row is missing.
- **Seed script imported `dotenv`, which was not a dependency.**
  Fixed: `dotenv` added to `client/package.json` (lockfile updated).
- **Non-numeric `[id]` returned 500 on all 5 `[id]` routes.** Fixed: integer
  validation up front → 400.
- **Malformed / non-object JSON bodies returned 500.** Fixed: a `parseJsonBody`
  helper (`lib/http.js`) returns 400; multipart parse failure in the status
  route also returns 400.
- **Register duplicate-email race returned 500.** Fixed: `23505` caught → 409.
- **Report-create validation was type-blind.** Strings/NaN/objects passed
  range checks and then 500'd in Postgres; description was unbounded.
  Fixed: strict type checks, `Number.isFinite` lat/lng with ranges, integer
  severity 1–5 and category_id, lengths title ≤ 150, description ≤ 2000,
  address ≤ 300.
- **Duplicate check was check-then-insert with no backstop.** Fixed: the
  check and the INSERT run in one transaction (`lib/db.js`
  `withTransaction`), re-checked inside; `duplicate_of` is now set to the
  matched report when `?force=true` is used.
- **Image upload partially applied on validation failure.** Earlier files
  stayed saved after a later file failed. Fixed: all files are validated
  (count, type, size, magic bytes) before any write; on later failure,
  written files + rows are removed.
- **Status update was not atomic.** File write, report UPDATE, and history
  INSERT could diverge. Fixed: UPDATE + history INSERT in one transaction
  (`UPDATE ... WHERE id=$ AND status=$old RETURNING`, concurrent change →
  409); the resolution file is deleted if the transaction fails.
- **Priority score went stale.** The age component was frozen at last
  create/support. Fixed: list endpoints sort by a SQL expression equivalent
  to the stored score but with the age component computed at query time; the
  stored `priority_score` stays as a snapshot.
- **`stats` returned `resolved_reports: null` on an empty DB.** Fixed:
  `COALESCE(SUM(...), 0)::int`; the 5 queries now run via `Promise.all` and
  the 30-day per-day series is zero-filled.
- **No security headers.** Fixed: `headers()` in `next.config.mjs` — CSP
  (self + OSM tile hosts; `script-src`/`style-src` keep `'unsafe-inline'`
  because Next.js needs it for RSC streaming), HSTS (production only),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`. The hardcoded dev LAN IP was removed from
  `allowedDevOrigins`.

### Medium
- **No pagination.** Both list endpoints had a hard `LIMIT 500`. Fixed:
  validated `limit` (default 50, cap 100) + `offset` (≥ 0), response now
  includes `{ reports, total }`.
- **Duplicate detection: longitude box too narrow; Urdu text false positives.**
  The 0.002° box was not corrected for latitude, and non-Latin text
  tokenized to empty sets that scored similarity 1. Fixed: longitude
  half-width is `delta / cos(lat)`; an empty token set on either side means
  similarity 0. Candidate query now has `LIMIT 50` and a
  `(category_id, latitude, longitude)` index was added.
- **Reopening a resolved report left stale resolution data.** Fixed: any
  transition out of `resolved` NULLs all four resolution columns.
- **`computePriority` failure after a successful write returned 500.**
  Fixed: the recompute is best-effort (try/catch + log) in both report
  create and support toggle.
- **Auth email not normalized; no length checks.** Fixed: email trimmed +
  lowercased, format regex, name ≤ 100, email ≤ 150, password must be a
  string.
- **Weak password policy (6 chars, no max).** Fixed: 8–72 chars.
- **Self-support inflated priority.** Fixed: supporting your own report is a
  403.
- **Admin delete: concurrent deletes lied, files leaked.** Fixed:
  `DELETE ... RETURNING` with a rowCount check (404 if 0); the report's
  local upload files are deleted best-effort.
- **`db.js` pool had no error handler/timeouts/config validation.** Fixed:
  `pool.on('error')`, `max: 10`, connection/query timeouts, and a clear
  error when `DATABASE_URL` is unset. The pool is created lazily on first
  use (not at import) so `next build` works without env vars set.
- **Same-status PATCH returned 400.** Fixed: idempotent 200 no-op.
- **Login timing leaked account existence.** Fixed: the miss path runs a
  dummy `bcrypt.compare` so timing is similar.
- **New-report photo upload failure silently swallowed.** Fixed: the form
  validates type/size client-side and checks the upload response; on
  failure it stays on the form with an error instead of navigating to a
  photo-less report.
- **Support button failed silently and counts disagreed.** Fixed: failures
  show an error in the button; success calls `router.refresh()` so the
  server-rendered header count updates.
- **Admin stats went stale after mutations.** Fixed: `/api/stats` is
  refetched after every status change, resolution, and delete.
- **DB errors disguised as "no reports".** Fixed: home and `/reports` now
  render a distinct "Could not load reports — try again" error state.
- **Categories hardcoded in two places.** Fixed: new `GET /api/categories`;
  both pages use it (hardcoded list kept as a fallback only).
- **No client-side lat/lng range validation.** Fixed: lat outside [-90, 90]
  / lng outside [-180, 180] is rejected before submit.
- **Broken image URLs had no fallback.** Fixed: a `ReportImage` component
  renders a "Photo unavailable" box on error (report photos + resolution
  proof).
- **Admin multi-column sort toggle broken for secondary sorts.** Fixed:
  Shift+click now toggles the existing column's direction.
- **Logged-in users could open `/login` and `/register`.** Fixed: redirect
  to `/` (admin → `/admin`) when already signed in.
- **Map components did not validate coordinates.** Fixed: non-finite
  coordinates are filtered; the detail map renders a "Location
  unavailable" fallback.

### Low
- **Query params not allowlist-validated.** `category_id=abc` 500'd; unknown
  `status` was passed through. Fixed: `category_id` must be an integer
  (400 otherwise), unknown `status` is ignored.
- **Per-row support-count subquery on both list endpoints.** Fixed: a single
  `LEFT JOIN` aggregate.
- **Font variables pointed at unloaded fonts.** Fixed: `--font-sans` now maps
  to the loaded Inter stack; the Arial body override was removed.
- **Small accessibility gaps.** Fixed: labels/`aria-pressed` on the admin
  status select and category/severity buttons, Escape-to-close on the
  resolve modal, pre-mount theme toggle disabled. (A full focus trap for
  the modal was not added — see "left alone" below.)
- **Root README was stale.** It described an Express `server/` that does not
  exist. Fixed: root and `client/` READMEs rewritten for the real Next.js
  app (env vars, `pnpm install` / `pnpm dev` / `pnpm build`, schema path).
- **Pre-existing lint error in `ThemeProvider`.** `setState` synchronously
  in an effect (`react-hooks/set-state-in-effect`). Fixed by deferring the
  mount-time sync with `queueMicrotask`.

## Deliberately left alone

- **Email verification on registration:** no mail service is configured;
  needs a provider decision. Mitigated by rate limiting + password policy.
- **Register 409 "Email already registered":** kept as-is. Changing it
  would break the register UX with no verification-email flow behind it.
- **Public precise coordinates + reporter names on the public list/detail:**
  by design (public community map). Noted as a privacy consideration.
- **Refresh-token flow / server-side token revocation:** future work.
  Mitigated by the DB role re-check on every authenticated request
  (`lib/auth.js`) and the 7-day JWT expiry.
- **Per-user upload quotas / authenticated image serving:** uploads are
  public by design for a community map; a Supabase Storage phase gives
  signed-URL options later.
- **Status transition map:** not enforced — admin freedom is intentional.
  Setting the same status again is an idempotent 200 no-op.
- **Duplicate `MIN_SIMILARITY = 0.25`:** left as a tuning knob
  (`lib/duplicate.service.js`).
- **Password policy:** 8–72 chars, no complexity rules (kept simple).
- **Full focus trap for the resolve modal:** not added — Escape-to-close and
  a close button are in place; a trap needs a more invasive modal rework.
- **Frontend U1–U3** (admin blank flash, LocationPicker recentre on drag,
  timeline dates on status regression): unconfirmed, need a live browser
  check; not changed.
- **Security unconfirmed items** (deployed JWT secret strength, DB SSL,
  whether the seed ran on production): cannot be verified from code.

## Notes on fixes

- **Rate limiting** (`lib/rate-limit.js`) is in-memory per process.
  A multi-instance production deployment needs a shared store
  (e.g. Upstash Redis) instead.
- **Priority score:** the stored `priority_score` column is a snapshot
  (written at create/support time). List endpoints sort by an equivalent
  SQL expression with the age component computed at query time, so the
  sort never goes stale. The SQL cap matches the stored formula
  (`LEAST(support_count, 50)`); the findings draft said 25, but the code
  (`lib/priority.service.js`, `SUPPORT_CAP = 50`) uses 50, so 50 is what
  the query uses to stay equivalent.
- **Admin list ordering:** the admin list sorts by `created_at DESC`, not
  by priority, so the fresh-age expression is only applied to the public
  list (the one that sorts by priority).
- **CSP** (`next.config.mjs`): `script-src`/`style-src` keep
  `'unsafe-inline'` because Next.js renders inline scripts/styles for
  RSC streaming; a bare `'self'` would break hydration.
- **Cookie auth:** `fixmyarea_token`, httpOnly, `SameSite=Lax`, `Path=/`,
  7-day maxAge, `Secure` in production only. Login/register set the
  cookie and return `{ user }` only; `POST /api/auth/logout` clears it.
- **Lazy env validation:** `DATABASE_URL` and `JWT_SECRET` are validated on
  first use rather than at import, because Next.js imports every route
  module during `next build` — an import-time throw fails the build in any
  environment without the vars set. The first real request still fails fast
  with a clear error.
- **Env vars needed to run:** `DATABASE_URL`, `JWT_SECRET` (≥ 32 chars),
  and `ADMIN_PASSWORD` for the seed script only. See `client/README.md`.

## Supabase migration (2026-11-15)

Project creation via the Management API was NOT possible in this
session: the stored Supabase Personal Access Token is rejected with
`{"message":"Invalid access token"}` (HTTP 401) on both the
Management API (`GET /v1/organizations`) and the database query
endpoint (`sb_curl.py`, project `qjhflkjgybyqbvlnvkwu`). No new
project exists yet, so no project ref, URL, or keys exist to report,
and no database password was generated — the user creates the
project himself (see below) and chooses its database password there.

What was done anyway (code + single-file setup, ready to run once
the project exists):

- **Setup SQL:** `~/workspace/your_files/fixmyarea-supabase-setup.sql`
  — the full schema from `client/db/schema.sql` (table portion
  verified byte-identical after whitespace normalisation), plus a
  public `report-images` Storage bucket and four storage policies
  (public read; upload/update/delete scoped to the bucket). The file
  parses cleanly with PostgreSQL's own parser (pglast/libpg_query,
  14 statements) and is idempotent — safe to re-run. Run it once in
  the Supabase SQL Editor. The app uses its own JWT, NOT Supabase
  Auth, so the bucket works with the service-role key from the
  server; no `auth.uid()` policies are needed.
- **Data layer (`client/src/lib/db.js`):** `pg` Pool kept; when
  `DATABASE_URL` carries `?sslmode=require` (the Supabase pooler
  URL, port 6543) the pool now passes `ssl: { rejectUnauthorized:
  false }` explicitly, because node-postgres only honours sslmode
  for direct connections. Plain local Postgres URLs are unchanged.
- **Storage (`client/src/lib/storage.js`, new):** `@supabase/supabase-js`
  (2.119.0, the only new dependency) used for Storage only —
  `uploadToBucket` / `deleteFromBucket` / `deleteByUrl`, server-only,
  service-role key, no session persistence. Report photos go to
  `reports/<reportId>-<uuid>.<ext>`, resolution photos to
  `resolutions/<reportId>-<uuid>.<ext>`; the public Storage URL is
  what lands in `report_images.url` /
  `reports.resolution_image_url`.
- **Image upload route** (`api/reports/[id]/images/route.js`):
  local-disk writes replaced by Storage uploads. Type/size/
  magic-byte validation (`lib/upload.js`) and the 3-file cap are
  unchanged; rollback now deletes the uploaded Storage objects as
  well as the DB rows.
- **Resolution upload** (`api/admin/reports/[id]/status/route.js`):
  same move, under the `resolutions/` prefix; rollback deletes the
  uploaded object on transaction failure / concurrent change.
- **Admin delete** (`api/admin/reports/[id]/route.js`): cleanup now
  goes through `deleteByUrl`, which deletes Storage objects for
  Supabase URLs and still removes legacy pre-migration
  `/uploads/...` local files, so deleting old reports still cleans up.
- **`client/.env.example` (new):** `DATABASE_URL` (pooler),
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` — placeholders only.
  `.gitignore` now whitelists `.env.example` for commit (it was
  covered by `.env*`); `.env.local` stays ignored and was never created.
- **`client/db/seed-admin.mjs`:** same SSL rule as `db.js` for pooler
  URLs. The admin was NOT created: the seed needs `ADMIN_PASSWORD`
  from the environment and no password was (or will be) invented.
  The user runs, from `client/` with their own password:
  `ADMIN_PASSWORD='<chosen-password>' node db/seed-admin.mjs`

Verified: `cd client && pnpm install && pnpm lint && pnpm build`
all pass (18 routes). The setup SQL's table portion parses via
pglast and matches `schema.sql`. NOT verified live — no Supabase
project/keys exist in this session, so the setup SQL was never run
against Supabase, the 5 categories were never confirmed landed,
and no end-to-end check (register/login/report/support/image
upload, rows + Storage object in Supabase) was possible. No local
Postgres exists on this machine either, so there was no local-DB
substitute. These steps are still owed after the project is created.

Steps for the user (once the project exists):
1. Create the project in the Supabase Dashboard ("fixmyarea",
   region ap-south-1 if offered, else eu-central-1) and note the
   database password chosen there.
2. SQL Editor > paste `fixmyarea-supabase-setup.sql` > Run. Verify
   with: `select tablename from pg_tables where schemaname =
   'public';` (expect users, categories, reports, report_images,
   supports, status_history) and `select * from categories;`
   (expect the 5 rows), and Storage > `report-images` bucket listed.
3. Copy `client/.env.example` to `client/.env.local`, fill in
   `DATABASE_URL` (Settings > Database > Transaction pooler),
   project URL + anon key + service-role key (Settings > API),
   and `JWT_SECRET`.
4. `ADMIN_PASSWORD='<chosen-password>' node db/seed-admin.mjs`
   from `client/` (admin: admin@fixmyarea.pk).
5. `pnpm dev`, then exercise register/login/create-report/list/
   support/image-upload and confirm rows + the Storage object land
   in the Supabase Dashboard. Also fix the stored Supabase token
   (Dashboard > Account > Access Tokens > new token, then reconnect
   the `custom.supabase` connector) so future API work is possible.

Future option (not done, out of scope): move auth to Supabase Auth
and drop the custom JWT + bcrypt login. That would change the login/
register routes, the cookie session, and the admin seed; the Storage
policies could then use `auth.uid()` instead of the service-role key.
