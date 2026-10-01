# Phase 1 — Core MVP

> Agents: agent-db, agent-auth, agent-ui, agent-cmd, agent-head, agent-notif, agent-qa
> Goal: End-to-end task lifecycle — Admin creates, Head completes, Admin approves.

---

## Scope

### Auth & Roles
- [ ] Login page with email + password and magic-link option
- [ ] Supabase Auth integration with custom JWT claims (role, pillar_id)
- [ ] Middleware protecting all /command and /head routes
- [ ] Role-based redirect: Admin → /command, Head → /head
- [ ] User invite flow (Admin sends email invite via Supabase)

### Database (migrations 001–006)
- [ ] users table (id, email, full_name, role, pillar_id, active, created_at)
- [ ] pillars table (id, name, nickname) — seeded with all 5
- [ ] tasks table (id, title, description, pillar_id, assignee_id, created_by, priority, status, due_date, kpi_ref, recurrence, archived, created_at, updated_at)
- [ ] task_logs table (id, task_id, user_id, log_date, hours, note, created_at)
- [ ] submissions table (id, task_id, user_id, note, links[], submitted_at, review_status, reviewer_id, feedback, reviewed_at)
- [ ] notifications table (id, user_id, type, task_id, message, read, created_at)
- [ ] audit_log table (id, actor_id, action, entity, entity_id, before, after, created_at) — insert-only
- [ ] RLS policies on every table (pillar isolation enforced at DB level)

### Design System & Shared Components
- [ ] globals.css with all CSS custom properties (brand colors, typography)
- [ ] Nohemi font loaded via next/font/local
- [ ] Sidebar (collapsible, mobile drawer)
- [ ] TopBar (search, notifications bell, user menu)
- [ ] MobileNav bottom bar
- [ ] StatusBadge component
- [ ] PriorityBadge component
- [ ] SummaryCard (metric card with icon, value, label)
- [ ] TaskCard (list row with title, status, priority, due date)
- [ ] EmptyState component
- [ ] LoadingSpinner / Skeleton loaders
- [ ] ConfirmDialog (reusable)

### Command Dashboard (Admin)
- [ ] Summary cards row: Open, Overdue, Due This Week, Awaiting Review, Blocked
- [ ] All Tasks table with filters (pillar, status, priority, due date) and sort
- [ ] Create Task form (title, description, pillar, head, priority, due date, kpi_ref)
- [ ] Task Detail page — admin view (full info, approve/return controls)
- [ ] Review Queue section (submitted tasks, oldest first, Approve + Return actions)
- [ ] Return modal — required feedback text field
- [ ] Head receives in-app notification on task creation
- [ ] Overdue flag computed and displayed correctly

### Head Dashboard (Pillar Head)
- [ ] My Focus section (overdue + due today, pinned at top)
- [ ] Summary cards: Assigned, In Progress, Due This Week, Returned, Approved This Month
- [ ] Tabbed task list: To Do | In Progress | Blocked | Submitted | Returned | Done
- [ ] Task Detail page — head view
  - [ ] Status controls: Start Work, Mark Blocked (reason required), Mark In Progress
  - [ ] Work Log: add entry (date, hours optional, note), list of entries
  - [ ] Work log entries locked for editing after 24 hours
  - [ ] Submit for Review form (note required if no link, optional link field)
  - [ ] Returned feedback banner (shown prominently when status = Returned)
- [ ] Head sees only own pillar tasks (enforced server-side + RLS)

### In-App Notifications
- [ ] Bell icon in TopBar with unread count badge
- [ ] Notification list panel (slide-in or dropdown)
- [ ] Supabase Realtime subscription for live updates
- [ ] Mark as read on click
- [ ] Notification triggers:
  - New task assigned → Head
  - Task due in 24 hours → Head
  - Task became overdue → Head + Admin
  - Work submitted → Admin
  - Submission approved or returned → Head

---

## Acceptance Tests (All Must Pass Before Phase 2 Starts)

1. A Head logged in as Builders CANNOT see, open, or edit any Educators
   task — including by direct URL or direct Supabase API call.

2. An Admin creates a task for a Head; the Head sees it within one
   page refresh and receives an in-app notification.

3. A Head can move a task to In Progress, add two work log entries,
   then submit with a link. Admin sees the task in the Review Queue.

4. Admin returns the submission with feedback text. The Head sees the
   feedback banner at the top of the task detail page and can resubmit.

5. Admin approves a submission. The task shows status Approved and is
   no longer counted as Open or Overdue.

6. A task past its due date and not Approved shows an overdue flag
   for both Admin (Command Dashboard) and Head (Head Dashboard).

7. Every state change, submission, approval, and return appears in
   the audit_log table with the correct actor and timestamp.

---

## Definition of Done

- All items above checked off
- No TypeScript errors (npx tsc --noEmit passes)
- No ESLint errors (npm run lint passes)
- All 7 acceptance tests documented as passing
- Deployed to preview environment and smoke-tested on mobile (375px)
