import { Meilisearch } from 'meilisearch'

declare global {
  // eslint-disable-next-line no-var
  var __meiliClient: Meilisearch | undefined
}

export const meili: Meilisearch =
  globalThis.__meiliClient ??
  new Meilisearch({
    host: process.env.MEILI_URL ?? 'http://localhost:7700',
    apiKey: process.env.MEILI_MASTER_KEY,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__meiliClient = meili
}
