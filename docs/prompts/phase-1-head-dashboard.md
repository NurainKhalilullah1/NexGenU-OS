# Prompt: Phase 1 — Head Dashboard (agent-head)

You are building the Head Dashboard for NexGenU pillar heads.
Read CLAUDE.md and docs/phases/phase-1.md fully first.
A Head can ONLY see and act on tasks in their own pillar. This is enforced
at the database level (RLS) AND must be verified in every Server Action.

---

## Route: /head (app/(dashboard)/head/page.tsx)

Server Component. Fetch only tasks where pillar_id = current user pillar_id.

### Header Section
- Pillar name (e.g. "Product & Technology") in Nohemi Bold 20px, white
- Pillar nickname (e.g. "The Builders") in mint accent, 14px
- Greeting: "Good morning, [first name]" — dynamic by time of day

### My Focus Section (pinned at top)
Show tasks that are OVERDUE or DUE TODAY in a highlighted card area.
Background: rgba(255,99,0,0.08), left border 3px #FF6300.
Each item: TaskCard compact variant.
If empty: EmptyState with "You are all caught up today" message.

### Summary Cards Row (5 cards)
1. Assigned to Me  — total tasks not archived
2. In Progress     — status = in_progress
3. Due This Week   — due in next 7 days, not approved
4. Returned        — status = returned | color: orange
5. Approved This Month — status = approved AND reviewed_at this month | color: accent

### Tabbed Task List
Tabs: To Do | In Progress | Blocked | Submitted | Returned | Done
Each tab filters the task list by status group:
- To Do     → status = not_started
- In Progress → status = in_progress
- Blocked   → status = blocked
- Submitted → status = submitted
- Returned  → status = returned
- Done      → status = approved

Each tab shows TaskCard rows. Empty tabs show EmptyState component.
Default open tab: "To Do" (or "In Progress" if any exist).

---

## Route: /head/tasks/[id] (app/(dashboard)/head/tasks/[id]/page.tsx)

Server Component. MUST verify task.pillar_id = current user pillar_id server-side.
If mismatch → return notFound() immediately. Do NOT show a 403 page that reveals
the task exists.

### Returned Feedback Banner
If task.status = returned AND latest submission has feedback:
Show a prominent banner at the very top of the page:
- Background: rgba(255,99,0,0.10)
- Left border: 4px solid #FF6300
- Icon: RotateCcw in orange
- Label: "Returned for changes"
- Body: feedback text from Admin
- Sub-label: returned by [Admin name] on [date]

### Task Header
- Title (Nohemi Bold 22px)
- Row: PriorityBadge | StatusBadge | Overdue flag | Due: [date] | Assigned by: [Admin name]
- Description (markdown rendered, or plain text)
- KPI Reference link (if set)

### Action Bar (sticky bottom on mobile, inline on desktop)
Render buttons conditionally based on current status:

| Current Status | Available Actions |
|----------------|------------------|
| not_started    | "Start Work" → sets status = in_progress |
| in_progress    | "Mark as Blocked" (requires reason) | "Submit for Review" |
| blocked        | "Mark as In Progress" | "Submit for Review" |
| returned       | "Submit for Review" |
| submitted      | Read-only — "Awaiting review" label |
| approved       | Read-only — "Approved" label |

"Mark as Blocked" opens an inline form with a required reason textarea.
Server Action: updateTaskStatus(taskId, 'blocked', reason)

"Start Work": Server Action: updateTaskStatus(taskId, 'in_progress')

### Work Log Section
Heading: "Work Log" with total hours badge (sum of all entries).

Add Entry form (inline, collapsible):
- Date (date picker, default today)
- Hours (number input, optional, 0.5 step)
- Note (textarea, required, min 10 chars)
- Submit button

Entry list (newest first):
- Date | Hours | Note | Author
- Edit button (shown if created_at < 24h ago AND user_id = current user)
- Edit in-place: same form fields, Save + Cancel

Server Actions:
- addWorkLog(taskId, { log_date, hours, note })
- updateWorkLog(logId, { hours, note }) — verify ownership + 24h lock
- Validate in lib/validations/task.ts

### Submit for Review Section
Only shown when status IN (in_progress, blocked, returned).

Form fields:
- Note (textarea — REQUIRED if no links provided)
- Links (dynamic list — add/remove URL inputs. Min 0, max 5)
  Each link shows the URL with a remove button
- Submit button: "Submit for Review" (mint bg)

Validation (Zod):
- At least one of: note (non-empty) OR at least one link provided
- Links must be valid URLs

On submit:
- Server Action: submitForReview(taskId, { note, links })
- Creates a submissions row with review_status: pending
- Updates task status to: submitted
- Creates notification for all admins
- Writes to audit_log
- Shows success state on the task page (status badge updates)

### Submission History
Below the submit form, list all previous submissions:
- Submitted on: [date] | Status: [review_status badge]
- Note text
- Links (clickable)
- If returned: Admin feedback shown in orange callout

---

## lib/db/ helpers needed

```ts
// tasks.ts
getHeadTasks(userId, pillarId, filters?): Promise<Task[]>
getHeadTaskById(taskId, userId, pillarId): Promise<Task | null>
updateTaskStatus(taskId, status, blockReason?): Promise<{ error: string | null }>

// task-logs.ts
getTaskLogs(taskId): Promise<TaskLog[]>
addTaskLog(taskId, data): Promise<{ data: TaskLog | null, error: string | null }>
updateTaskLog(logId, userId, data): Promise<{ error: string | null }>

// submissions.ts
getTaskSubmissions(taskId): Promise<Submission[]>
submitForReview(taskId, userId, data): Promise<{ error: string | null }>
```

---

## Security Rules (Must Enforce in EVERY Server Action)
1. Verify auth.uid() is present.
2. Fetch user from users table — verify role = head.
3. Verify task.pillar_id = user.pillar_id before ANY read or write.
4. If any check fails: return { error: "Unauthorized" } — never throw.
5. Write every status change to audit_log.
