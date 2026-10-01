# Phase 2 — Collaboration

> Agents: agent-collab, agent-audit, agent-email, agent-head, agent-notif, agent-qa
> Prerequisite: All Phase 1 acceptance tests passing.
> Goal: Full communication loops — comments, extensions, email, file upload, audit viewer.

---

## Scope

### Comments
- [ ] Comments table already exists from Phase 1 schema
- [ ] Comment thread component on every Task Detail page
- [ ] Visible to: Head (own tasks only), Admin (all tasks)
- [ ] Add comment form (textarea + submit, real-time update via Supabase Realtime)
- [ ] Timestamps and commenter name/avatar shown
- [ ] New comment triggers in-app notification to the other party
- [ ] Email notification on new comment (optional per user settings)

### Deadline Extension Requests
- [ ] Extension Request form on Head task detail page
  - Proposed new date picker
  - Reason text field (required)
  - Only one pending request allowed per task
- [ ] Pending extension badge on task card and task detail
- [ ] Admin sees all pending extension requests in Command Dashboard sidebar widget
- [ ] Admin can Approve (due date updates automatically) or Decline (note required)
- [ ] Extension decision triggers in-app + email notification to Head
- [ ] Extension history shown on task detail (all past requests + decisions)

### File Upload (Supabase Storage)
- [ ] File upload field added to submission form (optional)
- [ ] Files stored in private Supabase Storage bucket (never public)
- [ ] Signed URL generated server-side for download — never expose raw path
- [ ] File size limit: 50MB per file, 3 files per submission
- [ ] Accepted types: PDF, DOCX, XLSX, PNG, JPG, ZIP
- [ ] Admin can download submitted files from Task Detail review view
- [ ] Files shown with name, size, and upload timestamp

### Audit Log Viewer (Admin Only)
- [ ] Audit log page at /command/audit
- [ ] Filterable by: actor, entity type, date range, action type
- [ ] Paginated table (50 rows per page)
- [ ] Each row: timestamp, actor name, action, entity, before/after diff (collapsible)
- [ ] Read-only — no delete or export in Phase 2

### Email Notifications (Resend)
- [ ] Resend API integration (RESEND_API_KEY env var)
- [ ] Branded email templates using NexGenU colors (dark teal + mint + orange):
  - [ ] Task Assigned
  - [ ] Task Due in 24 Hours
  - [ ] Task Overdue
  - [ ] Work Submitted (to Admin)
  - [ ] Submission Approved
  - [ ] Submission Returned (with feedback excerpt)
  - [ ] Extension Request Received (to Admin)
  - [ ] Extension Approved / Declined (to Head)
  - [ ] New Comment
- [ ] Daily digest email for Heads (tasks due today + overdue list) — sent at 8:00 AM
- [ ] Per-user notification settings page at /settings/notifications
  - Toggle email on/off per event type
  - Toggle daily digest on/off
- [ ] Unsubscribe link in every email (legal requirement)

---

## Acceptance Tests (All Must Pass Before Phase 3 Starts)

1. Head posts a comment on a task. Admin sees the comment in real-time
   without refreshing, and receives an in-app notification.

2. Head submits an extension request with a proposed date and reason.
   Admin sees a pending badge on the task and an entry in the extension
   widget. Admin approves — the task due date updates immediately.

3. Admin declines an extension request with a note. Head sees the
   decision and the decline note on the task detail page.

4. Head submits work with an attached file. Admin can download the file
   via a signed URL. The raw file path is not exposed in the response.

5. A task state change (any) produces a new row in audit_log viewable
   on the /command/audit page with correct actor, action, and timestamp.

6. A Head receives a daily digest email listing their overdue and
   due-today tasks. The email uses branded NexGenU styling.

7. Head turns off email for "New Comment" in notification settings.
   A new comment is posted. The Head gets an in-app notification but
   NOT an email.

---

## Definition of Done

- All items above checked off
- No TypeScript errors
- No ESLint errors
- All 7 acceptance tests documented as passing
- Email templates reviewed and approved by product owner
- File upload tested with each accepted file type
- Deployed to preview and smoke-tested on mobile
