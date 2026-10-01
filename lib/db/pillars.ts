// lib/db/pillars.ts
import { createClient } from '@/lib/supabase/server'
import type { Pillar } from '@/types/database'

export async function getAllPillars(): Promise<Pillar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pillars')
    .select('*')
    .order('name')

  if (error) return []
  return data as Pillar[]
}

export async function getPillarById(id: string): Promise<Pillar | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pillars')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Pillar
}
