-- Migration 004: Audit log (insert-only — no UPDATE or DELETE policies ever)
-- Never edit this file. Create a new migration instead.

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action      text NOT NULL,   -- e.g. 'task.created', 'task.status_changed', 'submission.approved'
  entity      text NOT NULL,   -- e.g. 'tasks', 'submissions'
  entity_id   uuid NOT NULL,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is INSERT-ONLY; no UPDATE or DELETE will ever be granted.
-- SELECT: admins only. INSERT: any authenticated user (server-side code).
