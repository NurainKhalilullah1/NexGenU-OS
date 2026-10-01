# Prompt: Phase 3 — Insight & Scale (agent-cmd + agent-report)

Phase 1 and Phase 2 must be fully complete and all acceptance tests passing.
Read CLAUDE.md and docs/phases/phase-3.md fully first.

---

## Part A — Pillar Workload View (agent-cmd)

### Location
New collapsible section on /command page, between Summary Cards and Review Queue.
Heading: "Pillar Workload" with a collapse/expand chevron.

### Data Query (lib/db/tasks.ts)
```ts
getPillarWorkloadStats(): Promise<PillarWorkload[]>
// Returns per-pillar: { pillar, open, overdue, completedThisMonth, totalAssigned }
```

### Display
Table rows (one per pillar):
| Pillar | Nickname | Open | Overdue | Done This Month | Capacity Bar |
- Capacity bar: (open / totalAssigned) * 100 as a horizontal bar
  - 0-50%: accent mint
  - 51-75%: lavender
  - 76-100%: orange
- Overdue count: colored #FF6300 with AlertTriangle icon if > 0
- Click row: jumps to All Tasks table filtered by that pillar

### Recharts Bar Chart
Horizontal grouped bar chart below the table:
- X axis: Open tasks, Overdue tasks per pillar
- Y axis: Pillar names
- Colors: Open = mint (#B9FBC2), Overdue = orange (#FF6300)
- Responsive (ResponsiveContainer 100% width)
- Tooltip with exact values on hover

### Most Overloaded Callout Card
Above the chart, compute: pillar with highest (overdue / open) ratio.
Show a SummaryCard-style callout: "Most pressure: [Pillar name] — [N] overdue of [M] open"
Background: rgba(255,99,0,0.08), border-left: 3px #FF6300

---

## Part B — Reports & CSV Export (agent-report)

### Route: /command/reports

Left sidebar within the page: list of report types (vertical nav).
Main area: selected report view with chart + data table + Export CSV button.

### Report 1 — Completion Rate by Pillar
- Bar chart: completed tasks per pillar for selected period
- Period selector: This Month | Last Month | Custom range
- Table: Pillar | Assigned | Completed | Rate %
- CSV columns: pillar_name, assigned_count, completed_count, completion_rate, period

### Report 2 — Overdue Tasks by Pillar
- Horizontal bar chart: overdue count per pillar
- Table: Pillar | Head | Task Title | Due Date | Days Overdue
- CSV includes all table columns

### Report 3 — Avg Time Assignment → Approval
- Line chart by week (last 12 weeks)
- Table: Pillar | Avg Days | Min Days | Max Days | Sample Size
- Only includes approved tasks with a reviewed_at timestamp

### Report 4 — Return Rate
- Tasks submitted vs tasks returned (first-submission return rate)
- Donut chart per pillar
- Table: Pillar | Submitted | Returned | Return Rate %

### CSV Export
Each report has an "Export CSV" button (top right).
Server Action: exportReportCSV(reportType, filters)
- Returns a CSV string
- Response with Content-Disposition: attachment; filename="nexgenu-report-{type}-{date}.csv"
- All currently visible filter values applied to the export

---

## Part C — Recurring Tasks (agent-cmd)

### Create Task Form additions
- Recurrence field: None (default) | Weekly | Monthly (select dropdown)
- If recurrence set, show: "Next instance auto-created on approval"

### Recurrence Logic
In the approveSubmission Server Action (already exists from Phase 1):
After setting status = approved, check task.recurrence:
- If "none": do nothing extra
- If "weekly": create a new task copying title, description, pillar_id, assignee_id,
  priority, kpi_ref, recurrence. Set new due_date = old due_date + 7 days.
  Set status = not_started.
- If "monthly": same but + 1 month.
New task gets a notification to the assignee.
New task has a "recurring" tag shown as a badge on TaskCard.

### Stop Recurrence
On Task Detail (admin): "Stop recurrence after this" button.
Server Action: sets task.recurrence = none on the current task.
Next approval will not create another instance.

---

## Part D — Bulk Assign (agent-cmd)

### All Tasks Table additions
- Checkbox column (leftmost) — check individual rows or check-all header
- When 1+ rows checked: Bulk Action Bar slides up from bottom of table
  - "X tasks selected" | Reassign | Change Due Date | Change Priority | Cancel

### Reassign Modal
- Pillar select (must match all selected tasks pillar — warn if mixed pillars)
- Head select (filtered by chosen pillar)
- Confirm button
- Server Action: bulkReassign(taskIds, newAssigneeId)
  - Verify all tasks share the same pillar_id
  - Verify newAssignee.pillar_id = tasks[0].pillar_id
  - Update all tasks in a single transaction
  - Write ONE grouped audit_log entry: action="bulk_reassign", entity_id=first taskId,
    before={ taskIds, oldAssignee }, after={ newAssignee }
  - Notify new assignee once with a count: "You have been assigned 5 tasks"

### Change Due Date (bulk)
Date picker → apply to all selected tasks. Audit entry per task.

### Change Priority (bulk)
Priority select → apply to all selected. Audit entry per task.

---

## Part E — KPI Reference Links

Already stored in tasks.kpi_ref (Phase 1 schema).

Ensure:
- Create/Edit task form has a kpi_ref field (text input, optional, validated as URL if starts with http)
- Task Detail shows "KPI Reference" section with clickable link (opens new tab, rel="noopener noreferrer")
- All Tasks table: add a "KPI" column with a link icon (only shown if kpi_ref set)
- All Tasks filter: "Has KPI ref" toggle checkbox

---

## Acceptance Tests to Pass (from phase-3.md)
Run all 7 tests and document results.
After all pass, run a full regression test of Phase 1 and Phase 2 features.
Document everything in docs/phases/phase-3.md under a Results section.
