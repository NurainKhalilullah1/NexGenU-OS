# AGENTS.md — NexGenU Workforce Dashboard
# Multi-Agent Orchestration Guide

> Read CLAUDE.md first. This file extends it with agent-specific
> roles, handoff rules, and per-phase responsibilities.

---

## 1. Agent Roster

| Agent ID       | Role                        | Phase Scope      |
|----------------|-----------------------------|------------------|
| `agent-arch`   | Architect & Planner         | All phases       |
| `agent-db`     | Database & RLS Engineer     | All phases       |
| `agent-ui`     | UI / Component Builder      | All phases       |
| `agent-auth`   | Auth & Middleware Engineer  | Phase 1          |
| `agent-cmd`    | Command Dashboard Engineer  | Phase 1, 3       |
| `agent-head`   | Head Dashboard Engineer     | Phase 1, 2       |
| `agent-notif`  | Notifications Engineer      | Phase 1, 2       |
| `agent-email`  | Email & Digest Engineer     | Phase 2          |
| `agent-collab` | Comments & Extensions Eng.  | Phase 2          |
| `agent-audit`  | Audit Log Engineer          | Phase 2          |
| `agent-report` | Reports & Analytics Eng.    | Phase 3          |
| `agent-qa`     | QA & Acceptance Tester      | All phases       |

---

## 2. Universal Rules (All Agents Must Follow)

1. **Read CLAUDE.md before any code.** The design system, stack, and
   security rules there are non-negotiable.
2. **Never write raw SQL in a component or page.** Always use
   `lib/db/*.ts` query helpers.
3. **RLS first.** No feature is "done" until its database tables have
   RLS policies that pass the pillar isolation test.
4. **Use Nohemi font** (self-hosted, `public/fonts/`). Never swap to
   another font.
5. **Brand colors only.** Never introduce a color outside the palette
   in CLAUDE.md §3.1.
6. **Server Actions for mutations.** No client-side POST to `/api`
   for data changes.
7. **Return `{ data, error }` from every Server Action.**
8. **Test your own work** against the acceptance criteria in the
   relevant `docs/phases/phase-N.md` before marking a task done.
9. **Write a migration** for every schema change. Never edit an
   existing migration file.
10. **Leave a comment** in `docs/decisions.md` if you make any
    architectural choice not already documented.

---

## 3. Agent Responsibilities by Phase

### Phase 1 — Core MVP

```
agent-db   →  migrations 001-004, RLS policies, seed pillars
agent-auth →  login page, middleware, session helpers, role JWT claim
agent-ui   →  design tokens, Sidebar, TopBar, MobileNav, StatusBadge,
              PriorityBadge, TaskCard, SummaryCard, EmptyState
agent-cmd  →  Command Dashboard page, Create Task form, All Tasks table,
              Review Queue, Task Detail (admin view)
agent-head →  Head Dashboard page, My Focus section, Tabbed task list,
              Task Detail (head view), Work Log, Submit form
agent-notif→  in-app notification bell, notification list, Supabase
              Realtime subscription, unread count badge
agent-qa   →  run all 7 Phase 1 acceptance tests; document results
```

### Phase 2 — Collaboration

```
agent-collab→  Comments thread component, Extension Request form,
               Extension decision (admin), extension status badge
agent-audit →  Audit log table, audit log viewer page (admin only),
               audit entries on every state change
agent-email →  Google SMTP integration, email templates (task assigned,
               overdue, submission, approval/return, extension decided),
               daily digest for heads, per-user notification settings
agent-head  →  File upload UI (Supabase Storage), submission history,
               returned feedback banner
agent-notif →  Email toggle settings page, digest preview
agent-qa    →  run all Phase 2 acceptance tests
```

### Phase 3 — Insight

```
agent-cmd   →  Pillar workload view with Recharts bar chart,
               bulk-assign modal, recurring task UI, KPI ref field
agent-report→  Reports page, CSV export (filtered tasks + stats),
               "what is overdue" summary card
agent-qa    →  run all Phase 3 acceptance tests
```

---

## 4. Handoff Protocol

When an agent finishes a task it must:

1. Confirm all acceptance criteria in the relevant phase doc are met.
2. Ensure no TypeScript errors (`npx tsc --noEmit`).
3. Ensure no ESLint errors (`npm run lint`).
4. Write any new env vars to `.env.example` (empty values only).
5. Update `docs/decisions.md` with any non-obvious choices made.
6. Post a one-line summary:
   `[agent-id] done: <what was built> | tests: pass | migrations: N`

---

## 5. Shared Component Contracts

### StatusBadge
```tsx
// components/tasks/StatusBadge.tsx
type Status = 'not_started' | 'in_progress' | 'blocked' |
              'submitted' | 'returned' | 'approved'

<StatusBadge status={status} showIcon />
```
Colors per CLAUDE.md §3.2. Always includes text label — never color alone.

### PriorityBadge
```tsx
type Priority = 'low' | 'medium' | 'high' | 'critical'
<PriorityBadge priority={priority} />
```
Colors per CLAUDE.md §3.3.

### SummaryCard
```tsx
<SummaryCard
  label="Overdue"
  value={12}
  trend="up"         // optional
  color="orange"     // 'accent' | 'orange' | 'lavender' | 'white'
  icon={AlertCircle}
/>
```

### TaskCard (list row)
```tsx
<TaskCard
  task={task}
  onClick={() => router.push(`/command/tasks/${task.id}`)}
  showPillar    // only in Command Dashboard
/>
```

---

## 6. Database Migration Naming

```
supabase/migrations/
  001_initial_schema.sql         # users, pillars, tasks
  002_task_logs_submissions.sql  # task_logs, submissions, comments
  003_extensions_notifs.sql      # extension_requests, notifications
  004_audit_log.sql              # audit_log (append-only)
  005_rls_policies.sql           # all RLS policies
  006_seed_pillars.sql           # 5 pillars seeded
```

---

## 7. Security Test Checklist (Run Before Any PR)

- [ ] Head A cannot GET `/head/tasks/[id]` where task.pillar_id != Head A pillar
- [ ] Head A calling the Server Action for another pillar returns error
- [ ] Direct Supabase API call with Head A anon key returns 0 rows for another pillar
- [ ] Admin can see all tasks across all pillars
- [ ] `audit_log` has no UPDATE or DELETE policy
- [ ] `service_role` key is not present in any client bundle (check `next build` output)
