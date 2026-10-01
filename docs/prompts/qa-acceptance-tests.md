# Prompt: QA & Acceptance Testing (agent-qa)

Run this after each phase is marked complete by the building agents.
Read docs/phases/phase-N.md for the exact acceptance criteria before testing.

---

## Setup

1. Seed the database with test data:
   - 1 Admin user (admin@nexgenu.com)
   - 5 Head users (one per pillar)
   - 10+ tasks spread across pillars with different statuses and due dates
   - Include at least 2 overdue tasks (due_date in the past, status != approved)

2. Run the app locally: npm run dev

3. Open two browser sessions:
   - Session A: logged in as Admin
   - Session B: logged in as a Head (e.g. Builders head)

---

## Phase 1 Acceptance Tests

### Test 1 — Pillar Isolation (CRITICAL)
Steps:
a. In Session B (Builders Head), note the URL of a Builders task: /head/tasks/[builders-task-id]
b. Find an Educators task ID from the database directly
c. Navigate Session B to /head/tasks/[educators-task-id]
Expected: 404 page. Task detail does NOT load.

d. Using the Supabase anon key + Builders Head JWT, call the Supabase REST API:
   GET /rest/v1/tasks?pillar_id=eq.[educators-pillar-id]
Expected: Empty array (0 rows). RLS blocks access.

FAIL CONDITION: If any Educators task data is visible to the Builders Head, stop and report immediately. This is a critical security failure.

### Test 2 — Task Creation & Notification
Steps:
a. In Session A (Admin), create a new task assigned to Builders Head.
b. In Session B, refresh the page.
Expected: New task appears in Builders Head dashboard.
Expected: Notification bell shows unread count increased by 1.
Expected: Opening notifications shows "You have been assigned: [task title]"

### Test 3 — Full Work Cycle
Steps:
a. Session B: Open the new task. Click "Start Work". Verify status → In Progress.
b. Session B: Add two work log entries (different dates, hours, notes).
c. Session B: Click "Submit for Review". Add a note and a link. Submit.
Expected: Task status → Submitted.
d. Session A: Open Review Queue. Verify task appears.
Expected: Admin notification shows "submitted work on: [task title]"

### Test 4 — Return & Resubmit
Steps:
a. Session A: Click "Return with Feedback" on the submitted task. Enter feedback text. Submit.
Expected: Task status → Returned.
b. Session B: Open the task.
Expected: Orange feedback banner at TOP of page with Admin's feedback text.
c. Session B: Click "Submit for Review" again. Submit with a new note.
Expected: Task status → Submitted again. New submission appears in history.

### Test 5 — Approval & Closure
Steps:
a. Session A: Approve the submission.
Expected: Task status → Approved.
b. Session A: Open Command Dashboard.
Expected: Task no longer counted in "Open Tasks" or "Overdue" cards.
c. Session B: Open the task.
Expected: Read-only state, "Approved" status badge, no action buttons shown.

### Test 6 — Overdue Flag
Steps:
a. Find or create a task with due_date = yesterday, status = in_progress.
b. Session A: Open Command Dashboard.
Expected: Task appears in "Overdue" summary count. Row has orange left border in All Tasks table.
c. Session B: Open Head Dashboard.
Expected: Task appears in "My Focus" section with overdue indicator.

### Test 7 — Audit Log
Steps:
a. After running Tests 1-6, Session A: navigate to /command/audit.
Expected: The following actions appear with correct actor and timestamps:
  - Task created (Admin)
  - Status changed to in_progress (Head)
  - Work log added x2 (Head)
  - Submission created (Head)
  - Status changed to returned (Admin)
  - Submission created again (Head)
  - Status changed to approved (Admin)

---

## Phase 2 Acceptance Tests

### Test 8 — Real-time Comments
a. Both sessions open the same task detail.
b. Session A posts a comment.
Expected: Comment appears in Session B WITHOUT page refresh (real-time).
Expected: Session B notification bell increments.

### Test 9 — Extension Request Flow
a. Session B: Request extension with new date + reason.
Expected: Pending badge on task. Extension widget on Admin command dashboard.
b. Session A: Approve the extension.
Expected: Task due date updates immediately. Session B notified.

### Test 10 — Email Delivery
a. Trigger a "Task Assigned" event.
Expected: Email received in test inbox within 60 seconds.
b. Check email: correct branding (dark teal bg, mint CTA, Nohemi-like font).

### Test 11 — Notification Settings
a. Session B: Turn off email for "New Comment" in /settings/notifications.
b. Session A: Post a comment on Session B's task.
Expected: Session B gets in-app notification but NO email.

---

## Phase 3 Acceptance Tests

### Test 12 — Workload View
a. Session A: Open /command. Find Workload section.
b. Within 10 seconds (no extra clicks): identify which pillar has most overdue tasks.
Expected: Overdue counts visible on first view. Orange highlight on most-overdue pillar.

### Test 13 — CSV Export
a. Session A: /command/reports → "Completion Rate by Pillar" → Export CSV.
Expected: File downloads immediately. Data matches on-screen chart values.

### Test 14 — Recurring Task
a. Session A: Create a task with recurrence = Weekly. Due date: today.
b. Session A: Approve the task.
Expected: New task appears in All Tasks with due_date = today + 7 days, status = not_started, recurring badge.

### Test 15 — Bulk Cross-Pillar Block
a. Session A: Select tasks from two different pillars.
b. Attempt bulk reassign to a head from Pillar A.
Expected: Error shown — "Cannot reassign tasks across different pillars."

---

## Reporting
After each test, record in docs/phases/phase-N.md under a "## QA Results" section:
| Test # | Description | Status | Notes |
|--------|------------|--------|-------|
| 1 | Pillar isolation | PASS / FAIL | ... |

Any FAIL must be escalated immediately before the next phase begins.
