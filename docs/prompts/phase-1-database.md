# Prompt: Phase 1 — Database & RLS Engineer (agent-db)

You are building the database foundation for the NexGenU Workforce Dashboard.
Read CLAUDE.md and docs/phases/phase-1.md in full before writing any code.

## Your Deliverables

Create the following migration files in supabase/migrations/:

### 001_initial_schema.sql
Create these tables with all columns, types, and constraints:
- users (id uuid PK, email text unique, full_name text, role text CHECK IN (admin,head), pillar_id uuid nullable FK→pillars, active bool default true, created_at timestamptz default now())
- pillars (id uuid PK default gen_random_uuid(), name text unique, nickname text, created_at timestamptz default now())

### 002_tasks.sql
- tasks (id uuid PK, title text NOT NULL, description text, pillar_id uuid FK→pillars NOT NULL, assignee_id uuid FK→users NOT NULL, created_by uuid FK→users NOT NULL, priority text CHECK IN (low,medium,high,critical) default medium, status text CHECK IN (not_started,in_progress,blocked,submitted,returned,approved) default not_started, due_date date NOT NULL, kpi_ref text, recurrence text CHECK IN (none,weekly,monthly) default none, archived bool default false, block_reason text, created_at timestamptz default now(), updated_at timestamptz default now())
- Add updated_at trigger function and trigger on tasks

### 003_logs_submissions.sql
- task_logs (id uuid PK, task_id uuid FK→tasks ON DELETE CASCADE, user_id uuid FK→users, log_date date NOT NULL, hours numeric(4,1), note text NOT NULL, created_at timestamptz default now(), locked bool default false)
- submissions (id uuid PK, task_id uuid FK→tasks ON DELETE CASCADE, user_id uuid FK→users, note text, links text[], file_paths text[], submitted_at timestamptz default now(), review_status text CHECK IN (pending,approved,returned) default pending, reviewer_id uuid FK→users nullable, feedback text, reviewed_at timestamptz)
- comments (id uuid PK, task_id uuid FK→tasks ON DELETE CASCADE, user_id uuid FK→users, body text NOT NULL, created_at timestamptz default now())

### 004_extensions_notifications.sql
- extension_requests (id uuid PK, task_id uuid FK→tasks ON DELETE CASCADE, requested_by uuid FK→users, proposed_date date NOT NULL, reason text NOT NULL, status text CHECK IN (pending,approved,declined) default pending, decided_by uuid FK→users nullable, decision_note text, decided_at timestamptz, created_at timestamptz default now())
- Add UNIQUE constraint: only one pending extension per task
  UNIQUE (task_id) WHERE status = 'pending'
- notifications (id uuid PK, user_id uuid FK→users ON DELETE CASCADE, type text NOT NULL, task_id uuid FK→tasks nullable, message text NOT NULL, read bool default false, created_at timestamptz default now())
- audit_log (id uuid PK, actor_id uuid FK→users, action text NOT NULL, entity text NOT NULL, entity_id uuid NOT NULL, before jsonb, after jsonb, created_at timestamptz default now())

### 005_rls_policies.sql
Enable RLS on EVERY table. Write the following policies:

PILLARS — everyone authenticated can read:
  SELECT: auth.role() = 'authenticated'

USERS — users read own row; admins read all:
  SELECT: auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'

TASKS — heads see own pillar only; admins see all:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
  INSERT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  UPDATE: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR (assignee_id = auth.uid() AND status NOT IN ('approved'))
  DELETE: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'

TASK_LOGS — head logs only own assigned tasks; admins see all:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR user_id = auth.uid()
  INSERT: user_id = auth.uid()
          AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.assignee_id = auth.uid())
  UPDATE: user_id = auth.uid() AND locked = false
          AND created_at > now() - interval '24 hours'

SUBMISSIONS — same pillar isolation as tasks:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR user_id = auth.uid()
  INSERT: user_id = auth.uid()
          AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.assignee_id = auth.uid())

COMMENTS — same pillar isolation:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id
                     AND tasks.pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid()))
  INSERT: auth.role() = 'authenticated'

EXTENSION_REQUESTS — head sees own; admin sees all:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          OR requested_by = auth.uid()
  INSERT: requested_by = auth.uid()

NOTIFICATIONS — user sees only own:
  SELECT: user_id = auth.uid()
  UPDATE: user_id = auth.uid()  -- for marking read

AUDIT_LOG — admin read-only; insert via service role only:
  SELECT: (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  INSERT: false  -- handled by service role in server actions
  -- No UPDATE, no DELETE policies

### 006_seed_pillars.sql
Insert the 5 pillars:
  (Strategy & Partnerships, The Visionaries)
  (Product & Technology, The Builders)
  (Content & Curriculum, The Educators)
  (Growth & Media, The Amplifiers)
  (Operations & Student Success, The Engine Room)

## Verification
After writing all migrations, confirm:
- Every table has RLS enabled
- A head user JWT with pillar_id X can ONLY see tasks where pillar_id = X
- audit_log has no UPDATE or DELETE policy
- The unique partial index on extension_requests prevents two pending requests per task
