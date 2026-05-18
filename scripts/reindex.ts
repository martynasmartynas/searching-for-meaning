// Full reindex of Meilisearch from the Postgres `images_search` view.
//
// This is the manual sync path used in M3 (before Sequin is wired up) and the
// permanent disaster-recovery / schema-migration tool from M4 onwards.
//
//   pnpm meili:reindex

import { sql } from 'drizzle-orm'
import { db } from '../lib/db/db'
import { imageSearch } from '../lib/search'
import type { ImageDoc } from '../lib/search/types'

const BATCH_SIZE = 1000

type ViewRow = Omit<ImageDoc, 'datum_ts' | 'updated_ts'> & {
  datum_ts: string | number   // bigint via pg → string
  updated_ts: string | number
}

async function* paginate(): AsyncIterable<ImageDoc[]> {
  let cursor: string | null = null
  while (true) {
    const result = cursor
      ? await db.execute(sql`
          SELECT * FROM images_search
          WHERE bildnummer > ${cursor}
          ORDER BY bildnummer
          LIMIT ${BATCH_SIZE}
        `)
      : await db.execute(sql`
          SELECT * FROM images_search
          ORDER BY bildnummer
          LIMIT ${BATCH_SIZE}
        `)

    const rows = result.rows as unknown as ViewRow[]
    if (rows.length === 0) return

    yield rows.map((r) => ({
      ...r,
      datum_ts: Number(r.datum_ts),
      updated_ts: Number(r.updated_ts),
    }))

    cursor = rows[rows.length - 1].bildnummer
  }
}

async function main() {
  let total = 0
  for await (const batch of paginate()) {
    await imageSearch.upsert(batch)
    total += batch.length
    console.log(`indexed ${total}`)
  }
  console.log(`done: ${total} total documents pushed to Meilisearch`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
