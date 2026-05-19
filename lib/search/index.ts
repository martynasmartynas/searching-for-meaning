import { cached } from '@/lib/cached'
import { meili } from './meili-client'
import { MeilisearchImageSearch } from './meilisearch-adapter'
import type { ImageSearch } from './types'

export const imageSearch: ImageSearch = cached(
  'imageSearch',
  () => new MeilisearchImageSearch(meili),
)

export type * from './types'
