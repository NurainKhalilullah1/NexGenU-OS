// lib/db/extensions.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ExtensionRequest, ActionResult } from '@/types/database'

export async function getExtensionRequestsForTask(taskId: string): Promise<ExtensionRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('extension_requests')
    .select(`
      *,
      requester:users!extension_requests_requester_id_fkey(id, full_name, email),
      reviewer:users!extension_requests_reviewer_id_fkey(id, full_name, email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching extension requests:', error)
    return []
  }

  return (data as unknown) as ExtensionRequest[]
}

export async function getPendingExtensionForTask(taskId: string): Promise<ExtensionRequest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('extension_requests')
    .select(`
      *,
      requester:users!extension_requests_requester_id_fkey(id, full_name, email)
    `)
    .eq('task_id', taskId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !data) return null
  return (data as unknown) as ExtensionRequest
}

export async function getPendingExtensionRequests(): Promise<ExtensionRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('extension_requests')
    .select(`
      *,
      task:tasks(id, title, pillar_id, due_date, pillar:pillars(name, nickname)),
      requester:users!extension_requests_requester_id_fkey(id, full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending extension requests:', error)
    return []
  }

  return (data as unknown) as ExtensionRequest[]
}

export async function createExtensionRequest(params: {
  taskId: string
  requesterId: string
  originalDate: string
  requestedDate: string
  reason: string
}): Promise<ActionResult<ExtensionRequest>> {
  const supabase = await createClient()

  // Check if a pending request already exists
  const existing = await getPendingExtensionForTask(params.taskId)
  if (existing) {
    return { data: null, error: 'A pending extension request already exists for this task.' }
  }

  const { data, error } = await supabase
    .from('extension_requests')
    .insert({
      task_id: params.taskId,
      requester_id: params.requesterId,
      original_date: params.originalDate,
      requested_date: params.requestedDate,
      reason: params.reason,
      status: 'pending',
    })
    .select(`
      *,
      requester:users!extension_requests_requester_id_fkey(id, full_name, email)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data as unknown) as ExtensionRequest, error: null }
}

export async function decideExtensionRequest(params: {
  requestId: string
  decision: 'approved' | 'declined' | 'denied'
  reviewerId: string
  decisionNote?: string | null
}): Promise<ActionResult<ExtensionRequest>> {
  const supabase = await createClient()

  // 1. Fetch current request to know target task and requested_date
  const { data: request, error: fetchErr } = await supabase
    .from('extension_requests')
    .select('*')
    .eq('id', params.requestId)
    .single()

  if (fetchErr || !request) {
    return { data: null, error: 'Extension request not found' }
  }

  // 2. Update extension_requests table
  const { data, error } = await supabase
    .from('extension_requests')
    .update({
      status: params.decision,
      reviewer_id: params.reviewerId,
      reviewed_at: new Date().toISOString(),
      decision_note: params.decisionNote ?? null,
    })
    .eq('id', params.requestId)
    .select(`
      *,
      requester:users!extension_requests_requester_id_fkey(id, full_name, email),
      reviewer:users!extension_requests_reviewer_id_fkey(id, full_name, email),
      task:tasks(id, title, pillar_id)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // 3. If approved, update the task's due_date
  if (params.decision === 'approved' && request.requested_date) {
    const serviceClient = createServiceClient()
    const { error: taskErr } = await serviceClient
      .from('tasks')
      .update({ due_date: request.requested_date })
      .eq('id', request.task_id)

    if (taskErr) {
      console.error('Error updating task due date on extension approval:', taskErr)
    }
  }

  return { data: (data as unknown) as ExtensionRequest, error: null }
}
