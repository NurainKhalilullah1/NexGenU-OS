# Architectural Decisions Log — NexGenU Workforce Dashboard

This document records key architectural decisions made during development, as mandated by `AGENTS.md` §2 Rule 10.

---

## Decision 001: Font Handling & Fallback
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: CLAUDE.md §3.4 and AGENTS.md specify the Nohemi font (self-hosted via `next/font/local`). During initial setup before static font asset upload, Google Inter was loaded via `next/font/google` as an interim typography fallback.
- **Decision**: Configured CSS custom properties with fallback cascade to ensure seamless transition to self-hosted Nohemi files placed in `public/fonts/` without code changes to components.

---

## Decision 002: Server-Side Role Enforcement in Middleware
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: CLAUDE.md §5 explicitly mandates: *"Never trust `role` or `pillar_id` from the client. Always read from the JWT claim or `users` table server-side."*
- **Decision**: Modified `middleware.ts` to query the `users` table directly using the Supabase server client, preventing any privilege escalation or spoofing from client cookies.

---

## Decision 003: Pillar Isolation on Server Actions & Pages
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: Acceptance Test 1 requires that a Head logged in for one pillar cannot access, view, or mutate tasks belonging to any other pillar.
- **Decision**: In addition to Postgres RLS policies, every Head Server Action (`updateHeadTaskStatusAction`, `addWorkLogAction`, `submitTaskAction`) and the Head detail page (`/head/tasks/[id]`) re-verify `task.pillar_id === head.pillar_id`. If they do not match, the action returns an authorization error and the page returns 404 (`notFound()`), preventing information leakage.

---

## Decision 004: Insert-Only Audit Log
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: CLAUDE.md §5 and AGENTS.md §6 state that `audit_log` is insert-only, with no `UPDATE` or `DELETE` policies.
- **Decision**: Implemented `addAuditLog` in `lib/db/audit-log.ts` to record every task creation, status transition, submission, approval, and return. Postgres migration `005_rls_policies.sql` omits `UPDATE` and `DELETE` grants entirely.

---

## Decision 005: 24-Hour Work Log Edit Lock
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: Phase 1 specification requires work log entries to lock after 24 hours.
- **Decision**: Implemented `canEditLog` helper in `lib/db/task-logs.ts` using `date-fns.differenceInHours` against `log.created_at`. UI displays a lock indicator for entries older than 24 hours.

---

## Decision 006: Google SMTP Integration via Nodemailer
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: CLAUDE.md §2 and AGENTS.md §3 specify Google SMTP for Phase 2 outbound email notifications.
- **Decision**: Configured `lib/email/smtp.ts` and `lib/email/send.ts` using nodemailer with fallback simulation when credentials are not yet populated. Pre-built 10 branded HTML email templates following the brand design system.

---

## Decision 007: Private Storage with Ephemeral Signed URLs for Submissions
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: Phase 2 Part C mandates that file attachments must be stored in private Supabase Storage buckets and never exposed via public URLs.
- **Decision**: Files are uploaded into `task-submissions/{taskId}/{userId}/{timestamp}_{filename}`. Downloads are generated via `getSubmissionFileSignedUrlAction` Server Action with a 60-second signed URL expiry, ensuring files are only accessible to authenticated, authorized users.

---

## Decision 008: Realtime Comment Threads & Notification Preferences
- **Date**: 2026-10-01
- **Status**: Accepted
- **Context**: Task discussions require live updates without manual page refreshes, and users must have granular control over their email frequency.
- **Decision**: Implemented Supabase Realtime channel subscription in `CommentThread.tsx` with optimistic local insertion. User notification preferences are persisted in `notification_settings` table and checked prior to dispatching SMTP emails.

