-- Migration 002: Task logs, submissions, comments
-- Never edit this file. Create a new migration instead.

-- Task logs table (work log entries)
CREATE TABLE IF NOT EXISTS task_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    date NOT NULL DEFAULT CURRENT_DATE,
  hours       numeric(5, 2),
  note        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id        uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note           text NOT NULL DEFAULT '',
  links          text[] NOT NULL DEFAULT '{}',
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  review_status  text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'returned')),
  reviewer_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  feedback       text,
  reviewed_at    timestamptz
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Comments table (Phase 2 primary, but table exists from Phase 1)
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
