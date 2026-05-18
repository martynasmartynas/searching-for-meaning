import { meili } from './meili-client'
import { MeilisearchImageSearch } from './meilisearch-adapter'
import type { ImageSearch } from './types'

declare global {
  // eslint-disable-next-line no-var
  var __imageSearch: ImageSearch | undefined
}

export const imageSearch: ImageSearch =
  globalThis.__imageSearch ?? new MeilisearchImageSearch(meili)

if (process.env.NODE_ENV !== 'production') {
  globalThis.__imageSearch = imageSearch
}

export type * from './types'
