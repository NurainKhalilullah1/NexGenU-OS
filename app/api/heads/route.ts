// app/api/heads/route.ts
import { NextResponse } from 'next/server'
import { getAllHeads } from '@/lib/db/users'

export async function GET() {
  const heads = await getAllHeads()
  return NextResponse.json({ heads })
}
