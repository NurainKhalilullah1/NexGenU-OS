// components/dashboard/command/TaskFilters.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'

export function TaskFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/command?${params.toString()}`)
  }, [router, searchParams])

  const clearFilters = () => router.push('/command')
  const hasFilters = searchParams.size > 0

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
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

      {/* Status filter */}
      <select
        className="input"
        style={{ width: 'auto', fontSize: '13px' }}
        defaultValue={searchParams.get('status') ?? ''}
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
        defaultValue={searchParams.get('priority') ?? ''}
        onChange={(e) => updateFilter('priority', e.target.value)}
        id="task-priority-filter"
      >
        <option value="">All priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

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
