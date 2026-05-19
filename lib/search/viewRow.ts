// Single source of truth for converting `images_search` rows (as returned by
// the `pg` driver) into the `ImageDoc` shape Meilisearch indexes.
//
// The view returns BIGINT columns as strings; we coerce to numbers here.

import type { ImageDoc } from './types'

export type ViewRow = Omit<ImageDoc, 'datum_ts'> & {
  datum_ts: string | number
}

export function normalizeViewRow(row: ViewRow): ImageDoc {
  return {
    ...row,
    datum_ts: Number(row.datum_ts),
  }
}
