// components/dashboard/command/AuditLogViewer.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AuditLog, User } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User as UserIcon,
} from 'lucide-react'

interface AuditLogViewerProps {
  logs: AuditLog[]
  totalCount: number
  users: User[]
  currentPage: number
  pageSize: number
}

export function AuditLogViewer({
  logs,
  totalCount,
  users,
  currentPage,
  pageSize,
}: AuditLogViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Read current filter state
  const selectedActor = searchParams.get('actor') || ''
  const selectedEntity = searchParams.get('entity') || ''
  const selectedAction = searchParams.get('action') || ''
  const startDate = searchParams.get('start_date') || ''
  const endDate = searchParams.get('end_date') || ''

  function toggleRow(id: string) {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // reset to page 1 on filter
    router.push(`/command/audit?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/command/audit?${params.toString()}`)
  }

  function handleExportCsvStub() {
    alert('CSV Export of filtered audit logs is a Phase 3 feature. Coming soon!')
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  function getActionBadgeStyle(action: string) {
    const act = action.toLowerCase()
    if (act.includes('create') || act.includes('approv') || act.includes('start')) {
      return {
        bg: 'rgba(185, 251, 194, 0.12)',
        color: 'var(--color-accent)',
        border: '1px solid rgba(185, 251, 194, 0.3)',
      }
    }
    if (act.includes('return') || act.includes('declin') || act.includes('block') || act.includes('delet')) {
      return {
        bg: 'rgba(255, 99, 0, 0.15)',
        color: 'var(--color-orange)',
        border: '1px solid rgba(255, 99, 0, 0.4)',
      }
    }
    // Update or default
    return {
      bg: 'rgba(207, 193, 252, 0.15)',
      color: 'var(--color-lavender)',
      border: '1px solid rgba(207, 193, 252, 0.35)',
    }
  }

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>
            System Audit Log
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Immutable activity stream &middot; {totalCount} total logged events
          </p>
        </div>

        <button
          onClick={handleExportCsvStub}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          className="hover:border-[var(--color-accent)] hover:text-[var(--text-primary)]"
        >
          <Download size={14} />
          Export CSV (Phase 3)
        </button>
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        {/* Actor */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Actor
          </label>
          <select
            value={selectedActor}
            onChange={(e) => handleFilterChange('actor', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Actors</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Entity Type
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Entities</option>
            <option value="tasks">Tasks</option>
            <option value="submissions">Submissions</option>
            <option value="extension_requests">Extension Requests</option>
            <option value="users">Users</option>
          </select>
        </div>

        {/* Action Type */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Actions</option>
            <option value="task.created">task.created</option>
            <option value="task.started">task.started</option>
            <option value="task.blocked">task.blocked</option>
            <option value="submission.created">submission.created</option>
            <option value="submission.approved">submission.approved</option>
            <option value="submission.returned">submission.returned</option>
            <option value="extension.requested">extension.requested</option>
            <option value="extension.approved">extension.approved</option>
            <option value="extension.declined">extension.declined</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* To Date */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            No audit records found matching the current filters.
          </div>
        ) : (
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
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border-default)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '30px' }} />
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Actor</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Entity</th>
                  <th style={{ padding: '12px 16px' }}>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = !!expandedRows[log.id]
                  const badge = getActionBadgeStyle(log.action)
                  const hasDetails = log.before || log.after

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        background: isExpanded ? 'rgba(0,0,0,0.1)' : 'transparent',
                      }}
                      className="hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <td style={{ padding: '12px 16px' }}>
                        {hasDetails && (
                          <button
                            type="button"
                            onClick={() => toggleRow(log.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            className="hover:text-[var(--text-primary)]"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </td>

                      <td
                        style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
                        title={formatDate(log.created_at)}
                      >
                        <span style={{ color: 'var(--text-primary)' }}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {log.actor?.full_name || 'System'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            display: 'inline-block',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {log.entity}
                      </td>

                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.entity_id ? `${log.entity_id.substring(0, 8)}...` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded Diff Cards container for open rows */}
      {logs.some((l) => expandedRows[l.id]) && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs
            .filter((l) => expandedRows[l.id])
            .map((log) => (
              <div
                key={`diff-${log.id}`}
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Before / After State Diff: <strong>{log.action}</strong></span>
                  <button
                    onClick={() => toggleRow(log.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Close Diff
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-orange)', textTransform: 'uppercase', fontWeight: 600 }}>Before</span>
                    <pre
                      style={{
                        background: 'var(--surface-1)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.7)',
                        overflowX: 'auto',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {JSON.stringify(log.before || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>After</span>
                    <pre
                      style={{
                        background: 'var(--surface-1)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#B9FBC2',
                        overflowX: 'auto',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {JSON.stringify(log.after || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Showing page {currentPage} of {totalPages} ({totalCount} items)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
