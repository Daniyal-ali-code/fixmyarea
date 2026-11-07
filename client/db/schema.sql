-- FixMyArea - Full database schema
-- Run this once on a fresh PostgreSQL database to set up all tables.
-- Usage: psql -U fixmyarea_user -d fixmyarea_db -f db/schema.sql

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(50) UNIQUE NOT NULL,
  icon  VARCHAR(50)
);

INSERT INTO categories (name, icon) VALUES
  ('Road',        'road'),
  ('Garbage',     'trash'),
  ('Water',       'droplet'),
  ('Streetlight', 'lightbulb'),
  ('Other',       'alert-circle')
ON CONFLICT (name) DO NOTHING;

-- REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id    INT NOT NULL REFERENCES categories(id),
  title          VARCHAR(150) NOT NULL,
  description    TEXT NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  severity       SMALLINT NOT NULL DEFAULT 2 CHECK (severity BETWEEN 1 AND 5),
  status         VARCHAR(20) NOT NULL DEFAULT 'reported'
                 CHECK (status IN ('reported', 'under_review', 'in_progress', 'resolved')),
  priority_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  duplicate_of   INT REFERENCES reports(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_location ON reports (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_user     ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports (category_id);

-- REPORT IMAGES
CREATE TABLE IF NOT EXISTS report_images (
  id         SERIAL PRIMARY KEY,
  report_id  INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUPPORTS ("me too" upvotes)
CREATE TABLE IF NOT EXISTS supports (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id  INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, report_id)
);

-- STATUS HISTORY (audit trail for status changes)
CREATE TABLE IF NOT EXISTS status_history (
  id         SERIAL PRIMARY KEY,
  report_id  INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INT REFERENCES users(id),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
