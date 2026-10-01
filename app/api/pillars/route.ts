// app/api/pillars/route.ts
import { NextResponse } from 'next/server'
import { getAllPillars } from '@/lib/db/pillars'

export async function GET() {
  const pillars = await getAllPillars()
  return NextResponse.json({ pillars })
}
