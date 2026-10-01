# CLAUDE.md — NexGenU Workforce Dashboard

> This file is the authoritative guide for every AI agent, assistant, or developer
> working on this codebase. Read it in full before writing any code.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Product** | NexGenU Workforce Dashboard |
| **Repository** | `nexgenu-os` |
| **Purpose** | Internal task-assignment and execution-tracking system for NexGenU leadership and pillar heads |
| **Spec document** | `docs/spec.md` (canonical source of truth for all requirements) |
| **Current phase** | Phase 1 — Core MVP |

---

## 2. Stack (Mandatory — Do Not Deviate Without Explicit Approval)

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Component primitives** | shadcn/ui (Radix UI base) |
| **Database** | Supabase (Postgres) |
| **Auth** | Supabase Auth (magic link + password; Google OAuth) |
| **Realtime** | Supabase Realtime (notifications, live review queue) |
| **Storage** | Supabase Storage (Phase 2 file uploads only) |
| **State** | Zustand (client), React Query / SWR (server cache) |
| **Email** | Google SMTP (Phase 2 only) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |

---

## 3. Brand Design System

### 3.1 Official Color Palette

These are the ONLY approved brand colors. Do not introduce new colors
without explicit approval. Map every design token to one of these values.

#### Primary Colors
| Token | Hex | RGBA | Usage |
|-------|-----|------|-------|
| `--color-base` | `#1B2E34` | rgba(27, 46, 52, 1) | Page background, sidebar, dark surfaces |
| `--color-accent` | `#B9FBC2` | rgba(185, 251, 194, 1) | Primary accent, highlights, active states, success |
| `--color-surface` | `#2A4954` | rgba(42, 73, 84, 1) | Cards, panels, elevated surfaces, hover backgrounds |
| `--color-white` | `#FFFFFF` | rgba(255, 255, 255, 1) | Primary text on dark, light surface backgrounds |

#### Secondary Colors
| Token | Hex | RGBA | Usage |
|-------|-----|------|-------|
| `--color-orange` | `#FF6300` | rgba(255, 99, 0, 1) | CTAs, overdue alerts, destructive actions, warnings |
| `--color-overlay` | — | rgba(0, 0, 0, 0.07) | Hover overlays, glass effects, card shadows |
| `--color-lavender` | `#CFC1FC` | rgba(207, 193, 252, 1) | Secondary badges, Head Dashboard accent, submitted status |

#### Derived Utility Tokens (computed from primary palette)
```css
/* globals.css — define these as CSS custom properties */
:root {
  /* Brand */
  --color-base:      #1B2E34;
  --color-accent:    #B9FBC2;
  --color-surface:   #2A4954;
  --color-white:     #FFFFFF;
  --color-orange:    #FF6300;
  --color-lavender:  #CFC1FC;
  --color-overlay:   rgba(0, 0, 0, 0.07);

  /* Derived surfaces */
  --surface-0:       #1B2E34;   /* Page background */
  --surface-1:       #213840;   /* Card (base + 10% lighter) */
  --surface-2:       #2A4954;   /* Elevated card / sidebar */
  --surface-3:       #325666;   /* Hover state / raised */
  --border-subtle:   rgba(185, 251, 194, 0.10);  /* Accent with low opacity */
  --border-default:  rgba(255, 255, 255, 0.08);  /* White with low opacity */

  /* Text */
  --text-primary:    #FFFFFF;
  --text-secondary:  rgba(255, 255, 255, 0.65);
  --text-muted:      rgba(255, 255, 255, 0.35);

  /* Status colors */
  --status-not-started: rgba(255, 255, 255, 0.35);
  --status-in-progress: #B9FBC2;     /* accent */
  --status-blocked:     #FF6300;     /* orange */
  --status-submitted:   #CFC1FC;     /* lavender */
  --status-returned:    #FF6300;     /* orange */
  --status-approved:    #B9FBC2;     /* accent */
  --status-overdue:     #FF6300;     /* orange */
}
```

### 3.2 Status Badge Styles
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Not started | `--surface-3` | `--text-muted` | `--border-default` |
| In progress | `rgba(185,251,194,0.12)` | `#B9FBC2` | `rgba(185,251,194,0.3)` |
| Blocked | `rgba(255,99,0,0.15)` | `#FF6300` | `rgba(255,99,0,0.4)` |
| Submitted | `rgba(207,193,252,0.15)` | `#CFC1FC` | `rgba(207,193,252,0.4)` |
| Returned | `rgba(255,99,0,0.12)` | `#FF9A50` | `rgba(255,99,0,0.3)` |
| Approved | `rgba(185,251,194,0.15)` | `#B9FBC2` | `rgba(185,251,194,0.4)` |
| Overdue (flag) | `rgba(255,99,0,0.2)` | `#FF6300` | `rgba(255,99,0,0.5)` |

### 3.3 Priority Badge Styles
| Priority | Background | Text | Border |
|----------|-----------|------|--------|
| Critical | `rgba(255,99,0,0.2)` | `#FF6300` | `rgba(255,99,0,0.5)` |
| High | `rgba(255,99,0,0.12)` | `#FF9A50` | `rgba(255,99,0,0.35)` |
| Medium | `rgba(207,193,252,0.15)` | `#CFC1FC` | `rgba(207,193,252,0.35)` |
| Low | `--surface-3` | `--text-secondary` | `--border-default` |

### 3.4 Typography
- **Font**: Inter (self-hosted via `next/font/google`)
- **Scale**: 11 / 12 / 13 / 14 / 16 / 18 / 24 / 32 / 48px
- **Heading weight**: 700 | **Sub-heading**: 600 | **Body**: 400–500
- **Letter spacing**: -0.02em for headings, normal for body

### 3.5 Design Principles
1. **Dark teal canvas**: The deep `#1B2E34` base should feel rich and calm, not heavy.
2. **Mint is the hero accent**: `#B9FBC2` draws the eye to active states, primary CTAs, and success. Use it intentionally — do not scatter it everywhere.
3. **Orange means action or urgency**: `#FF6300` is reserved for overdue items, primary CTAs that cause a mutation, and destructive/warning states.
4. **Lavender for secondary roles**: `#CFC1FC` highlights the Head Dashboard identity and submission status. It creates a visual distinction between admin and head contexts.
5. **Surface laddering creates depth**: Use `--surface-0` → `--surface-1` → `--surface-2` → `--surface-3` to layer elements. Never use drop shadows as the primary depth mechanism.
6. **Glass overlay on interaction**: Use `rgba(0,0,0,0.07)` as a hover overlay on top of any surface color.
7. **Status is never color alone**: Always pair a colored badge with a text label or icon.
8. **Mobile-first**: Every layout must work at 375px minimum viewport width.
9. **Micro-animations**: 150ms ease-out on hover, 200ms ease for state transitions, 300ms for panel slide-ins.

---

## 4. File & Folder Structure

```
nexgenu-os/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Shell: sidebar + topbar
│   │   ├── command/            # Admin Command Dashboard
│   │   │   ├── page.tsx
│   │   │   └── tasks/[id]/page.tsx
│   │   └── head/               # Head Dashboard (pillar-scoped)
│   │       ├── page.tsx
│   │       └── tasks/[id]/page.tsx
│   ├── api/
│   │   └── webhooks/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn/ui primitives (do NOT edit)
│   ├── dashboard/
│   │   ├── command/            # Admin-only components
│   │   ├── head/               # Head-only components
│   │   └── shared/             # Used in both dashboards
│   ├── tasks/                  # Task cards, forms, status controls
│   ├── notifications/
│   └── layout/                 # Sidebar, TopBar, MobileNav
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── db/                     # Typed query helpers — no raw SQL in components
│   │   ├── tasks.ts
│   │   ├── users.ts
│   │   ├── submissions.ts
│   │   ├── task-logs.ts
│   │   ├── comments.ts
│   │   ├── extensions.ts
│   │   └── notifications.ts
│   ├── validations/            # Zod schemas (single source of truth)
│   │   ├── task.ts
│   │   ├── submission.ts
│   │   └── extension.ts
│   └── utils.ts
├── hooks/
├── store/                      # Zustand stores
├── types/                      # Generated + manual types
├── supabase/
│   ├── migrations/
│   └── seed.ts
├── docs/
│   ├── spec.md
│   ├── phases/
│   │   ├── phase-1.md
│   │   ├── phase-2.md
│   │   └── phase-3.md
│   └── decisions.md
├── CLAUDE.md
└── AGENTS.md
```

---

## 5. Coding Rules (Non-Negotiable)

### TypeScript
- `strict: true` always. No `any`. Use `unknown` and narrow types.
- All props must have explicit TypeScript interfaces or types.
- Run: `supabase gen types typescript --local > types/supabase.ts` after every migration.

### React / Next.js
- Default to **Server Components**. Only add `"use client"` for hooks, browser APIs, or event handlers.
- Use **Server Actions** for all mutations. Avoid client-side fetch to `/api` for mutations.
- Never put database logic directly in a component. Always go through `lib/db/*.ts`.
- Route protection via `middleware.ts` — never rely on client-side redirects for auth.

### Security (Critical — No Exceptions)
- **RLS is mandatory** on every Supabase table from the first migration.
- Heads must only access rows where `pillar_id` matches their own, enforced at DB level.
- Never trust `role` or `pillar_id` from the client. Always read from the JWT claim or `users` table server-side.
- All mutations re-validate session and role on the server.
- `service_role` key must never appear in client-side code or `NEXT_PUBLIC_` env vars.

### Database
- Every schema change = new numbered migration file. Never edit existing migrations.
- `snake_case` for all tables, columns, and functions.
- All foreign keys must declare explicit `ON DELETE` behaviour.
- `audit_log` is insert-only. No `UPDATE` or `DELETE` policies — ever.

### Forms
- All forms use `react-hook-form` + Zod resolver.
- Zod schema lives in `lib/validations/`. Import in both the client form AND the server action.
- Always render inline field-level error messages. Never use `alert()` or `console.error` for user-facing errors.

### Error Handling
- Server Actions return `{ data, error }` — never throw errors to the client.
- Use `error.tsx` and `not-found.tsx` in every route segment.
- Log full errors server-side; show sanitized messages to users.

---

## 6. Key RLS Policy Patterns

```sql
-- Heads see only their pillar's tasks
CREATE POLICY "heads_see_own_pillar_tasks" ON tasks
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR pillar_id = (SELECT pillar_id FROM users WHERE id = auth.uid())
  );

-- Only admins may create tasks
CREATE POLICY "only_admins_create_tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Heads log work only on tasks assigned to them
CREATE POLICY "heads_log_own_tasks" ON task_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND tasks.assignee_id = auth.uid()
    )
  );
```

---

## 7. Environment Variables

```bash
# .env.local — NEVER commit this file
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only — never NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=                    # Phase 2 only
```

---

## 8. Git Conventions

```
feat(phase-1): add task creation form with Zod validation
fix(rls):      tighten head isolation policy on task_logs
chore:         add migration 003 for extension_requests table
docs:          update phase-2 acceptance criteria
```

- Branch format: `phase-1/feature-name`, `phase-2/email-notifications`
- Never commit directly to `main`. PR + review always.
- Every PR must include: what changed, how to test, and any migration steps.

---

## 9. Do Not

- Do not use `fetch` inside Server Components for Supabase data — use the server client directly.
- Do not store `role` or `pillar_id` in `localStorage` or non-HttpOnly cookies.
- Do not skip RLS for any reason, even temporarily.
- Do not add dependencies without an entry in `docs/decisions.md`.
- Do not surface raw Supabase error messages to users.
- Do not use any color not in the official palette without written approval.
- Do not use drop shadows as the primary depth mechanism — use surface laddering.

---

## 10. Key Domain Vocabulary

| Term | Meaning |
|------|---------|
| **Pillar** | One of the 5 org units (e.g. "The Builders") |
| **Head** | Leader of a pillar; has a restricted, pillar-scoped dashboard |
| **Admin** | NexGenU leadership / founders; full system access |
| **Command Dashboard** | Admin-only view spanning all 5 pillars |
| **Head Dashboard** | Pillar-scoped workspace for a single Head |
| **Overdue** | Computed flag: `due_date < now() AND status != approved` |
| **Submission** | A Head formal delivery of completed work for review |
| **Review queue** | Admin list of Submitted tasks awaiting approval |
| **Work log** | Dated time + note entries a Head attaches to a task |
| **Extension request** | A Head formal request to push a task due date |

