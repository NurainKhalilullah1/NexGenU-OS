// components/tasks/StopRecurrenceButton.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stopTaskRecurrenceAction } from '@/app/(dashboard)/command/actions'
import { RepeatOff, Loader2 } from 'lucide-react'

export function StopRecurrenceButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStop() {
    if (!confirm('Stop recurrence for this task? Next approval will not create another instance.')) return
    setLoading(true)
    await stopTaskRecurrenceAction(taskId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleStop}
      disabled={loading}
      className="btn btn-secondary btn-sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      id="stop-recurrence-btn"
      title="Stop auto-creating new recurring instances"
    >
      {loading ? (
        <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <RepeatOff size={13} />
      )}
      Stop recurrence after this
    </button>
  )
}
