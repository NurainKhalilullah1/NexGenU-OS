// lib/db/users.ts
import { createClient } from '@/lib/supabase/server'
import type { User, ActionResult } from '@/types/database'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) return null
  return data as User
}

export async function getUsersByPillar(pillarId: string): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pillar_id', pillarId)
    .eq('active', true)
    .order('full_name')

  if (error) return []
  return data as User[]
}

export async function getAllHeads(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('role', 'head')
    .eq('active', true)
    .order('full_name')

  if (error) return []
  return data as User[]
}

export async function getAssignableUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .in('role', ['admin', 'head', 'member'])
    .eq('active', true)
    .order('role', { ascending: true })
    .order('full_name')

  if (error) return []
  return data as User[]
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('active', true)
    .order('full_name')

  if (error) return []
  return data as User[]
}

export async function inviteUser(
  email: string,
  role: 'admin' | 'head',
  pillarId: string | null,
  fullName: string
): Promise<ActionResult<{ id: string }>> {
  // This uses service client — server only
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, pillar_id: pillarId, full_name: fullName },
  })

  if (error) return { data: null, error: error.message }
  return { data: { id: data.user.id }, error: null }
}
