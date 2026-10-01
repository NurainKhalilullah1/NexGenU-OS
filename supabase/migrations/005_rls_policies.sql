-- Migration 005: RLS Policies — pillar isolation enforced at DB level
-- Never edit this file. Create a new migration instead.

-- ===== PILLARS =====
-- Anyone authenticated can read pillars
CREATE POLICY "pillars_select_authenticated" ON pillars
  FOR SELECT USING (auth.role() = 'authenticated');

-- ===== USERS =====
-- Users can read their own row; admins can read all
CREATE POLICY "users_select_self_or_admin" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Only service role (server actions) can insert / update users
CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ===== TASKS =====
-- Heads see only their pillar; admins see all
CREATE POLICY "tasks_select_pillar_or_admin" ON tasks
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
  );

-- Only admins may create tasks
CREATE POLICY "tasks_insert_admin_only" ON tasks
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Admins can update any task; heads can only update tasks in their pillar
-- (status transitions are validated in server actions)
CREATE POLICY "tasks_update_admin_or_head_own_pillar" ON tasks
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
  );

-- ===== TASK LOGS =====
-- Heads see logs on their pillar's tasks; admins see all
CREATE POLICY "task_logs_select_pillar_or_admin" ON task_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
    )
  );

-- Heads can only log on tasks assigned to them
CREATE POLICY "task_logs_insert_assignee" ON task_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.assignee_id = auth.uid()
    )
  );

-- Logs may not be updated or deleted after 24 hours (enforced server-side);
-- but we allow the row owner to update within the DB
CREATE POLICY "task_logs_update_owner" ON task_logs
  FOR UPDATE USING (user_id = auth.uid());

-- ===== SUBMISSIONS =====
CREATE POLICY "submissions_select_pillar_or_admin" ON submissions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "submissions_insert_assignee" ON submissions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.assignee_id = auth.uid()
    )
  );

CREATE POLICY "submissions_update_admin" ON submissions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ===== COMMENTS =====
CREATE POLICY "comments_select_pillar_or_admin" ON comments
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (user_id = auth.uid());

-- ===== EXTENSION REQUESTS =====
CREATE POLICY "ext_select_pillar_or_admin" ON extension_requests
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR requester_id = auth.uid()
  );

CREATE POLICY "ext_insert_assignee" ON extension_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.assignee_id = auth.uid()
    )
  );

CREATE POLICY "ext_update_admin" ON extension_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ===== NOTIFICATIONS =====
-- Users only see their own notifications
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Server actions insert notifications for any user (service role bypasses RLS)
-- Client-visible insert: not needed — server-side only
CREATE POLICY "notif_insert_authenticated" ON notifications
  FOR INSERT WITH CHECK (true); -- protected at application layer; service role used

-- ===== AUDIT LOG =====
-- Only admins can read audit log
CREATE POLICY "audit_select_admin" ON audit_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Any authenticated user can insert (server-side server actions only)
CREATE POLICY "audit_insert_authenticated" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NO UPDATE or DELETE policies — insert-only forever
