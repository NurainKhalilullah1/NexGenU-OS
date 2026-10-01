# NexGenU Workforce Dashboard (`nexgenu-os`)

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth%20%26%20Realtime-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Charts-Recharts-22b5bf?style=flat)](https://recharts.org/)

An executive workforce orchestration, task-assignment, and execution-tracking platform designed for **NexGenU** leadership and pillar heads. Built for uncompromising speed, data security, and operational clarity.

---

## 🏛️ The 5 Pillars of NexGenU

NexGenU operates across 5 core pillars. Every task, head, and workload is scoped to its organizational pillar:

| Pillar | Nickname | Focus & Mission |
| :--- | :--- | :--- |
| **The Builders** | `Builders` | Engineering, systems architecture, and core product infrastructure |
| **The Educators** | `Educators` | Curriculum development, pedagogy, and community learning resources |
| **The Innovators** | `Innovators` | R&D, experimentation, emerging technology, and new initiatives |
| **The Connectors** | `Connectors` | Partnerships, external relations, outreach, and ecosystem growth |
| **The Guardians** | `Guardians` | Security, compliance, governance, and operational resilience |

---

## ✨ Features Across All Phases

### Phase 1 — Core MVP
* **Dual-Context Role Dashboards**:
  * **Command Center (`/command`)**: Unified administrative cockpit providing birds-eye visibility over all 5 pillars, active review queues, summary cards, and system-wide filters.
  * **Head Dashboard (`/head`)**: High-focus workspace for pillar leaders, showcasing *My Focus* priority tasks, a tabbed task matrix, and milestone progress.
* **Granular Task Lifecycle**: Supports statuses: `not_started`, `in_progress`, `blocked`, `submitted`, `returned`, and `approved`.
* **Formal Submissions & Review Queue**: Pillar Heads submit formal deliverables with notes and external links. Leadership reviews submissions with approval or constructive feedback.
* **Work Log System**: Heads record granular daily work logs and hours dedicated to tasks, with automatic 24-hour edit locks.
* **Realtime Notifications**: Unread badge count and notification bell powered by Supabase Realtime for task assignments, approvals, and returns.
* **Database-Level Row Level Security (RLS)**: Strict pillar isolation ensuring heads can only read and mutate rows belonging to their pillar.

### Phase 2 — Collaboration & Accountability
* **Realtime Comment Discussions**: Live task discussion threads with instant multi-user messaging, actor attribution, and relative timestamps.
* **Formal Extension Requests**: Dedicated due-date extension workflow allowing heads to submit reasonings, with administrative approvals, decline notes, and full extension audit history.
* **Private File Attachments (Supabase Storage)**: Submission file uploads stored in private buckets (`task-submissions`), protected by 60-second ephemeral signed URLs.
* **Outbound Email & Digest System**: Integrated Google SMTP via Nodemailer with 10 responsive HTML templates and granular user notification preferences.
* **Immutable Audit Trail (`/command/audit`)**: Append-only audit log tracking every task creation, reassignment, status transition, review action, and permission update.

### Phase 3 — Insight & Scale
* **Pillar Workload Cockpit**:
  * Collapsible panel with real-time capacity progress bars ($0\text{--}50\%$ Mint, $51\text{--}75\%$ Lavender, $76\text{--}100\%$ Orange).
  * Grouped horizontal Recharts bar charts comparing open vs. overdue tasks per pillar.
  * **"Most Overloaded Pillar"** banner identifying organizational bottlenecks in $<10$ seconds.
* **Reports & Analytics Suite (`/command/reports`)**:
  * **Completion Rate by Pillar**: Performance bar chart with period selector (*This Month*, *Last Month*, *All Time*).
  * **Overdue Analysis**: Granular list with overdue duration counter (`+N d`) and per-pillar filtering.
  * **Approval Cycle Time**: 12-week rolling trend line chart visualizing time elapsed from task assignment to final approval.
  * **Return Rate**: Donut visualization and breakdown table tracking first-submission return rates.
  * **One-Click CSV Export**: Instant RFC-4180 compliant CSV downloads (`nexgenu-report-{type}-{date}.csv`) with all applied filters.
* **Automated Recurring Tasks**:
  * Recurrence frequencies: `weekly` (+7 days) and `monthly` (+1 month).
  * Automatic spawning of the subsequent instance upon leadership approval, preserving metadata, title, description, pillar, assignee, and priority with status reset to `not_started`.
  * Visual recurring badges on cards and table views, with one-click administrative *"Stop recurrence after this"* capability.
* **Bulk Operations Bar**:
  * Multi-row checkbox selection with a sliding bulk action bar.
  * **Cross-Pillar Reassignment Protection**: Proactively prevents and blocks cross-pillar reassignments both in the UI and via Server Action validation.
  * Bulk due-date adjustment and bulk priority modification.
  * Writes a single grouped row to `audit_log` and dispatches aggregated notifications.
* **KPI Reference System**:
  * Optional URL/identifier field on task creation and editing.
  * Clickable external links with security attributes (`target="_blank"`, `rel="noopener noreferrer"`) and dedicated KPI panels on Task Detail.
  * Quick filter for "Has KPI ref" across all task tables.

---

## 🎨 Brand Design System

The application strictly implements the NexGenU palette defined in `CLAUDE.md`:

| Token | Hex | RGBA | Usage |
| :--- | :--- | :--- | :--- |
| `--color-base` | `#1B2E34` | `rgba(27, 46, 52, 1)` | Deep teal canvas, main backgrounds, dark surfaces |
| `--color-accent` | `#B9FBC2` | `rgba(185, 251, 194, 1)` | Mint hero accent, active states, CTAs, success |
| `--color-surface` | `#2A4954` | `rgba(42, 73, 84, 1)` | Cards, elevated surfaces, panels, hover overlays |
| `--color-white` | `#FFFFFF` | `rgba(255, 255, 255, 1)` | Primary high-contrast text |
| `--color-orange` | `#FF6300` | `rgba(255, 99, 0, 1)` | Overdue alerts, destructive actions, urgency markers |
| `--color-lavender`| `#CFC1FC` | `rgba(207, 193, 252, 1)`| Head dashboard identity, secondary badges |

* **Surface Laddering**: Depth is achieved through layering (`--surface-0` $\to$ `--surface-1` $\to$ `--surface-2` $\to$ `--surface-3`) rather than heavy drop shadows.
* **Typography**: Self-hosted **Nohemi** font family located in `public/fonts/` with responsive scale from 11px to 48px.

---

## 🛠️ Tech Stack & Architecture

* **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (`strict: true`)
* **Styling**: Tailwind CSS v4 + Radix UI primitives
* **Database & Auth**: Supabase (PostgreSQL with RLS, Supabase Auth, Supabase Realtime, Private Storage)
* **Charts**: Recharts (Horizontal Bar, Vertical Bar, Line Trends, Donut Pies)
* **Form Validation**: React Hook Form + Zod
* **Icons**: Lucide React
* **Email**: Nodemailer with Google SMTP transport

---

## 📂 Project Structure

```
nexgenu-os/
├── app/
│   ├── (auth)/
│   │   └── login/                     # Authentication views
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # Shell with Sidebar, TopBar, MobileNav
│   │   ├── command/                   # Admin Command Center
│   │   │   ├── page.tsx               # Workload, review queue, all tasks
│   │   │   ├── actions.ts             # Admin Server Actions
│   │   │   ├── reports/               # Phase 3 Analytics & CSV export
│   │   │   ├── audit/                 # Audit log viewer
│   │   │   ├── review/                # Dedicated submission review queue
│   │   │   └── tasks/[id]/            # Admin task detail with KPI & recurrence
│   │   └── head/                      # Pillar-scoped Head Dashboard
│   │       ├── page.tsx               # Focus section, work logs, submit form
│   │       └── tasks/[id]/            # Head task detail & execution controls
│   └── api/                           # Webhooks, cron jobs, and API routes
├── components/
│   ├── dashboard/
│   │   ├── command/                   # Command components (Workload, AllTasksTable, etc.)
│   │   ├── head/                      # Head components (WorkLogForm, SubmitModal, etc.)
│   │   └── shared/                    # SummaryCard, EmptyState, ConfirmDialog
│   ├── layout/                        # Sidebar, TopBar, MobileNav
│   ├── notifications/                 # Realtime notification bell & list
│   └── tasks/                         # TaskCard, badges, comments, extension modals
├── lib/
│   ├── db/                            # Typed query helpers (tasks, reports, audit, etc.)
│   ├── supabase/                      # Server, client, and middleware Supabase wrappers
│   ├── email/                         # SMTP transport and HTML email templates
│   └── validations/                   # Zod schemas (task, submission, extension)
├── supabase/
│   └── migrations/                    # Numbered SQL migrations (001 - 007)
├── docs/
│   ├── spec.md                        # Master product specification
│   ├── decisions.md                   # Architectural decisions log (ADRs)
│   └── phases/                        # Phase 1, 2, and 3 verification criteria
├── CLAUDE.md                          # Authoritative project guidelines
└── AGENTS.md                          # Multi-agent orchestration rules
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v20+ recommended)
* **npm** or **pnpm**
* A **Supabase** project (cloud or local CLI)

### 2. Environment Variables
Copy `.env.example` to `.env.local` and populate the required keys:

```bash
cp .env.example .env.local
```

Required variables:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-side only
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Outbound Email (Phase 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="NexGenU OS" <notifications@nexgenu.org>
```

### 3. Database Migrations
Execute the migrations in order using the Supabase CLI or SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` (Pillars, users, tasks)
2. `supabase/migrations/002_task_logs_submissions.sql` (Task logs, submissions)
3. `supabase/migrations/003_extensions_notifs.sql` (Extensions, notifications)
4. `supabase/migrations/004_audit_log.sql` (Append-only audit log)
5. `supabase/migrations/005_rls_policies.sql` (Pillar isolation RLS policies)
6. `supabase/migrations/006_seed_pillars.sql` (Seeds the 5 pillars)
7. `supabase/migrations/007_phase2_collaboration.sql` (Comments, storage, notification settings)

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Integrity Guarantees

* **Server Actions Only**: All mutations are executed via Server Actions returning `{ data, error }`.
* **Zero Client-Trust**: Roles and `pillar_id` are continuously verified on the server via JWT and database lookup.
* **RLS First**: Direct Supabase queries from an unprivileged client cannot read or update rows belonging to other pillars.
* **Audit Trail**: Every critical state transition produces an append-only audit record. `audit_log` possesses no `UPDATE` or `DELETE` policies.

---

## 📄 License & Ownership
Copyright © 2026 NexGenU. Internal enterprise system. All rights reserved.
