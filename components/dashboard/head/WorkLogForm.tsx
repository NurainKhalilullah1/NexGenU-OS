// components/dashboard/head/WorkLogForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskLog } from '@/types/database'
import { addWorkLogAction } from '@/app/(dashboard)/head/actions'
import { formatDate } from '@/lib/utils'
import { Clock, Plus, Loader2, Lock, Check } from 'lucide-react'

interface WorkLogFormProps {
  taskId: string
  logs: TaskLog[]
  isTaskLocked?: boolean
}

export function WorkLogForm({ taskId, logs, isTaskLocked = false }: WorkLogFormProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('task_id', taskId)

    const result = await addWorkLogAction(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    form.reset()
    router.refresh()
    setTimeout(() => {
      setShowForm(false)
      setSuccess(false)
    }, 1200)
  }

  // Calculate total hours logged
  const totalHours = logs.reduce((acc, log) => acc + (log.hours || 0), 0)

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Work Log
          </h2>
          {totalHours > 0 && (
            <span
              style={{
                fontSize: '12px',
                background: 'var(--surface-3)',
                color: 'var(--color-accent)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 500,
              }}
            >
              {totalHours} hrs total
            </span>
          )}
        </div>

        {!isTaskLocked && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-secondary"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            Add Entry
          </button>
        )}
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>New Work Entry</span>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError(null)
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(255, 99, 0, 0.15)',
                border: '1px solid rgba(255, 99, 0, 0.4)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#FF9A50',
                marginBottom: '12px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(185, 251, 194, 0.15)',
                border: '1px solid rgba(185, 251, 194, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--color-accent)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} /> Log saved successfully!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Date *
              </label>
              <input
                type="date"
                name="log_date"
                required
                defaultValue={todayStr}
                className="input-field"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hours Spent (Optional)
              </label>
              <input
                type="number"
                name="hours"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="e.g. 2.5"
                className="input-field"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Progress Note * (min 3 chars)
            </label>
            <textarea
              name="note"
              required
              rows={3}
              placeholder="What did you build, test, or solve today?"
              className="input-field"
              style={{ width: '100%', fontSize: '13px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Logs List */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          No work logs recorded yet. Track your progress daily to keep stakeholders informed.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.map((log) => {
            const ageHours = (new Date().getTime() - new Date(log.created_at).getTime()) / (1000 * 60 * 60)
            const isLocked = ageHours >= 24

            return (
              <div
                key={log.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDate(log.log_date)}
                    </span>
                    {log.hours && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-accent)',
                          background: 'rgba(185, 251, 194, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {log.hours}h
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isLocked ? (
                      <span
                        title="Entry locked after 24 hours"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '11px', color: 'var(--text-muted)' }}
                      >
                        <Lock size={11} /> Locked
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Editable</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {log.note}
                </p>

                {log.user && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Logged by {log.user.full_name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
