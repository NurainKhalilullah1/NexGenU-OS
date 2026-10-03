-- Migration 008: Add member role + internal_submissions table
-- Never edit this file. Create a new migration instead.

-- Add 'member' to the allowed roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'head', 'member'));

-- internal_submissions: member submits work to head for review
-- distinct from public.submissions which is head -> admin
CREATE TABLE IF NOT EXISTS internal_submissions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submitted_by  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes         text NOT NULL DEFAULT '',
  file_urls     text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'returned')),
  head_feedback text,
  reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE internal_submissions ENABLE ROW LEVEL SECURITY;

-- RLS: members see their own; heads see all in their pillar; admins see all
CREATE POLICY "int_sub_select" ON internal_submissions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN users u ON u.id = auth.uid()
      WHERE t.id = task_id
        AND t.pillar_id = u.pillar_id
        AND u.role = 'head'
    )
  );

-- Members can insert if they are the task assignee
CREATE POLICY "int_sub_insert" ON internal_submissions
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND assignee_id = auth.uid()
    )
  );

-- Heads can update (approve/return) submissions in their pillar
CREATE POLICY "int_sub_update_head" ON internal_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN users u ON u.id = auth.uid()
      WHERE t.id = task_id
        AND t.pillar_id = u.pillar_id
        AND u.role = 'head'
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );
