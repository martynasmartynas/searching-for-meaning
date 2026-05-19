import { describe, expect, it } from 'vitest'
import { MeilisearchImageSearch } from './meilisearch-adapter'
import type { ImageDoc, SearchRequest } from './types'

// ----- minimal fake to capture the search options the adapter constructs ----

type SearchOptions = Record<string, unknown>
type SearchHit = ImageDoc & { _formatted?: Partial<ImageDoc> }
type SearchResp = {
  hits: SearchHit[]
  page: number
  hitsPerPage: number
  totalHits: number
  totalPages: number
  facetDistribution?: Record<string, Record<string, number>>
  processingTimeMs: number
}

class FakeIndex {
  lastOptions?: SearchOptions
  lastQuery?: string
  added: ImageDoc[][] = []
  deleted: string[][] = []
  constructor(private response: SearchResp) {}
  async search(q: string, options: SearchOptions) {
    this.lastQuery = q
    this.lastOptions = options
    return this.response
  }
  async addDocuments(docs: ImageDoc[]) {
    this.added.push(docs)
  }
  async deleteDocuments(ids: string[]) {
    this.deleted.push(ids)
  }
}

function makeAdapter(partial: Partial<SearchResp> = {}) {
  const idx = new FakeIndex({
    hits: [],
    page: 1,
    hitsPerPage: 24,
    totalHits: 0,
    totalPages: 0,
    facetDistribution: {},
    processingTimeMs: 1,
    ...partial,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { index: () => idx } as any
  return { adapter: new MeilisearchImageSearch(client), idx }
}

async function runWith(req: SearchRequest, partial: Partial<SearchResp> = {}) {
  const { adapter, idx } = makeAdapter(partial)
  const res = await adapter.search(req)
  return { res, idx }
}

// helpers for computing expected epoch values
const sec = (d: Date) => Math.floor(d.getTime() / 1000)

// ----------------------------------------------------------------------------

describe('MeilisearchImageSearch.search — filter construction', () => {
  it('omits the filter param when no filters given', async () => {
    const { idx } = await runWith({ query: 'jackson' })
    expect(idx.lastOptions?.filter).toBeUndefined()
  })

  it('builds a photographer IN clause with double-quoted values', async () => {
    const { idx } = await runWith({
      query: '',
      filters: { photographer: ['Werek', 'Sven Simon'] },
    })
    expect(idx.lastOptions?.filter).toEqual([
      'fotografen IN ["Werek","Sven Simon"]',
    ])
  })

  it('escapes double quotes inside filter values', async () => {
    const { idx } = await runWith({
      query: '',
      filters: { photographer: ['Has "quotes" inside'] },
    })
    expect(idx.lastOptions?.filter).toEqual([
      'fotografen IN ["Has \\"quotes\\" inside"]',
    ])
  })

  it('builds an orientation equality clause', async () => {
    const { idx } = await runWith({
      query: '',
      filters: { orientation: 'landscape' },
    })
    expect(idx.lastOptions?.filter).toEqual(['orientation = "landscape"'])
  })

  it('builds a year filter as a date range over the whole year', async () => {
    const { idx } = await runWith({
      query: '',
      filters: { date: { kind: 'year', year: 1995 } },
    })
    const expectedStart = sec(new Date(Date.UTC(1995, 0, 1)))
    const expectedEnd = sec(new Date(Date.UTC(1995, 11, 31, 23, 59, 59)))
    expect(idx.lastOptions?.filter).toEqual([
      `datum_ts >= ${expectedStart} AND datum_ts <= ${expectedEnd}`,
    ])
  })

  it('builds a range filter with both bounds', async () => {
    const from = new Date(Date.UTC(1990, 0, 1))
    const to = new Date(Date.UTC(2000, 11, 31, 23, 59, 59))
    const { idx } = await runWith({
      query: '',
      filters: { date: { kind: 'range', from, to } },
    })
    expect(idx.lastOptions?.filter).toEqual([
      `datum_ts >= ${sec(from)} AND datum_ts <= ${sec(to)}`,
    ])
  })

  it('builds an open-ended range when only `from` is set', async () => {
    const from = new Date(Date.UTC(1990, 0, 1))
    const { idx } = await runWith({
      query: '',
      filters: { date: { kind: 'range', from } },
    })
    expect(idx.lastOptions?.filter).toEqual([`datum_ts >= ${sec(from)}`])
  })

  it('combines multiple filters into separate clauses (Meili ANDs them)', async () => {
    const { idx } = await runWith({
      query: '',
      filters: {
        photographer: ['Werek'],
        orientation: 'portrait',
        date: { kind: 'year', year: 2000 },
      },
    })
    const filter = idx.lastOptions?.filter as string[]
    expect(filter).toHaveLength(3)
    expect(filter).toContain('fotografen IN ["Werek"]')
    expect(filter).toContain('orientation = "portrait"')
    expect(filter.some((c) => c.startsWith('datum_ts >='))).toBe(true)
  })
})

describe('MeilisearchImageSearch.search — sort', () => {
  it('omits sort for relevance', async () => {
    const { idx } = await runWith({ query: '', sort: 'relevance' })
    expect(idx.lastOptions?.sort).toBeUndefined()
  })

  it('omits sort when not specified', async () => {
    const { idx } = await runWith({ query: '' })
    expect(idx.lastOptions?.sort).toBeUndefined()
  })

  it('sorts descending for newest', async () => {
    const { idx } = await runWith({ query: '', sort: 'newest' })
    expect(idx.lastOptions?.sort).toEqual(['datum_ts:desc'])
  })

  it('sorts ascending for oldest', async () => {
    const { idx } = await runWith({ query: '', sort: 'oldest' })
    expect(idx.lastOptions?.sort).toEqual(['datum_ts:asc'])
  })
})

describe('MeilisearchImageSearch.search — pagination', () => {
  it('passes through page + perPage to the engine', async () => {
    const { idx } = await runWith({ query: '', page: 3, perPage: 10 })
    expect(idx.lastOptions?.page).toBe(3)
    expect(idx.lastOptions?.hitsPerPage).toBe(10)
  })
})

describe('MeilisearchImageSearch.search — hit shape', () => {
  it('maps a doc to ImageHit (date from epoch seconds)', async () => {
    const doc: SearchHit = {
      bildnummer: '0059987730',
      suchtext: 'J.Morris',
      fotografen: 'United Archives International',
      agency: 'IMAGO',
      datum_ts: sec(new Date(Date.UTC(1900, 0, 1))),
      width: 3643,
      height: 2460,
      orientation: 'landscape',
      allowed_territories: ['DE', 'CH', 'AT'],
      denied_territories: null,
    }
    const { res } = await runWith({ query: 'morris' }, { hits: [doc], totalHits: 1, totalPages: 1 })
    expect(res.hits).toHaveLength(1)
    const hit = res.hits[0]
    expect(hit.bildnummer).toBe('0059987730')
    expect(hit.fotografen).toBe('United Archives International')
    expect(hit.agency).toBe('IMAGO')
    expect(hit.datum.toISOString()).toBe('1900-01-01T00:00:00.000Z')
    expect(hit.width).toBe(3643)
    expect(hit.orientation).toBe('landscape')
    expect(hit.allowedTerritories).toEqual(['DE', 'CH', 'AT'])
    expect(hit.deniedTerritories).toBeNull()
    expect(hit.highlight).toBeUndefined()
  })

  it('extracts the highlight from _formatted.suchtext when present', async () => {
    const doc: SearchHit = {
      bildnummer: 'X',
      suchtext: 'Plain text',
      fotografen: 'X',
      agency: null,
      datum_ts: 0,
      width: 1,
      height: 1,
      orientation: 'square',
      allowed_territories: null,
      denied_territories: null,
      _formatted: { suchtext: 'Plain <mark>text</mark>' },
    }
    const { res } = await runWith({ query: 'text' }, { hits: [doc], totalHits: 1, totalPages: 1 })
    expect(res.hits[0].highlight).toEqual({ suchtext: 'Plain <mark>text</mark>' })
  })
})

describe('MeilisearchImageSearch.search — facets', () => {
  it('sorts facet buckets by count descending', async () => {
    const { res } = await runWith(
      { query: '' },
      {
        facetDistribution: {
          fotografen: { Werek: 7, 'Sven Simon': 3, teutopress: 12 },
          orientation: { landscape: 4, portrait: 1 },
        },
      },
    )
    expect(res.facets?.fotografen).toEqual([
      { value: 'teutopress', count: 12 },
      { value: 'Werek', count: 7 },
      { value: 'Sven Simon', count: 3 },
    ])
    expect(res.facets?.orientation).toEqual([
      { value: 'landscape', count: 4 },
      { value: 'portrait', count: 1 },
    ])
  })

  it('handles missing facetDistribution gracefully', async () => {
    const { res } = await runWith({ query: '' }, { facetDistribution: undefined })
    expect(res.facets).toBeUndefined()
  })
})

describe('MeilisearchImageSearch — upsert / delete', () => {
  it('forwards docs to addDocuments with bildnummer primary key', async () => {
    const { adapter, idx } = makeAdapter()
    const doc: ImageDoc = {
      bildnummer: 'X',
      suchtext: 'x',
      fotografen: 'x',
      agency: null,
      datum_ts: 0,
      width: 1,
      height: 1,
      orientation: 'square',
      allowed_territories: null,
      denied_territories: null,
    }
    await adapter.upsert([doc])
    expect(idx.added).toEqual([[doc]])
  })

  it('no-ops upsert on empty input', async () => {
    const { adapter, idx } = makeAdapter()
    await adapter.upsert([])
    expect(idx.added).toEqual([])
  })

  it('forwards ids to deleteDocuments', async () => {
    const { adapter, idx } = makeAdapter()
    await adapter.delete(['A', 'B'])
    expect(idx.deleted).toEqual([['A', 'B']])
  })

  it('no-ops delete on empty input', async () => {
    const { adapter, idx } = makeAdapter()
    await adapter.delete([])
    expect(idx.deleted).toEqual([])
  })
})
