import { describe, expect, it } from 'vitest'
import {
  canonicalUrlIfDifferent,
  hrefWith,
  parseSearchParams,
  toggleArrayHref,
} from './searchParams'

describe('parseSearchParams', () => {
  it('returns defaults for empty input', () => {
    const { request, raw, pageWasCapped } = parseSearchParams({})
    expect(raw.q).toBe('')
    expect(raw.sort).toBe('relevance')
    expect(raw.page).toBe(1)
    expect(raw.perPage).toBe(20)
    expect(request.filters).toBeUndefined()
    expect(pageWasCapped).toBe(false)
  })

  it('parses query string', () => {
    expect(parseSearchParams({ q: 'jackson' }).raw.q).toBe('jackson')
  })

  it('parses csv photographer list and trims/dedupes', () => {
    const { raw } = parseSearchParams({ photographer: 'Sven Simon, Werek, Sven Simon' })
    expect(raw.photographer).toEqual(['Sven Simon', 'Werek', 'Sven Simon'])
  })

  it('drops invalid orientation', () => {
    expect(parseSearchParams({ orient: 'horizontal' }).raw.orientation).toBeUndefined()
  })

  it('accepts valid orientation', () => {
    expect(parseSearchParams({ orient: 'portrait' }).raw.orientation).toBe('portrait')
  })

  it('drops invalid sort and defaults to relevance', () => {
    expect(parseSearchParams({ sort: 'banana' }).raw.sort).toBe('relevance')
  })

  it('caps perPage to PER_PAGE_MAX', () => {
    expect(parseSearchParams({ size: '500' }).raw.perPage).toBe(50)
  })

  it('floors perPage at 1', () => {
    expect(parseSearchParams({ size: '-5' }).raw.perPage).toBe(1)
  })

  it('clamps deep pages and reports pageWasCapped', () => {
    // MAX_RESULTS=1000, perPage=20 → maxPage=50.
    const { raw, pageWasCapped } = parseSearchParams({ page: '999', size: '20' })
    expect(raw.page).toBe(50)
    expect(pageWasCapped).toBe(true)
  })

  it('builds year filter when from==to', () => {
    const { request } = parseSearchParams({ from: '1995', to: '1995' })
    expect(request.filters?.date).toEqual({ kind: 'year', year: 1995 })
  })

  it('builds range filter when from!=to', () => {
    const { request } = parseSearchParams({ from: '1990', to: '2000' })
    expect(request.filters?.date).toMatchObject({ kind: 'range' })
  })

  it('rejects years outside [1800, 2100]', () => {
    expect(parseSearchParams({ from: '1799' }).request.filters).toBeUndefined()
    expect(parseSearchParams({ to: '2101' }).request.filters).toBeUndefined()
    expect(parseSearchParams({ from: '-5' }).request.filters).toBeUndefined()
  })

  it('rejects non-integer page/size (exponentials, decimals)', () => {
    expect(parseSearchParams({ page: '1e9' }).raw.page).toBe(1)
    expect(parseSearchParams({ size: '5.7' }).raw.perPage).toBe(20)
    expect(parseSearchParams({ page: ' 5 ' }).raw.page).toBe(1)
  })
})

describe('hrefWith', () => {
  it('adds a new key', () => {
    expect(hrefWith({ q: 'jackson' }, { sort: 'newest' })).toBe('/?q=jackson&sort=newest')
  })

  it('overwrites an existing key', () => {
    expect(hrefWith({ q: 'old' }, { q: 'new' })).toBe('/?q=new')
  })

  it('removes a key when patch value is null', () => {
    expect(hrefWith({ q: 'jackson', page: '5' }, { page: null })).toBe('/?q=jackson')
  })

  it('serialises array values as csv', () => {
    expect(hrefWith({}, { photographer: ['A', 'B'] })).toBe('/?photographer=A%2CB')
  })

  it('removes a key when patch array is empty', () => {
    expect(hrefWith({ photographer: 'A,B' }, { photographer: [] })).toBe('/')
  })

  it('returns "/" when no params remain', () => {
    expect(hrefWith({ q: 'x' }, { q: null })).toBe('/')
  })
})

describe('toggleArrayHref', () => {
  it('adds a value when absent', () => {
    expect(toggleArrayHref({}, 'photographer', 'Werek')).toBe('/?photographer=Werek')
  })

  it('removes a value when present', () => {
    expect(toggleArrayHref({ photographer: 'Werek,Sven' }, 'photographer', 'Werek'))
      .toBe('/?photographer=Sven')
  })

  it('resets page when toggling (result set changes)', () => {
    const url = toggleArrayHref({ photographer: 'A', page: '5' }, 'photographer', 'B')
    expect(url).not.toContain('page=')
  })

  it('drops the key entirely when last value is removed', () => {
    expect(toggleArrayHref({ photographer: 'Werek' }, 'photographer', 'Werek')).toBe('/')
  })
})

describe('canonicalUrlIfDifferent', () => {
  it('returns null when URL is already canonical', () => {
    expect(canonicalUrlIfDifferent({ q: 'jackson' })).toBeNull()
  })

  it('strips unknown keys', () => {
    expect(canonicalUrlIfDifferent({ q: 'jackson', junk: 'bar' })).toBe('/?q=jackson')
  })

  it('strips invalid enum values', () => {
    expect(canonicalUrlIfDifferent({ orient: 'horizontal' })).toBe('/')
  })

  it('strips redundant default values', () => {
    expect(canonicalUrlIfDifferent({ q: 'jackson', page: '1', sort: 'relevance' }))
      .toBe('/?q=jackson')
    expect(canonicalUrlIfDifferent({ size: '20' })).toBe('/')
  })

  it('keeps non-default page', () => {
    expect(canonicalUrlIfDifferent({ q: 'jackson', page: '3' }))
      .toBeNull()
  })

  it('strips out-of-range years', () => {
    expect(canonicalUrlIfDifferent({ from: '1799' })).toBe('/')
    expect(canonicalUrlIfDifferent({ to: '2101' })).toBe('/')
  })
})
