// components/dashboard/command/CreateTaskButton.tsx
'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTaskModal } from './CreateTaskModal'

interface Props {
  defaultPillarId?: string
}

export function CreateTaskButton({ defaultPillarId }: Props = {}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ gap: 6 }}
        id="create-task-btn"
      >
        <Plus size={16} />
        New Task
      </button>
      <CreateTaskModal open={open} onClose={() => setOpen(false)} defaultPillarId={defaultPillarId} />
    </>
  )
}
