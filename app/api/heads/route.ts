// app/api/heads/route.ts
import { NextResponse } from 'next/server'
import { getAssignableUsers } from '@/lib/db/users'

export async function GET() {
  const heads = await getAssignableUsers()
  return NextResponse.json({ heads })
}
