# Prompt: Phase 2 — Collaboration (agent-collab + agent-email + agent-audit)

Phase 1 must be fully complete and all acceptance tests passing before starting this.
Read CLAUDE.md, docs/phases/phase-2.md, and the Phase 1 prompts for context.

---

## Part A — Comments (agent-collab)

### Component: CommentThread (components/tasks/CommentThread.tsx)
- Fetch comments for a task (real-time via Supabase Realtime channel)
- Display list (newest at bottom, auto-scroll)
- Each comment: avatar circle (initials, bg #2A4954), author name, timestamp, body text
- Own comment: right-aligned, bg rgba(185,251,194,0.08), border mint
- Other comment: left-aligned, bg #2A4954

### Add Comment Form
- Textarea (auto-resize, min 2 rows)
- "Send" button (mint)
- Keyboard shortcut: Cmd/Ctrl+Enter submits
- Server Action: addComment(taskId, body)
  - Verify user is admin OR task is in their pillar
  - Write to comments table
  - Create notification for the other party
  - Trigger email if recipient has email-comments enabled (check notifications_settings)

### Integration
- Add CommentThread to the bottom of both /command/tasks/[id] and /head/tasks/[id]
- Add a comments count badge to TaskCard

---

## Part B — Extension Requests (agent-collab)

### Head Side: Request Extension (on /head/tasks/[id])
Show "Request Extension" button when:
- status NOT IN (approved, submitted)
- No pending extension request exists for this task

Button opens a Sheet with:
- "Proposed new due date" (date picker — must be after current due date)
- "Reason" (textarea, required, min 20 chars)
- Submit button

Server Action: requestExtension(taskId, { proposed_date, reason })
- Verify one pending request max per task (unique constraint enforced at DB)
- Create extension_requests row
- Create notification + email for all admins
- Show pending-extension badge on task header

### Admin Side: Extension Widget (on /command page)
New section "Extension Requests" — list of pending requests:
- Task title | Head name | Proposed date | Reason (truncated, expand on click)
- "Approve" button (mint) | "Decline" button (orange text)

Approve Server Action: approveExtension(requestId)
- Update extension_requests.status = approved
- Update tasks.due_date = proposed_date
- Notify head (in-app + email)
- Write to audit_log

Decline Server Action: declineExtension(requestId, decisionNote)
- Opens inline textarea for decision note (required)
- Update extension_requests.status = declined
- Notify head (in-app + email)
- Write to audit_log

### Extension History on Task Detail
Show a collapsible "Extension History" section listing all past requests:
- Date requested | Proposed date | Reason | Decision | Decided by | Decision note

---

## Part C — File Upload (agent-collab)

Add to the Submit for Review form (Head side):
- File upload dropzone (react-dropzone or shadcn/ui File input)
- Accept: .pdf .docx .xlsx .png .jpg .zip
- Max: 50MB per file, max 3 files
- Upload to Supabase Storage private bucket: task-submissions/{taskId}/{userId}/{filename}
- On upload: store file path in submissions.file_paths array
- On download: Server Action generates a signed URL (60s expiry)
- Admin task detail shows file list with download buttons

Security:
- Storage bucket must be PRIVATE (not public)
- Signed URL generation only in a server action, never client-side with service role
- Verify task ownership before generating signed URL

---

## Part D — Audit Log Viewer (agent-audit)

### Route: /command/audit (admin only)

Table columns: Timestamp | Actor | Action | Entity | Entity ID | Details
- Timestamp: formatted as "2 hours ago" (relative) + full date on hover
- Actor: user full_name
- Action: colored pill (created=mint, updated=lavender, approved=mint, returned=orange, deleted=red)
- Details: expand row to show before/after JSON diff (collapsible)

Filters:
- Actor (select from users list)
- Entity type (tasks, submissions, users, extension_requests)
- Action type (created, updated, status_changed, approved, returned, archived)
- Date range (from/to date pickers)

Pagination: 50 rows per page, server-side
Export: CSV export of current filtered view (Phase 3 enhancement — stub only in Phase 2)

---

## Part E — Email Notifications (agent-email)

### Setup
- Install resend: npm install resend
- Add RESEND_API_KEY to .env.local and .env.example
- Create lib/email/resend.ts — Resend client singleton
- Create lib/email/send.ts — sendEmail(to, subject, html) wrapper

### Email Templates
Create React email templates in emails/ directory using @react-email/components.
All templates must use the brand palette:
- Background: #1B2E34
- Card: #2A4954
- Accent: #B9FBC2
- CTA button: #B9FBC2 text #1B2E34
- Warning/overdue: #FF6300
- Font: system sans-serif (email clients don't support custom fonts)

Templates to build:
1. task-assigned.tsx         → Head email when assigned a new task
2. task-due-reminder.tsx     → 24h before due date (Head)
3. task-overdue.tsx          → When a task becomes overdue (Head + Admin)
4. work-submitted.tsx        → Admin email when Head submits
5. submission-approved.tsx   → Head email when submission approved
6. submission-returned.tsx   → Head email with feedback excerpt
7. extension-requested.tsx   → Admin email when Head requests extension
8. extension-decided.tsx     → Head email with approve/decline decision
9. new-comment.tsx           → The other party on new comment
10. daily-digest.tsx         → Head daily digest: overdue + due today

### Daily Digest (Cron)
Create app/api/cron/daily-digest/route.ts
- Verify Authorization header = CRON_SECRET env var
- For each active Head with digest enabled:
  - Fetch their overdue + due-today tasks
  - If any exist: send daily-digest email
- Schedule via Vercel Cron (vercel.json):
  { "crons": [{ "path": "/api/cron/daily-digest", "schedule": "0 7 * * *" }] }

### Notification Settings Page
Route: /settings/notifications (both roles)
For each notification event type, a toggle row:
- Event name | Description | Email toggle (switch) | In-app toggle (switch — always on)
Store settings in a notification_settings table or as a JSONB column on users.

---

## Acceptance Tests to Pass (from phase-2.md)
Run all 7 tests and document results before marking Phase 2 complete.
