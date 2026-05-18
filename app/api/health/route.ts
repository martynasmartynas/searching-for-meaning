import { NextResponse } from 'next/server'
import { pool } from '@/lib/db/client'
import { meili } from '@/lib/search/meili-client'

export const dynamic = 'force-dynamic'

type Probe = { ok: true } | { ok: false; error: string }

async function checkPostgres(): Promise<Probe> {
  try {
    await pool.query('SELECT 1')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function checkMeilisearch(): Promise<Probe> {
  try {
    const res = await meili.health()
    return res.status === 'available'
      ? { ok: true }
      : { ok: false, error: `status=${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function GET() {
  const [postgres, meilisearch] = await Promise.all([checkPostgres(), checkMeilisearch()])
  const ok = postgres.ok && meilisearch.ok
  return NextResponse.json(
    { ok, postgres, meilisearch },
    { status: ok ? 200 : 503 },
  )
}
