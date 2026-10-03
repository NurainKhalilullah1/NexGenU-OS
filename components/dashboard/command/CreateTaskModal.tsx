// components/dashboard/command/CreateTaskModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { createTaskAction } from '@/app/(dashboard)/command/actions'
import type { Pillar, User } from '@/types/database'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [heads, setHeads] = useState<User[]>([])
  const [selectedPillar, setSelectedPillar] = useState('')
  const [recurrence, setRecurrence] = useState('none')

  useEffect(() => {
    if (!open) return
    // Fetch pillars and heads from API
    fetch('/api/pillars').then((r) => r.json()).then((d) => setPillars(d.pillars ?? []))
    fetch('/api/heads').then((r) => r.json()).then((d) => setHeads(d.heads ?? []))
  }, [open])

  const filteredHeads = selectedPillar
    ? heads.filter((h) => h.pillar_id === selectedPillar)
    : heads

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createTaskAction(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
    setLoading(false)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-modal-title"
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'fadeIn 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 id="create-task-modal-title" style={{ fontSize: '18px', fontWeight: 700 }}>Create Task</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label htmlFor="task-title" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Title <span style={{ color: 'var(--color-orange)' }}>*</span>
            </label>
            <input id="task-title" name="title" type="text" required className="input" placeholder="e.g. Prepare Q3 report" maxLength={200} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              id="task-desc"
              name="description"
              className="input"
              rows={3}
              placeholder="Add context, requirements, or links…"
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Pillar + Assignee row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="task-pillar" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Pillar <span style={{ color: 'var(--color-orange)' }}>*</span>
              </label>
              <select
                id="task-pillar"
                name="pillar_id"
                required
                className="input"
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
              >
                <option value="">Select pillar</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-assignee" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Assignee
              </label>
              <select id="task-assignee" name="assignee_id" className="input">
                <option value="">Unassigned</option>
                {filteredHeads.map((h) => (
                  <option key={h.id} value={h.id}>{h.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority + Due Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="task-priority" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Priority
              </label>
              <select id="task-priority" name="priority" className="input" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-due-date" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Due Date
              </label>
              <input id="task-due-date" name="due_date" type="date" className="input" />
            </div>
          </div>

          {/* Recurrence row */}
          <div>
            <label htmlFor="task-recurrence" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Recurrence
            </label>
            <select
              id="task-recurrence"
              name="recurrence"
              className="input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="none">None (One-off task)</option>
              <option value="weekly">Weekly (+7 days on approval)</option>
              <option value="monthly">Monthly (+1 month on approval)</option>
            </select>
            {recurrence !== 'none' && (
              <p style={{ fontSize: '12px', color: 'var(--color-accent)', marginTop: '4px' }}>
                Next instance auto-created on approval
              </p>
            )}
          </div>

          {/* KPI Ref */}
          <div>
            <label htmlFor="task-kpi" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              KPI Reference <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(URL or ID)</span>
            </label>
            <input
              id="task-kpi"
              name="kpi_ref"
              type="text"
              className="input"
              placeholder="e.g. https://metrics.nexgenu.org/kpi/12 or KPI-2026-Q3-01"
              maxLength={200}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(255,99,0,0.1)',
                border: '1px solid rgba(255,99,0,0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#FF9A50',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="create-task-submit-btn">
              {loading ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Creating…
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
