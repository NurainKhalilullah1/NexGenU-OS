// lib/db/task-logs.ts
import { createClient } from '@/lib/supabase/server'
import type { TaskLog, ActionResult } from '@/types/database'
import type { AddWorkLogInput } from '@/lib/validations/submission'
import { differenceInHours } from 'date-fns'

export async function getTaskLogs(taskId: string): Promise<TaskLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_logs')
    .select('*, user:users(id, full_name, email)')
    .eq('task_id', taskId)
    .order('log_date', { ascending: false })

  if (error) return []
  return data as TaskLog[]
}

export async function addTaskLog(
  input: AddWorkLogInput,
  userId: string
): Promise<ActionResult<TaskLog>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_logs')
    .insert({
      task_id: input.task_id,
      user_id: userId,
      log_date: input.log_date,
      hours: input.hours ?? null,
      note: input.note,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TaskLog, error: null }
}

export function canEditLog(log: TaskLog): boolean {
  return differenceInHours(new Date(), new Date(log.created_at)) < 24
}
