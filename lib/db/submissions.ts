// lib/db/submissions.ts
import { createClient } from '@/lib/supabase/server'
import type { Submission, ActionResult } from '@/types/database'
import type { SubmitTaskInput } from '@/lib/validations/submission'

export async function getSubmissionsForTask(taskId: string): Promise<Submission[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('submissions')
    .select('*, user:users!submissions_user_id_fkey(id, full_name, email), reviewer:users!submissions_reviewer_id_fkey(id, full_name, email)')
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false })

  if (error) return []
  return data as Submission[]
}

export async function getPendingSubmissions(): Promise<Submission[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      task:tasks(id, title, pillar_id, due_date, pillar:pillars(name, nickname)),
      user:users!submissions_user_id_fkey(id, full_name, email)
    `)
    .eq('review_status', 'pending')
    .order('submitted_at', { ascending: true })

  if (error) return []
  return data as Submission[]
}

export async function createSubmission(
  input: SubmitTaskInput,
  userId: string
): Promise<ActionResult<Submission>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      task_id: input.task_id,
      user_id: userId,
      note: input.note,
      links: input.links,
      file_paths: input.file_paths ?? [],
      review_status: 'pending',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Submission, error: null }
}

export async function reviewSubmission(
  submissionId: string,
  decision: 'approved' | 'returned',
  feedback: string | null,
  reviewerId: string
): Promise<ActionResult<Submission>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('submissions')
    .update({
      review_status: decision,
      reviewer_id: reviewerId,
      feedback,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Submission, error: null }
}
