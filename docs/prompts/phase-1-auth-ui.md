# Prompt: Phase 1 — Auth, Design System & Shared UI (agent-auth + agent-ui)

Read CLAUDE.md fully before writing any code. The design system, color palette,
font, and component contracts there are mandatory. Do not deviate.

---

## Part A — Auth (agent-auth)

### 1. Supabase Client Setup
Create:
- lib/supabase/client.ts  — browser client (createBrowserClient)
- lib/supabase/server.ts  — server client (createServerClient using cookies)
- middleware.ts            — refresh session on every request; protect routes

Route protection rules in middleware.ts:
- Unauthenticated users → redirect to /login
- Authenticated Admin (role=admin) → allow /command/*, block /head/*
- Authenticated Head (role=head) → allow /head/*, block /command/*
- Both roles → allow /settings/*

### 2. Login Page (app/(auth)/login/page.tsx)
Design to brand spec:
- Full-page dark background: #1B2E34
- Centered card on surface #2A4954
- NexGenU logo/wordmark at top
- "Welcome back" heading in Nohemi Bold, white
- Email field and Password field (react-hook-form + Zod)
- "Sign in" button: background #B9FBC2, text #1B2E34, Nohemi SemiBold
- "Send magic link instead" toggle below
- Error state: orange #FF6300 inline under field
- On success: Server Action reads user role from users table → redirect

### 3. JWT Custom Claims
After login, attach role and pillar_id to the JWT so middleware and RLS
can read them without an extra DB round-trip.
Use Supabase auth.users custom claims via a database function/trigger:

```sql
CREATE OR REPLACE FUNCTION public.set_user_claims()
RETURNS trigger AS $$
BEGIN
  NEW.raw_app_meta_data = NEW.raw_app_meta_data ||
    jsonb_build_object(
      'role', (SELECT role FROM public.users WHERE id = NEW.id),
      'pillar_id', (SELECT pillar_id FROM public.users WHERE id = NEW.id)
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. User Invite Flow
Server Action in lib/db/users.ts:
- Admin calls inviteUser({ email, role, pillar_id })
- Uses supabase.auth.admin.inviteUserByEmail (service role)
- Creates a pending row in users table
- Redirects new user to set their password on first login

---

## Part B — Design System & Shared Components (agent-ui)

### 1. globals.css
Define ALL CSS custom properties from CLAUDE.md §3.1.
Import Nohemi via next/font/local (variable: --font-nohemi).
Set base styles:
- body: background #1B2E34, color #FFFFFF, font-family var(--font-nohemi)
- * box-sizing: border-box
- Scrollbar: thin, track #1B2E34, thumb #2A4954

### 2. app/layout.tsx
Load Nohemi:
```tsx
import localFont from "next/font/local"
const nohemi = localFont({
  src: [
    { path: "../public/fonts/Nohemi-Regular.woff2",  weight: "400" },
    { path: "../public/fonts/Nohemi-Medium.woff2",   weight: "500" },
    { path: "../public/fonts/Nohemi-SemiBold.woff2", weight: "600" },
    { path: "../public/fonts/Nohemi-Bold.woff2",     weight: "700" },
  ],
  variable: "--font-nohemi",
  display: "swap",
})
```

### 3. Sidebar (components/layout/Sidebar.tsx)
- Background: #2A4954
- Width: 240px expanded, 60px collapsed
- Collapse toggle button at bottom
- Nav items with icon (Lucide) + label
- Active item: left border 3px solid #B9FBC2, bg rgba(185,251,194,0.08), text #B9FBC2
- Hover: bg rgba(0,0,0,0.07)
- Bottom: user avatar, name, role badge, sign-out button
- Mobile: hidden by default, slides in as drawer (Sheet from shadcn/ui)

Admin nav items: Dashboard, Tasks, Review Queue, Workload, Reports, Audit Log, Users
Head nav items: My Dashboard, My Tasks, Settings

### 4. TopBar (components/layout/TopBar.tsx)
- Height: 56px
- Background: #1B2E34 with border-bottom 1px solid rgba(255,255,255,0.08)
- Left: hamburger (mobile) or breadcrumb (desktop)
- Right: notifications bell (with unread count badge in #FF6300), user avatar + menu
- Search input (desktop only): bg #2A4954, placeholder text-muted, focus border #B9FBC2

### 5. StatusBadge (components/tasks/StatusBadge.tsx)
Props: status: Status, showIcon?: boolean, size?: "sm" | "md"
Render a pill with icon + label. Colors per CLAUDE.md §3.2.
Icons: Circle (not started), Play (in progress), AlertCircle (blocked),
       Upload (submitted), RotateCcw (returned), CheckCircle (approved)

### 6. PriorityBadge (components/tasks/PriorityBadge.tsx)
Props: priority: Priority, size?: "sm" | "md"
Colors per CLAUDE.md §3.3.

### 7. SummaryCard (components/dashboard/shared/SummaryCard.tsx)
Props: label, value, icon, color, trend?, onClick?
- Card bg: #2A4954
- Icon in a small rounded square colored by `color` prop
- Large number value in Nohemi Bold 32px
- Label in text-secondary 13px
- Hover: bg rgba(0,0,0,0.07) overlay, cursor pointer if onClick provided

### 8. TaskCard (components/tasks/TaskCard.tsx)
Props: task, onClick, showPillar?
- Card bg: #2A4954, border 1px solid rgba(255,255,255,0.06)
- Left: title (white, 14px semibold), subtitle (due date, text-secondary)
- Right: PriorityBadge + StatusBadge
- Overdue flag: orange dot + "Overdue" text in #FF6300
- Hover: border-color rgba(185,251,194,0.2), bg rgba(0,0,0,0.07)
- Mobile: full width, stacked layout

### 9. EmptyState (components/shared/EmptyState.tsx)
Props: icon, title, description, action?
Centered layout, muted colors, optional CTA button.

### 10. LoadingSkeleton (components/shared/LoadingSkeleton.tsx)
Animated pulse skeleton using bg #2A4954 → #325666.
Variants: card, row, full-page

### 11. ConfirmDialog (components/shared/ConfirmDialog.tsx)
shadcn/ui AlertDialog base. Props: title, description, confirmLabel,
onConfirm, variant ("danger" | "default"). Danger uses #FF6300 confirm button.
