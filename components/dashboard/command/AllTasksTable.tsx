// components/dashboard/command/AllTasksTable.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Task, User, TaskPriority } from '@/types/database'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { formatDueDate, isOverdue } from '@/lib/utils'
import {
  Calendar,
  User as UserIcon,
  Repeat,
  Link as LinkIcon,
  ExternalLink,
  Users,
  CalendarDays,
  Flag,
  X,
  AlertTriangle,
  Loader2,
  CheckSquare,
} from 'lucide-react'
import {
  bulkReassignAction,
  bulkChangeDueDateAction,
  bulkChangePriorityAction,
} from '@/app/(dashboard)/command/actions'

interface AllTasksTableProps {
  tasks: Task[]
  showPillar?: boolean
}

type ModalType = 'none' | 'reassign' | 'due_date' | 'priority'

export function AllTasksTable({ tasks, showPillar = true }: AllTasksTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalType, setModalType] = useState<ModalType>('none')
  const [heads, setHeads] = useState<User[]>([])
  const [selectedHeadId, setSelectedHeadId] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/heads')
      .then((r) => r.json())
      .then((d) => setHeads(d.heads ?? []))
      .catch(() => {})
  }, [])

  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(tasks.map((t) => t.id))
    }
  }

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Selected tasks inspection for bulk reassignment
  const selectedTasks = tasks.filter((t) => selectedIds.includes(t.id))
  const selectedPillarIds = Array.from(new Set(selectedTasks.map((t) => t.pillar_id)))
  const isMixedPillars = selectedPillarIds.length > 1
  const commonPillarId = selectedPillarIds.length === 1 ? selectedPillarIds[0] : null
  const commonPillarName = selectedTasks[0]?.pillar?.name || 'Same Pillar'

  const filteredHeads = commonPillarId
    ? heads.filter((h) => h.pillar_id === commonPillarId)
    : heads

  // Actions
  async function handleBulkReassign() {
    if (isMixedPillars) {
      setActionError('Cannot bulk reassign tasks from multiple different pillars. All selected tasks must belong to the same pillar.')
      return
    }
    if (!selectedHeadId) {
      setActionError('Please select a head to reassign to.')
      return
    }

    setLoading(true)
    setActionError(null)

    const result = await bulkReassignAction(selectedIds, selectedHeadId)
    if (result.error) {
      setActionError(result.error)
      setLoading(false)
      return
    }

    setSelectedIds([])
    setModalType('none')
    setLoading(false)
    router.refresh()
  }

  async function handleBulkChangeDueDate() {
    if (!newDueDate) {
      setActionError('Please select a new due date.')
      return
    }

    setLoading(true)
    setActionError(null)

    const result = await bulkChangeDueDateAction(selectedIds, newDueDate)
    if (result.error) {
      setActionError(result.error)
      setLoading(false)
      return
    }

    setSelectedIds([])
    setModalType('none')
    setLoading(false)
    router.refresh()
  }

  async function handleBulkChangePriority() {
    setLoading(true)
    setActionError(null)

    const result = await bulkChangePriorityAction(selectedIds, newPriority)
    if (result.error) {
      setActionError(result.error)
      setLoading(false)
      return
    }

    setSelectedIds([])
    setModalType('none')
    setLoading(false)
    router.refresh()
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Table Container */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-default)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <th style={{ width: '40px', padding: '12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                    aria-label="Select all tasks"
                    id="select-all-tasks-checkbox"
                  />
                </th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Task Title</th>
                {showPillar && <th style={{ padding: '12px', fontWeight: 500 }}>Pillar</th>}
                <th style={{ padding: '12px', fontWeight: 500 }}>Assignee</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Priority</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Due Date</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>KPI</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isSelected = selectedIds.includes(task.id)
                const overdue = isOverdue(task.due_date, task.status)
                const isKpiUrl =
                  task.kpi_ref &&
                  (task.kpi_ref.startsWith('http://') || task.kpi_ref.startsWith('https://'))
                const kpiHref = isKpiUrl ? task.kpi_ref! : task.kpi_ref ? `https://${task.kpi_ref}` : ''

                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      background: isSelected ? 'rgba(185,251,194,0.06)' : 'transparent',
                      transition: 'background 120ms ease',
                    }}
                    className="hover:bg-[var(--surface-2)]"
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(task.id, e as unknown as React.MouseEvent)}
                        style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                        aria-label={`Select task ${task.title}`}
                        id={`select-task-${task.id}`}
                      />
                    </td>

                    {/* Title */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          href={`/command/tasks/${task.id}`}
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                          className="hover:text-[var(--color-accent)] hover:underline"
                        >
                          {task.title}
                        </Link>
                        {task.recurrence && task.recurrence !== 'none' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '11px',
                              color: 'var(--color-accent)',
                              background: 'rgba(185, 251, 194, 0.12)',
                              border: '1px solid rgba(185, 251, 194, 0.3)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                            }}
                            title={`Recurring task (${task.recurrence})`}
                          >
                            <Repeat size={10} />
                            {task.recurrence}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pillar */}
                    {showPillar && (
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {task.pillar ? (
                          <span
                            style={{
                              background: 'var(--surface-3)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                            }}
                          >
                            {task.pillar.nickname || task.pillar.name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}

                    {/* Assignee */}
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {task.assignee ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <UserIcon size={12} color="var(--text-muted)" />
                          {task.assignee.full_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={task.status} isOverdue={overdue} />
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px' }}>
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '12px' }}>
                      {task.due_date ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: overdue ? 'var(--color-orange)' : 'var(--text-secondary)',
                            fontSize: '12px',
                          }}
                        >
                          <Calendar size={12} />
                          {formatDueDate(task.due_date)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* KPI */}
                    <td style={{ padding: '12px' }}>
                      {task.kpi_ref ? (
                        <a
                          href={kpiHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-accent)',
                            textDecoration: 'none',
                            fontSize: '12px',
                          }}
                          className="hover:underline"
                          title={`KPI Ref: ${task.kpi_ref}`}
                        >
                          <LinkIcon size={13} />
                          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.kpi_ref}
                          </span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating / Sliding Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1000,
            animation: 'slideUp 200ms ease',
          }}
          id="bulk-action-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'var(--color-accent)',
                color: 'var(--surface-0)',
                fontWeight: 700,
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {selectedIds.length}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              tasks selected
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-default)' }} />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Reassign */}
            <button
              onClick={() => {
                setActionError(null)
                setModalType('reassign')
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              id="bulk-reassign-btn"
            >
              <Users size={14} />
              Reassign
            </button>

            {/* Change Due Date */}
            <button
              onClick={() => {
                setActionError(null)
                setModalType('due_date')
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              id="bulk-due-date-btn"
            >
              <CalendarDays size={14} />
              Change Due Date
            </button>

            {/* Change Priority */}
            <button
              onClick={() => {
                setActionError(null)
                setModalType('priority')
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              id="bulk-priority-btn"
            >
              <Flag size={14} />
              Change Priority
            </button>

            {/* Cancel selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)' }}
              title="Clear selection"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialogs */}
      {modalType !== 'none' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setModalType('none')
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '460px',
              animation: 'fadeIn 150ms ease',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                {modalType === 'reassign' && `Bulk Reassign (${selectedIds.length} tasks)`}
                {modalType === 'due_date' && `Change Due Date (${selectedIds.length} tasks)`}
                {modalType === 'priority' && `Change Priority (${selectedIds.length} tasks)`}
              </h3>
              <button
                onClick={() => setModalType('none')}
                disabled={loading}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error display */}
            {actionError && (
              <div
                style={{
                  background: 'rgba(255,99,0,0.1)',
                  border: '1px solid rgba(255,99,0,0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#FF9A50',
                  marginBottom: '16px',
                }}
                role="alert"
              >
                {actionError}
              </div>
            )}

            {/* Reassign Content */}
            {modalType === 'reassign' && (
              <div>
                {isMixedPillars ? (
                  <div
                    style={{
                      background: 'rgba(255,99,0,0.1)',
                      border: '1px solid rgba(255,99,0,0.3)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      color: '#FF9A50',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Cross-pillar reassignment blocked:</strong> The selected tasks belong to {selectedPillarIds.length} different pillars. All tasks in a bulk reassignment must belong to the same pillar.
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Reassign all {selectedIds.length} tasks in <strong>{commonPillarName}</strong> to a Head:
                    </p>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Select Head ({commonPillarName})
                    </label>
                    <select
                      className="input"
                      value={selectedHeadId}
                      onChange={(e) => setSelectedHeadId(e.target.value)}
                      id="bulk-reassign-head-select"
                    >
                      <option value="">Select a Head</option>
                      {filteredHeads.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.full_name} ({h.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkReassign}
                    disabled={loading || isMixedPillars || !selectedHeadId}
                    className="btn btn-primary"
                    id="confirm-bulk-reassign-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                        Reassigning…
                      </>
                    ) : (
                      'Confirm Reassignment'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Change Due Date Content */}
            {modalType === 'due_date' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Set a new due date for all {selectedIds.length} selected tasks:
                </p>
                <input
                  type="date"
                  className="input"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  style={{ marginBottom: '20px' }}
                  id="bulk-due-date-input"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkChangeDueDate}
                    disabled={loading || !newDueDate}
                    className="btn btn-primary"
                    id="confirm-bulk-due-date-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                        Updating…
                      </>
                    ) : (
                      'Update Due Date'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Change Priority Content */}
            {modalType === 'priority' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Set a new priority level for all {selectedIds.length} selected tasks:
                </p>
                <select
                  className="input"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  style={{ marginBottom: '20px' }}
                  id="bulk-priority-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkChangePriority}
                    disabled={loading}
                    className="btn btn-primary"
                    id="confirm-bulk-priority-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                        Updating…
                      </>
                    ) : (
                      'Update Priority'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
