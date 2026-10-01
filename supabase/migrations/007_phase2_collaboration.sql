-- Migration 007: Phase 2 Collaboration Schema
-- Comments, extension request enhancements, storage file paths, and notification preferences
-- Never edit this file after creation.

-- 1. Notifications: Support new_comment and extension_requested notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'task_assigned',
  'task_due_soon',
  'task_overdue',
  'submission_received',
  'submission_approved',
  'submission_returned',
  'extension_decided',
  'new_comment',
  'extension_requested'
));

-- 2. Extension Requests: Support decision_note and declined status
ALTER TABLE extension_requests DROP CONSTRAINT IF EXISTS extension_requests_status_check;
ALTER TABLE extension_requests ADD CONSTRAINT extension_requests_status_check CHECK (
  status IN ('pending', 'approved', 'declined', 'denied')
);
ALTER TABLE extension_requests ADD COLUMN IF NOT EXISTS decision_note text;

-- Enforce maximum of one pending extension request per task
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_extension_per_task
  ON extension_requests (task_id)
  WHERE status = 'pending';

-- 3. Submissions: Support multiple file attachments
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_paths text[] NOT NULL DEFAULT '{}';

-- 4. Notification Settings: Per-user preferences for email & digests
CREATE TABLE IF NOT EXISTS notification_settings (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications       boolean NOT NULL DEFAULT true,
  email_task_assigned       boolean NOT NULL DEFAULT true,
  email_task_due_soon       boolean NOT NULL DEFAULT true,
  email_task_overdue        boolean NOT NULL DEFAULT true,
  email_submission_received boolean NOT NULL DEFAULT true,
  email_submission_approved boolean NOT NULL DEFAULT true,
  email_submission_returned boolean NOT NULL DEFAULT true,
  email_extension_requested boolean NOT NULL DEFAULT true,
  email_extension_decided   boolean NOT NULL DEFAULT true,
  email_new_comment         boolean NOT NULL DEFAULT true,
  daily_digest              boolean NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_settings_select_own_or_admin" ON notification_settings
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "notification_settings_update_own" ON notification_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notification_settings_insert_own_or_service" ON notification_settings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'authenticated'
  );

-- Auto-update updated_at for notification_settings
DROP TRIGGER IF EXISTS notification_settings_updated_at ON notification_settings;
CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Private Storage Bucket for Task Submissions (50MB limit)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES (
      'task-submissions',
      'task-submissions',
      false,
      52428800 -- 50MB
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 52428800;
  END IF;
END $$;
