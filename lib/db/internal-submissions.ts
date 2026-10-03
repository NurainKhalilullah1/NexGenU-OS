// lib/db/internal-submissions.ts
// Query helpers for the Member -> Head internal submission chain
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { InternalSubmission, ActionResult } from '@/types/database'

/** Get all pending internal submissions for a head's pillar */
export async function getInternalSubmissionsForHead(pillarId: string): Promise<InternalSubmission[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('internal_submissions')
    .select('*, submitter:users!submitted_by(id, full_name, email, role), task:tasks!task_id(id, title, pillar_id)')
    .eq('status', 'pending')
    .in('task_id',
      supabase.from('tasks').select('id').eq('pillar_id', pillarId)
    )
    .order('created_at', { ascending: false })
  return (data ?? []) as InternalSubmission[]
}

/** Get all internal submissions by a member */
export async function getInternalSubmissionsForMember(memberId: string): Promise<InternalSubmission[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('internal_submissions')
    .select('*, task:tasks!task_id(id, title, pillar_id)')
    .eq('submitted_by', memberId)
    .order('created_at', { ascending: false })
  return (data ?? []) as InternalSubmission[]
}

/** Member submits work to Head */
export async function createInternalSubmission(input: {
  task_id: string
  submitted_by: string
  notes: string
  file_urls?: string[]
}): Promise<ActionResult<InternalSubmission>> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('internal_submissions')
    .insert({
      task_id: input.task_id,
      submitted_by: input.submitted_by,
      notes: input.notes,
      file_urls: input.file_urls ?? [],
      status: 'pending',
    })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as InternalSubmission, error: null }
}

/** Head reviews a member submission */
export async function reviewInternalSubmission(input: {
  id: string
  status: 'approved' | 'returned'
  head_feedback: string
  reviewer_id: string
}): Promise<ActionResult<InternalSubmission>> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('internal_submissions')
    .update({
      status: input.status,
      head_feedback: input.head_feedback,
      reviewed_by: input.reviewer_id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as InternalSubmission, error: null }
}
