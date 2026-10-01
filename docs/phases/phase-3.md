# Phase 3 — Insight & Scale

> Agents: agent-cmd, agent-report, agent-qa
> Prerequisite: All Phase 2 acceptance tests passing.
> Goal: Leadership can answer "who is overloaded and what is overdue" from one screen.

---

## Scope

### Pillar Workload View
- [ ] Workload section on Command Dashboard (collapsible panel)
- [ ] One row per pillar showing:
  - Open task count
  - Overdue count (highlighted in orange)
  - Completed this month count
  - Capacity bar (open / total assigned, color-coded)
- [ ] Recharts horizontal bar chart comparing pillars side-by-side
- [ ] Click a pillar row to jump to the All Tasks table filtered by that pillar
- [ ] "Most overloaded pillar" callout card (highest open + overdue ratio)

### Reports & CSV Export
- [ ] Reports page at /command/reports
- [ ] Pre-built report views:
  - Completion rate by pillar (this month / last month / custom range)
  - Overdue tasks by pillar
  - Average time from assignment to approval per pillar
  - Tasks submitted vs tasks returned (return rate)
- [ ] Recharts charts for each report (bar, line, pie as appropriate)
- [ ] Filterable by: pillar, date range, priority, head
- [ ] Export to CSV button on every report view
  - Filename format: nexgenu-report-{type}-{date}.csv
  - Includes all visible columns and applied filters

### Recurring Tasks
- [ ] Recurrence field on Create Task form: None | Weekly | Monthly
- [ ] When a recurring task is Approved, the system auto-creates the
  next instance with a new due date (weekly +7 days, monthly +1 month)
- [ ] New instance inherits title, description, pillar, assignee, priority, kpi_ref
- [ ] Recurring badge shown on task cards
- [ ] Admin can stop recurrence from task detail (sets recurrence = none on next)

### Bulk Assign
- [ ] Checkbox column in All Tasks table (Command Dashboard)
- [ ] Bulk action bar appears when 1+ tasks selected:
  - Reassign to different head (within same pillar only)
  - Change due date
  - Change priority
- [ ] Confirmation dialog before bulk action executes
- [ ] Bulk actions written to audit_log as a single grouped entry

### KPI Reference Links
- [ ] kpi_ref field on Create Task form (optional text or URL)
- [ ] KPI ref shown as a clickable link on task detail (opens in new tab)
- [ ] Filterable in the All Tasks table (has KPI ref / no KPI ref toggle)

---

## Acceptance Tests (All Must Pass Before Phase 3 Ship)

1. Admin opens the Workload view and can identify in under 10 seconds
   which pillar has the most overdue tasks without any additional clicks.

2. Admin exports a "Completion rate by pillar" CSV for the last 30 days.
   The file downloads immediately and contains accurate data matching
   the on-screen chart.

3. Admin approves a recurring (weekly) task. Within one page refresh,
   a new task appears in the All Tasks table with the correct next
   due date and the recurring badge.

4. Admin selects 5 tasks from different pillars and attempts to bulk
   reassign them to a Head from a different pillar. The system blocks
   the cross-pillar reassignment and shows an error.

5. Admin selects 3 tasks from the same pillar and bulk-reassigns them.
   All 3 tasks update. One grouped entry appears in the audit log.

6. A task with a KPI ref URL shows a clickable link on the task detail
   page. Clicking it opens the URL in a new tab.

7. Reports page loads under 3 seconds on a simulated slow-3G connection
   (use Chrome DevTools throttling).

---

## Definition of Done

- All items above checked off
- No TypeScript errors
- No ESLint errors
- All 7 acceptance tests documented as passing
- CSV exports validated for data accuracy
- Recharts charts render correctly on mobile (375px)
- Full regression test of Phase 1 and Phase 2 features — nothing broken
- Stakeholder demo completed and sign-off received
