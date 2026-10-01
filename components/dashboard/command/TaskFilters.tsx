// components/dashboard/command/TaskFilters.tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Search, X, Link as LinkIcon } from 'lucide-react'
import type { Pillar } from '@/types/database'

export function TaskFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pillars, setPillars] = useState<Pillar[]>([])

  useEffect(() => {
    fetch('/api/pillars')
      .then((r) => r.json())
      .then((d) => setPillars(d.pillars ?? []))
      .catch(() => {})
  }, [])

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const clearFilters = () => router.push(pathname)
  const hasFilters = searchParams.size > 0
  const hasKpi = searchParams.get('kpi') === '1'

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '300px' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input"
          placeholder="Search tasks…"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          style={{ paddingLeft: 32, fontSize: '13px' }}
          id="task-search-input"
        />
      </div>

      {/* Pillar filter */}
      <select
        className="input"
        style={{ width: 'auto', fontSize: '13px' }}
        value={searchParams.get('pillar') ?? ''}
        onChange={(e) => updateFilter('pillar', e.target.value)}
        id="task-pillar-filter"
      >
        <option value="">All Pillars</option>
        {pillars.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        className="input"
        style={{ width: 'auto', fontSize: '13px' }}
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        id="task-status-filter"
      >
        <option value="">All statuses</option>
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="submitted">Submitted</option>
        <option value="returned">Returned</option>
        <option value="approved">Approved</option>
      </select>

      {/* Priority filter */}
      <select
        className="input"
        style={{ width: 'auto', fontSize: '13px' }}
        value={searchParams.get('priority') ?? ''}
        onChange={(e) => updateFilter('priority', e.target.value)}
        id="task-priority-filter"
      >
        <option value="">All priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Has KPI ref toggle */}
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '12px',
          color: hasKpi ? 'var(--color-accent)' : 'var(--text-secondary)',
          background: hasKpi ? 'rgba(185,251,194,0.1)' : 'var(--surface-1)',
          border: `1px solid ${hasKpi ? 'rgba(185,251,194,0.3)' : 'var(--border-default)'}`,
          padding: '6px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 150ms ease',
        }}
        id="kpi-ref-toggle-label"
      >
        <input
          type="checkbox"
          checked={hasKpi}
          onChange={(e) => updateFilter('kpi', e.target.checked ? '1' : '')}
          style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          id="task-has-kpi-checkbox"
        />
        <LinkIcon size={12} />
        Has KPI ref
      </label>

      {/* Clear */}
      {hasFilters && (
        <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ gap: 4 }} id="clear-filters-btn">
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}
