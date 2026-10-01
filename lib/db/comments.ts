// lib/db/comments.ts
import { createClient } from '@/lib/supabase/server'
import type { Comment, ActionResult } from '@/types/database'

export async function getCommentsForTask(taskId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users!comments_user_id_fkey(id, full_name, email, role)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return (data as unknown) as Comment[]
}

export async function getCommentCountForTask(taskId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)

  if (error) return 0
  return count ?? 0
}

export async function addComment(
  taskId: string,
  body: string,
  userId: string
): Promise<ActionResult<Comment>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      body: body.trim(),
    })
    .select('*, user:users!comments_user_id_fkey(id, full_name, email, role)')
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data as unknown) as Comment, error: null }
}
