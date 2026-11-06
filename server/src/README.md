# FixMyArea

A smart community issue reporting and tracking platform. Residents can report local problems (potholes, broken streetlights, garbage, water leaks) with photos and map locations, track their status, and support issues that matter to them.

## Project Status

**Backend: Phase 3 complete**

- ✅ PostgreSQL database with 5 tables
- ✅ JWT-based authentication (register, login, protected routes)
- ✅ Reports API (create, list, get, support/upvote)

**In progress:** Duplicate detection and priority scoring (Phase 4)

## Tech Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Backend            | Node.js, Express.js     |
| Database           | PostgreSQL              |
| Auth               | bcrypt, JSON Web Tokens |
| Frontend (planned) | Next.js, Tailwind CSS   |
| Map (planned)      | Leaflet + OpenStreetMap |

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Daniyal-ali-code/fixmyarea.git
cd fixmyarea

# 2. Install backend dependencies
cd server
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Create the database
sudo -u postgres psql
# CREATE USER fixmyarea_user WITH PASSWORD 'your_password';
# CREATE DATABASE fixmyarea_db OWNER fixmyarea_user;
# \q

# 5. Run migrations (see server/db/schema.sql)
psql -U fixmyarea_user -d fixmyarea_db -f db/schema.sql

# 6. Start the development server
npm run dev
```
