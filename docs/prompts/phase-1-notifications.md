# Prompt: Phase 1 — In-App Notifications (agent-notif)

Read CLAUDE.md and docs/phases/phase-1.md fully first.

---

## Database
The notifications table is created in Phase 1 migration 004.
Schema: id, user_id, type, task_id, message, read, created_at

Notification types (use string constants in lib/constants/notifications.ts):
  TASK_ASSIGNED       = "task_assigned"
  TASK_DUE_SOON       = "task_due_soon"
  TASK_OVERDUE        = "task_overdue"
  WORK_SUBMITTED      = "work_submitted"
  SUBMISSION_APPROVED = "submission_approved"
  SUBMISSION_RETURNED = "submission_returned"

---

## lib/db/notifications.ts

```ts
createNotification(userId, type, taskId, message): Promise<void>
getUserNotifications(userId, limit?): Promise<Notification[]>
markAsRead(notificationId, userId): Promise<void>
markAllAsRead(userId): Promise<void>
getUnreadCount(userId): Promise<number>
```

All notification inserts use the service role client (bypasses RLS).
Reads use the user's session client (RLS ensures users only see own).

---

## Notification Creation Triggers
Call createNotification() inside these Server Actions:

| Server Action | Notification type | Recipient |
|--------------|-------------------|-----------|
| createTask() | TASK_ASSIGNED | assignee |
| approveSubmission() | SUBMISSION_APPROVED | assignee |
| returnSubmission() | SUBMISSION_RETURNED | assignee |
| submitForReview() | WORK_SUBMITTED | all admins |
| Overdue detection (cron) | TASK_OVERDUE | assignee + all admins |

Message format examples:
- TASK_ASSIGNED: "You have been assigned: {task.title}"
- SUBMISSION_APPROVED: "{task.title} has been approved"
- WORK_SUBMITTED: "{head.name} submitted work on: {task.title}"

---

## Overdue Detection (Cron Job)
Create app/api/cron/check-overdue/route.ts
- Verify Authorization = CRON_SECRET
- Query: tasks WHERE due_date < today AND status NOT IN (approved, archived)
- For each: if no TASK_OVERDUE notification exists for today, create one
- Schedule in vercel.json: "0 8 * * *" (8 AM daily)

---

## NotificationBell Component (components/notifications/NotificationBell.tsx)

Client component ("use client"). Placed in TopBar.

### Unread Count Badge
- Fetch initial count server-side (pass as prop)
- Subscribe to Supabase Realtime: postgres_changes on notifications table
  WHERE user_id = current user
- On new row: increment count, show badge
- Badge: small circle, bg #FF6300, white text, Nohemi Bold 11px
- Hide badge if count = 0

### Notification Panel (Popover from shadcn/ui)
Opens on bell click. Width: 360px. Max height: 480px with overflow-y scroll.

Header: "Notifications" | "Mark all read" button (text, mint color)

Notification Item:
- Unread: bg rgba(185,251,194,0.06), left border 2px #B9FBC2
- Read: bg transparent
- Icon: based on type (Bell, CheckCircle, Upload, AlertTriangle, RotateCcw)
- Icon color: mint (approved/assigned), orange (overdue/returned), lavender (submitted)
- Message text (14px)
- Relative timestamp (e.g. "2 hours ago") — 12px text-muted
- Click: mark as read + navigate to /command/tasks/[taskId] or /head/tasks/[taskId]

Footer: "View all notifications" link → /notifications page (Phase 2 enhancement — stub now)

### Real-time Subscription Setup
```ts
const channel = supabase
  .channel("notifications")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "notifications",
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    setUnreadCount(c => c + 1)
    setNotifications(n => [payload.new, ...n])
  })
  .subscribe()
```
Clean up channel on component unmount.
