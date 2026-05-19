import { Meilisearch } from 'meilisearch'
import { cached } from '@/lib/cached'

export const meili = cached(
  'meili',
  () =>
    new Meilisearch({
      host: process.env.MEILI_URL ?? 'http://localhost:7700',
      apiKey: process.env.MEILI_MASTER_KEY,
    }),
)
