// Domain-shaped search interface. Engine-agnostic.
// Adapters (Meilisearch, Typesense, Algolia, Postgres FTS) implement this.

export type Orientation = 'landscape' | 'portrait' | 'square'

export type DateFilter =
  | { kind: 'year';  year: number }
  | { kind: 'range'; from?: Date; to?: Date }

export type ImageFilters = {
  photographer?: string[]
  agency?: string[]
  orientation?: Orientation
  date?: DateFilter
}

export type SortMode = 'relevance' | 'newest' | 'oldest'

export type SearchRequest = {
  query: string
  filters?: ImageFilters
  page?: number       // 1-based
  perPage?: number    // default 24
  sort?: SortMode
}

export type ImageHit = {
  bildnummer: string
  suchtext: string
  fotografen: string
  agency: string | null
  datum: Date
  width: number
  height: number
  orientation: Orientation
  allowedTerritories: string[] | null
  deniedTerritories: string[] | null
  /** Engine-supplied HTML-highlighted version of `suchtext`, if any. */
  highlight?: { suchtext?: string }
}

export type FacetBucket = { value: string; count: number }

export type Facets = {
  fotografen?: FacetBucket[]
  agency?: FacetBucket[]
  orientation?: FacetBucket[]
}

export type SearchResponse = {
  hits: ImageHit[]
  page: number
  perPage: number
  total: number
  totalPages: number
  facets?: Facets
  tookMs: number
}

/**
 * The shape stored in the search engine. Matches `images_search` view in Postgres
 * — Sequin will ship this in M4; the reindex script ships it manually in M3.
 */
export type ImageDoc = {
  bildnummer: string
  suchtext: string
  fotografen: string
  agency: string | null
  datum_ts: number
  width: number
  height: number
  orientation: Orientation
  allowed_territories: string[] | null
  denied_territories: string[] | null
}

export interface ImageSearch {
  search(req: SearchRequest): Promise<SearchResponse>
  upsert(docs: ImageDoc[]): Promise<void>
  delete(ids: string[]): Promise<void>
  /** Stream documents from a source (Postgres cursor, file, etc.) into the engine. */
  reindexAll(source: AsyncIterable<ImageDoc[]>): Promise<number>
}
