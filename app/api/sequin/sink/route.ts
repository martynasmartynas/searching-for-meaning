import { NextResponse } from 'next/server'
import { processSequinEvents, type SequinPayload } from '@/lib/sync/sequin'

export const dynamic = 'force-dynamic'

function unauthorized(reason: string) {
  return NextResponse.json({ ok: false, error: reason }, { status: 401 })
}

export async function POST(req: Request) {
  const secret = process.env.SEQUIN_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'SEQUIN_WEBHOOK_SECRET not configured' },
      { status: 500 },
    )
  }

  // Sequin supports either an `Authorization: Bearer <token>` header or a
  // custom header. We accept both for flexibility.
  const auth = req.headers.get('authorization')
  const headerToken = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const customToken = req.headers.get('x-sequin-secret')
  const provided = headerToken ?? customToken

  if (provided !== secret) return unauthorized('bad secret')

  let payload: SequinPayload
  try {
    payload = (await req.json()) as SequinPayload
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON' },
      { status: 400 },
    )
  }

  try {
    const result = await processSequinEvents(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[sequin sink]', e)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}

// Sequin pings the endpoint with GET when configuring to verify it's reachable.
export async function GET() {
  return NextResponse.json({ ok: true, ready: true })
}
