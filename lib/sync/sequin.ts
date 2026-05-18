// Handle Sequin CDC events for the `images` table:
//   - insert / update  → look up the joined row in `images_search`, upsert to Meilisearch
//   - delete           → delete the doc by bildnummer
//
// Postgres logical replication only works on tables, not views. So Sequin
// watches `images` (and `photographers` if you want photographer renames to
// propagate), and this module is responsible for re-joining the data into the
// shape Meilisearch indexes.

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/db'
import { imageSearch } from '@/lib/search'
import type { ImageDoc } from '@/lib/search/types'

export type SequinAction = 'insert' | 'update' | 'delete' | 'read'

export type SequinEvent = {
  action: SequinAction
  record: Record<string, unknown> | null
  changes?: Record<string, unknown> | null
  metadata?: {
    table_name?: string
    table_schema?: string
    [k: string]: unknown
  }
}

export type SequinPayload = {
  data?: SequinEvent[]
} | SequinEvent[]

type ViewRow = Omit<ImageDoc, 'datum_ts' | 'updated_ts'> & {
  datum_ts: string | number
  updated_ts: string | number
}

function normalizeViewRow(row: ViewRow): ImageDoc {
  return {
    ...row,
    datum_ts: Number(row.datum_ts),
    updated_ts: Number(row.updated_ts),
  }
}

async function fetchFullDocs(bildnummern: string[]): Promise<ImageDoc[]> {
  if (bildnummern.length === 0) return []
  const placeholders = sql.join(
    bildnummern.map((b) => sql`${b}`),
    sql`, `,
  )
  const result = await db.execute(sql`
    SELECT * FROM images_search WHERE bildnummer IN (${placeholders})
  `)
  return (result.rows as unknown as ViewRow[]).map(normalizeViewRow)
}

function getBildnummer(ev: SequinEvent): string | null {
  const rec = ev.record
  if (!rec) return null
  const raw = (rec as Record<string, unknown>).bildnummer
  return typeof raw === 'string' ? raw : null
}

export type ProcessResult = {
  upserted: number
  deleted: number
  skipped: number
}

export async function processSequinEvents(
  payload: SequinPayload,
): Promise<ProcessResult> {
  const events = Array.isArray(payload) ? payload : payload.data ?? []

  const toUpsert: string[] = []
  const toDelete: string[] = []
  let skipped = 0

  for (const ev of events) {
    const bildnummer = getBildnummer(ev)
    if (!bildnummer) {
      skipped++
      continue
    }
    if (ev.action === 'delete') toDelete.push(bildnummer)
    else                        toUpsert.push(bildnummer)
  }

  const docs = await fetchFullDocs(toUpsert)
  // Any bildnummer in toUpsert that came back with no row — it was deleted
  // between the event and our lookup. Treat as a delete.
  const foundIds = new Set(docs.map((d) => d.bildnummer))
  const orphaned = toUpsert.filter((id) => !foundIds.has(id))

  await imageSearch.upsert(docs)
  await imageSearch.delete([...toDelete, ...orphaned])

  return {
    upserted: docs.length,
    deleted: toDelete.length + orphaned.length,
    skipped,
  }
}
