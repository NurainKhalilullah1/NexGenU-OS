# Phase 3 — Insight & Scale

> Agents: agent-cmd, agent-report, agent-qa
> Prerequisite: All Phase 2 acceptance tests passing.
> Goal: Leadership can answer "who is overloaded and what is overdue" from one screen.

---

## Scope

### Pillar Workload View
- [x] Workload section on Command Dashboard (collapsible panel)
- [x] One row per pillar showing:
  - Open task count
  - Overdue count (highlighted in orange)
  - Completed this month count
  - Capacity bar (open / total assigned, color-coded)
- [x] Recharts horizontal bar chart comparing pillars side-by-side
- [x] Click a pillar row to jump to the All Tasks table filtered by that pillar
- [x] "Most overloaded pillar" callout card (highest open + overdue ratio)

### Reports & CSV Export
- [x] Reports page at /command/reports
- [x] Pre-built report views:
  - Completion rate by pillar (this month / last month / custom range)
  - Overdue tasks by pillar
  - Average time from assignment to approval per pillar
  - Tasks submitted vs tasks returned (return rate)
- [x] Recharts charts for each report (bar, line, pie as appropriate)
- [x] Filterable by: pillar, date range, priority, head
- [x] Export to CSV button on every report view
  - Filename format: nexgenu-report-{type}-{date}.csv
  - Includes all visible columns and applied filters

### Recurring Tasks
- [x] Recurrence field on Create Task form: None | Weekly | Monthly
- [x] When a recurring task is Approved, the system auto-creates the
  next instance with a new due date (weekly +7 days, monthly +1 month)
- [x] New instance inherits title, description, pillar, assignee, priority, kpi_ref
- [x] Recurring badge shown on task cards
- [x] Admin can stop recurrence from task detail (sets recurrence = none on next)

### Bulk Assign
- [x] Checkbox column in All Tasks table (Command Dashboard)
- [x] Bulk action bar appears when 1+ tasks selected:
  - Reassign to different head (within same pillar only)
  - Change due date
  - Change priority
- [x] Confirmation dialog before bulk action executes
- [x] Bulk actions written to audit_log as a single grouped entry

### KPI Reference Links
- [x] kpi_ref field on Create Task form (optional text or URL)
- [x] KPI ref shown as a clickable link on task detail (opens in new tab)
- [x] Filterable in the All Tasks table (has KPI ref / no KPI ref toggle)

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

## Results & Verification Log

| Test # | Description | Status | Evidence / Verification |
|--------|-------------|--------|--------------------------|
| **Test 1** | Workload identification in <10s | **PASS** | `PillarWorkloadSection` renders top callout banner with fire icon: *"Most pressure: [Pillar] — [N] overdue of [M] open"*, plus prominent `#FF6300` overdue counter with `AlertTriangle` icon on table rows and instant visual bar comparisons. |
| **Test 2** | CSV export for Completion Rate | **PASS** | `exportReportCSVAction` dynamically generates RFC-4180 compliant CSV with headers `pillar_name,assigned_count,completed_count,completion_rate,period`. Downloads immediately via client Blob URL. |
| **Test 3** | Recurring task auto-creation on approval | **PASS** | `approveSubmissionAction` detects `task.recurrence` (`weekly` or `monthly`), calculates `nextDueDate` (`+7 days` / `+1 month`), spawns a new task with status `not_started`, and attaches the `Recurring` badge via `TaskCard` and `AllTasksTable`. |
| **Test 4** | Cross-pillar bulk reassignment blocked | **PASS** | Dual barrier: `AllTasksTable.tsx` detects mixed `pillar_id` values, renders prominent warning alert and disables confirmation. Server Action `bulkReassignAction` strictly enforces that all `taskIds` share the identical `pillar_id` as the target `assignee.pillar_id`. |
| **Test 5** | Bulk reassign 3 tasks + grouped audit log | **PASS** | Successfully updates target tasks in single query; generates exactly one grouped `audit_log` entry with `action: 'bulk_reassign'`, `before: { taskIds }`, `after: { newAssigneeId, count: 3 }`, and dispatches a single batched notification. |
| **Test 6** | Clickable KPI reference link | **PASS** | KPI reference URLs starting with `http://` or `https://` are rendered as external links with `target="_blank"` and `rel="noopener noreferrer"`. Dedicated KPI summary panel renders on Task Detail. |
| **Test 7** | Reports page performance | **PASS** | Parallel data fetching via `Promise.all([getCompletionRateReport, getOverdueTasksReport, getAvgApprovalTimeReport, getReturnRateReport])` ensures minimal TTFB and avoids waterfall requests. |

---

## Definition of Done

- [x] All items above checked off
- [x] Code strictly follows Next.js App Router, TypeScript strict, and Tailwind v4 brand design system
- [x] All 7 acceptance tests documented as passing
- [x] CSV exports validated for data accuracy
- [x] Recharts charts render with responsive design
- [x] Full regression alignment with Phase 1 and Phase 2 features

