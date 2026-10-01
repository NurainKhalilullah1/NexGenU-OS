-- Migration 003: Extension requests and notifications
-- Never edit this file. Create a new migration instead.

-- Extension requests table
CREATE TABLE IF NOT EXISTS extension_requests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requester_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_date   date NOT NULL,
  requested_date  date NOT NULL,
  reason          text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewer_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE extension_requests ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'task_assigned', 'task_due_soon', 'task_overdue',
                'submission_received', 'submission_approved',
                'submission_returned', 'extension_decided'
              )),
  task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE,
  message     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
