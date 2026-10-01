# Prompt: Phase 1 — Command Dashboard (agent-cmd)

You are building the Admin Command Dashboard for NexGenU.
Read CLAUDE.md and docs/phases/phase-1.md fully first.
The design system and security rules there are mandatory.

---

## Route: /command (app/(dashboard)/command/page.tsx)

This is a Server Component. Fetch all data server-side using lib/db/*.ts helpers.

### Layout
Use a 12-column grid. Main content area beside the Sidebar.

### Section 1 — Summary Cards Row
Fetch and display 5 SummaryCard components in a horizontal row (2-col on mobile):
1. Open Tasks     — count of tasks where status NOT IN (approved, archived)  | color: white
2. Overdue        — count where due_date < today AND status != approved        | color: orange  | icon: AlertTriangle
3. Due This Week  — count where due_date BETWEEN today AND today+7 AND status != approved | color: lavender
4. Awaiting Review — count where status = submitted                            | color: accent (mint)
5. Blocked        — count where status = blocked                               | color: orange

### Section 2 — Review Queue
Heading: "Awaiting Review" with count badge.
List the top 10 submitted tasks, ordered by submitted_at ASC (oldest first).
Each row: TaskCard (without pillar selector) + inline Approve button (mint) + Return button (orange text).
Approve → Server Action → status: approved, audit log entry, notification to head.
Return → opens a modal with a required feedback textarea. On submit → status: returned.

### Section 3 — All Tasks Table
Full filterable table below the queue.
Columns: Title | Pillar | Priority | Status | Assignee | Due Date | Actions
Filters (top of table): Pillar select | Status select | Priority select | Date range
Sort: click column headers (default: due_date ASC)
Pagination: 25 rows per page
Each row: click title → navigate to /command/tasks/[id]
Overdue rows: orange left border 3px

### Create Task Button
Fixed in TopBar (right side). Opens a slide-over panel (Sheet from shadcn/ui).

Create Task form fields:
- Title (required, text)
- Description (textarea, optional)
- Pillar (select from pillars table — required)
  - When pillar changes, Assignee updates to show heads in that pillar
- Assignee (select from users where pillar_id = selected pillar — required)
- Priority (select: Low | Medium | High | Critical — default Medium)
- Due Date (date picker — required, must be today or future)
- KPI Reference (text/URL optional)

On submit:
- Validate with Zod (lib/validations/task.ts)
- Server Action: createTask()
- Write to tasks table
- Write to audit_log
- Create notification for the assignee
- Revalidate the page
- Show success toast (mint green) or error toast (orange)

---

## Route: /command/tasks/[id] (app/(dashboard)/command/tasks/[id]/page.tsx)

Server Component. Fetch task by id, verify Admin session server-side.

### Layout
Split: 2/3 main content | 1/3 right sidebar panel

### Main Content
- Task title (Nohemi Bold 24px, white)
- PriorityBadge + StatusBadge + Overdue flag (if applicable)
- Assigned to: [Head name] | Pillar: [Pillar name] | Due: [date] | Created by: [Admin name]
- Description section
- KPI Reference (clickable link if URL)
- Work Log section: list all task_log entries (date, hours, note, author)
- Submission History: list all submissions with note, links, file names
  - Each submission shows review_status badge
  - If returned: show feedback text in an orange-bordered callout

### Right Panel (Sticky)
- Status timeline (vertical stepper showing state transitions from audit_log)
- Admin Actions section:
  - If status = submitted:
    - "Approve" button (mint bg, dark text) → approveSubmission() Server Action
    - "Return with Feedback" button (orange outlined) → opens inline textarea
  - Edit Task button (opens edit form in sheet)
  - Archive Task button (requires confirmation — uses ConfirmDialog)

### Edit Task Form (Sheet)
Same fields as Create Task. Pre-filled. Changing pillar requires confirmation
(warns that head assignment may change).

---

## lib/db/tasks.ts helpers needed

```ts
getAllTasks(filters): Promise<Task[]>
getTaskById(id): Promise<Task | null>
createTask(data): Promise<{ data: Task | null, error: string | null }>
updateTask(id, data): Promise<{ data: Task | null, error: string | null }>
approveSubmission(taskId, reviewerId): Promise<{ error: string | null }>
returnSubmission(taskId, reviewerId, feedback): Promise<{ error: string | null }>
getTaskStats(): Promise<{ open, overdue, dueThisWeek, awaitingReview, blocked }>
getReviewQueue(limit): Promise<Task[]>
```

All helpers must use the server Supabase client.
All mutations write to audit_log (use the service role client for audit inserts).

---

## Security Checks
- Verify auth.uid() exists in every server action
- Verify user.role = admin in every server action
- Return { error: "Unauthorized" } if not — never throw
