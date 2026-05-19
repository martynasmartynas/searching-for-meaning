import type {
  DateFilter,
  ImageFilters,
  Orientation,
  SearchRequest,
  SortMode,
} from './types'

export const PER_PAGE_DEFAULT = 20
export const PER_PAGE_MAX = 50
export const MAX_RESULTS = 1000

const ORIENTATIONS: ReadonlySet<Orientation> = new Set(['landscape', 'portrait', 'square'])
const SORTS: ReadonlySet<SortMode> = new Set(['relevance', 'newest', 'oldest'])

export type RawSearchParams = Record<string, string | string[] | undefined>

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function csv(v: string | string[] | undefined): string[] | undefined {
  const raw = pickFirst(v)
  if (!raw) return undefined
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts : undefined
}

function pickEnum<T extends string>(
  v: string | string[] | undefined,
  allowed: ReadonlySet<T>,
): T | undefined {
  const raw = pickFirst(v)
  return raw && allowed.has(raw as T) ? (raw as T) : undefined
}

function pickInt(v: string | string[] | undefined): number | undefined {
  const raw = pickFirst(v)
  if (!raw) return undefined
  // Strict integer: reject "5e3", "5.7", " 5 ", "0x1f", and anything non-digit.
  if (!/^-?\d+$/.test(raw)) return undefined
  const n = Number(raw)
  return Number.isInteger(n) ? n : undefined
}

const MIN_YEAR = 1800
const MAX_YEAR = 2100

function pickYear(v: string | string[] | undefined): number | undefined {
  const n = pickInt(v)
  if (n === undefined) return undefined
  if (n < MIN_YEAR || n > MAX_YEAR) return undefined
  return n
}

function buildDateFilter(from?: number, to?: number): DateFilter | undefined {
  if (!from && !to) return undefined
  if (from && to && from === to) return { kind: 'year', year: from }
  return {
    kind: 'range',
    from: from ? new Date(Date.UTC(from, 0, 1)) : undefined,
    to: to ? new Date(Date.UTC(to, 11, 31, 23, 59, 59)) : undefined,
  }
}

export type ParsedSearch = {
  request: SearchRequest
  /** True when user-requested page was clamped down to fit MAX_RESULTS. */
  pageWasCapped: boolean
  /** Raw values useful for re-rendering form inputs. */
  raw: {
    q: string
    fromYear?: number
    toYear?: number
    sort: SortMode
    page: number
    perPage: number
    photographer?: string[]
    orientation?: Orientation
  }
}

export function parseSearchParams(sp: RawSearchParams): ParsedSearch {
  const q = pickFirst(sp.q) ?? ''
  const photographer = csv(sp.photographer)
  const orientation = pickEnum<Orientation>(sp.orient, ORIENTATIONS)
  const sort = pickEnum<SortMode>(sp.sort, SORTS) ?? 'relevance'

  const fromYear = pickYear(sp.from)
  const toYear = pickYear(sp.to)

  const requestedPerPage = pickInt(sp.size) ?? PER_PAGE_DEFAULT
  const perPage = Math.max(1, Math.min(requestedPerPage, PER_PAGE_MAX))

  const requestedPage = Math.max(1, pickInt(sp.page) ?? 1)
  const maxPage = Math.max(1, Math.floor(MAX_RESULTS / perPage))
  const page = Math.min(requestedPage, maxPage)
  const pageWasCapped = requestedPage > maxPage

  const filters: ImageFilters = {}
  if (photographer?.length) filters.photographer = photographer
  if (orientation)          filters.orientation = orientation
  const date = buildDateFilter(fromYear, toYear)
  if (date) filters.date = date

  return {
    request: {
      query: q,
      filters: Object.keys(filters).length ? filters : undefined,
      page,
      perPage,
      sort,
    },
    pageWasCapped,
    raw: { q, fromYear, toYear, sort, page, perPage, photographer, orientation },
  }
}

// ----- href builders ---------------------------------------------------------

type Patch = Record<string, string | string[] | number | undefined | null>

/**
 * Build a relative URL with the given patch applied to the current params.
 *  - `null` removes a key.
 *  - Arrays are serialised as comma-separated.
 *  - Anything else is coerced to string.
 *
 * Page is *not* automatically reset — pass `page: null` when you want to.
 */
export function hrefWith(current: RawSearchParams, patch: Patch): string {
  const out = new URLSearchParams()

  for (const [k, v] of Object.entries(current)) {
    if (k in patch) continue
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((x) => out.append(k, x))
    else out.set(k, v)
  }

  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      if (v.length) out.set(k, v.join(','))
    } else {
      const s = String(v)
      if (s) out.set(k, s)
    }
  }

  const qs = out.toString()
  return qs ? `/?${qs}` : '/'
}

/**
 * Toggle a value in/out of a comma-separated array param. Resets pagination
 * because the result set changes.
 */
export function toggleArrayHref(
  current: RawSearchParams,
  key: string,
  value: string,
): string {
  const existing = csv(current[key]) ?? []
  const next = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value]
  return hrefWith(current, { [key]: next.length ? next : null, page: null })
}

// ----- canonicalisation -----------------------------------------------------
//
// Drop unknown keys, drop invalid enum values, drop default values. If the
// canonical form differs from the incoming URL, the page redirects.

const KNOWN_KEYS: ReadonlySet<string> = new Set([
  'q', 'page', 'size', 'sort', 'from', 'to', 'photographer', 'orient',
])

function sortedQueryString(pairs: Array<[string, string]>): string {
  const sorted = [...pairs].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return new URLSearchParams(sorted).toString()
}

function incomingQueryString(sp: RawSearchParams): string {
  const pairs: Array<[string, string]> = []
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((x) => pairs.push([k, x]))
    else pairs.push([k, v])
  }
  return sortedQueryString(pairs)
}

function canonicalQueryString(sp: RawSearchParams): string {
  const { raw } = parseSearchParams(sp)
  const pairs: Array<[string, string]> = []

  if (raw.q)                                     pairs.push(['q', raw.q])
  if (raw.sort && raw.sort !== 'relevance')      pairs.push(['sort', raw.sort])
  if (raw.page > 1)                              pairs.push(['page', String(raw.page)])
  if (raw.perPage !== PER_PAGE_DEFAULT)          pairs.push(['size', String(raw.perPage)])
  if (raw.fromYear)                              pairs.push(['from', String(raw.fromYear)])
  if (raw.toYear)                                pairs.push(['to', String(raw.toYear)])
  if (raw.photographer?.length)                  pairs.push(['photographer', raw.photographer.join(',')])
  if (raw.orientation)                           pairs.push(['orient', raw.orientation])

  return sortedQueryString(pairs)
}

/**
 * Returns the canonical URL path if the incoming params differ from canonical
 * form. Used by the page to redirect away from URLs with unknown/invalid params.
 *
 *   ?orient=horizontal      → "/"                 (invalid enum dropped)
 *   ?q=foo&junk=bar         → "/?q=foo"           (unknown key stripped)
 *   ?q=foo&page=1&sort=relevance → "/?q=foo"      (defaults stripped)
 */
export function canonicalUrlIfDifferent(sp: RawSearchParams): string | null {
  const incoming = incomingQueryString(sp)
  const canonical = canonicalQueryString(sp)

  // Fast path: if no unknown keys and string already matches, no redirect.
  const onlyKnownKeys = Object.keys(sp).every((k) => KNOWN_KEYS.has(k))
  if (onlyKnownKeys && incoming === canonical) return null

  return canonical ? `/?${canonical}` : '/'
}
