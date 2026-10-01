// lib/db/audit-log.ts
import { createServiceClient } from '@/lib/supabase/server'
import type { AuditLog } from '@/types/database'

export async function addAuditLog(entry: {
  actor_id: string
  action: string
  entity: string
  entity_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('audit_log').insert(entry)
}

export async function getAuditLog(entityId?: string): Promise<AuditLog[]> {
  const supabase = createServiceClient()

  let query = supabase
    .from('audit_log')
    .select('*, actor:users(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return (data ?? []) as AuditLog[]
}

export async function getFilteredAuditLogs(params?: {
  actorId?: string
  entity?: string
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<{ logs: AuditLog[]; totalCount: number }> {
  const supabase = createServiceClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = params?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('audit_log')
    .select('*, actor:users(id, full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params?.actorId) query = query.eq('actor_id', params.actorId)
  if (params?.entity) query = query.eq('entity', params.entity)
  if (params?.action) query = query.eq('action', params.action)
  if (params?.startDate) query = query.gte('created_at', `${params.startDate}T00:00:00Z`)
  if (params?.endDate) query = query.lte('created_at', `${params.endDate}T23:59:59Z`)

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { logs: [], totalCount: 0 }
  }

  return {
    logs: (data ?? []) as AuditLog[],
    totalCount: count ?? 0,
  }
}

