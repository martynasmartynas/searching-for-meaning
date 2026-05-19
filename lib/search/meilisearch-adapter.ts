import type { Index, Meilisearch, SearchResponse as MeiliSearchResponse } from 'meilisearch'
import type {
  DateFilter,
  Facets,
  ImageDoc,
  ImageFilters,
  ImageHit,
  ImageSearch,
  SearchRequest,
  SearchResponse,
  SortMode,
} from './types'

const sec = (d: Date) => Math.floor(d.getTime() / 1000)
const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`

export class MeilisearchImageSearch implements ImageSearch {
  private index: Index

  constructor(client: Meilisearch, indexName = 'images') {
    this.index = client.index(indexName)
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    const filter = this.buildFilter(req.filters)
    const sort = this.buildSort(req.sort)

    const res = (await this.index.search(req.query || '', {
      filter,
      sort,
      page: req.page ?? 1,
      hitsPerPage: req.perPage ?? 24,
      facets: ['fotografen', 'agency', 'orientation'],
      attributesToHighlight: ['suchtext'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    })) as MeiliSearchResponse<ImageDoc>

    return {
      hits: res.hits.map(this.toHit),
      page: res.page ?? 1,
      perPage: res.hitsPerPage ?? req.perPage ?? 24,
      total: res.totalHits ?? 0,
      totalPages: res.totalPages ?? 0,
      facets: this.parseFacets(res.facetDistribution),
      tookMs: res.processingTimeMs,
    }
  }

  async upsert(docs: ImageDoc[]): Promise<void> {
    if (docs.length === 0) return
    await this.index.addDocuments(docs, { primaryKey: 'bildnummer' })
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.index.deleteDocuments(ids)
  }

  async reindexAll(source: AsyncIterable<ImageDoc[]>): Promise<number> {
    let total = 0
    for await (const batch of source) {
      await this.upsert(batch)
      total += batch.length
    }
    return total
  }

  // ---- private ------------------------------------------------------------

  private buildFilter(f?: ImageFilters): string[] | undefined {
    if (!f) return undefined
    const clauses: string[] = []

    if (f.photographer?.length) {
      clauses.push(`fotografen IN [${f.photographer.map(q).join(',')}]`)
    }
    if (f.agency?.length) {
      clauses.push(`agency IN [${f.agency.map(q).join(',')}]`)
    }
    if (f.orientation) {
      clauses.push(`orientation = ${q(f.orientation)}`)
    }
    if (f.date) {
      const dateClause = this.buildDateFilter(f.date)
      if (dateClause) clauses.push(dateClause)
    }

    return clauses.length ? clauses : undefined
  }

  private buildDateFilter(d: DateFilter): string | null {
    if (d.kind === 'year') {
      const start = sec(new Date(Date.UTC(d.year, 0, 1)))
      const end   = sec(new Date(Date.UTC(d.year, 11, 31, 23, 59, 59)))
      return `datum_ts >= ${start} AND datum_ts <= ${end}`
    }
    const parts: string[] = []
    if (d.from) parts.push(`datum_ts >= ${sec(d.from)}`)
    if (d.to)   parts.push(`datum_ts <= ${sec(d.to)}`)
    return parts.length ? parts.join(' AND ') : null
  }

  private buildSort(s?: SortMode): string[] | undefined {
    if (!s || s === 'relevance') return undefined
    return [`datum_ts:${s === 'newest' ? 'desc' : 'asc'}`]
  }

  private toHit = (
    h: ImageDoc & { _formatted?: Partial<ImageDoc> },
  ): ImageHit => ({
    bildnummer: h.bildnummer,
    suchtext: h.suchtext,
    fotografen: h.fotografen,
    agency: h.agency,
    datum: new Date(h.datum_ts * 1000),
    width: h.width,
    height: h.height,
    orientation: h.orientation,
    allowedTerritories: h.allowed_territories,
    deniedTerritories: h.denied_territories,
    highlight: h._formatted?.suchtext
      ? { suchtext: h._formatted.suchtext }
      : undefined,
  })

  private parseFacets(
    dist?: Record<string, Record<string, number>>,
  ): Facets | undefined {
    if (!dist) return undefined
    const buckets = (key: string) =>
      dist[key]
        ? Object.entries(dist[key])
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
        : undefined
    return {
      fotografen: buckets('fotografen'),
      agency: buckets('agency'),
      orientation: buckets('orientation'),
    }
  }
}
