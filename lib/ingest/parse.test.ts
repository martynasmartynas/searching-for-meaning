import { describe, expect, it } from 'vitest'
import {
  normalizeSuchtext,
  parseGermanDate,
  parsePhotographer,
  parseTerritories,
  stripArchiveRef,
  stripTerritoryTag,
} from './parse'

describe('parseTerritories', () => {
  it('parses PUBLICATIONxIN…xONLY as allowed (single country)', () => {
    expect(parseTerritories('PUBLICATIONxINxGERxONLY')).toEqual({ allowed: ['DE'] })
  })

  it('parses PUBLICATIONxIN…xONLY as allowed (multiple countries)', () => {
    expect(parseTerritories('Caption PUBLICATIONxINxGERxSUIxAUTxONLY tail')).toEqual({
      allowed: ['DE', 'CH', 'AT'],
    })
  })

  it('parses PUBLICATIONxNOTxIN… as denied (no ONLY suffix)', () => {
    expect(parseTerritories('Foo PUBLICATIONxNOTxINxUSA bar')).toEqual({ denied: ['US'] })
  })

  it('parses PUBLICATIONxNOTxIN…xONLY as denied (with ONLY suffix)', () => {
    expect(parseTerritories('PUBLICATIONxNOTxINxUSAxONLY')).toEqual({ denied: ['US'] })
  })

  it('parses NOxSALExIN… as denied', () => {
    expect(parseTerritories('Caption NOxSALExINxJPN')).toEqual({ denied: ['JP'] })
  })

  it('handles allow + deny in the same caption', () => {
    expect(
      parseTerritories('PUBLICATIONxINxGERxONLY PUBLICATIONxNOTxINxUSA'),
    ).toEqual({ allowed: ['DE'], denied: ['US'] })
  })

  it('dedupes repeated country codes', () => {
    expect(parseTerritories('PUBLICATIONxINxGERxONLY PUBLICATIONxINxGERxONLY')).toEqual({
      allowed: ['DE'],
    })
  })

  it('drops unknown IOC codes silently', () => {
    expect(parseTerritories('PUBLICATIONxINxZZZxGERxONLY')).toEqual({ allowed: ['DE'] })
  })

  it('returns empty object for plain captions', () => {
    expect(parseTerritories('Just a plain caption with no tags.')).toEqual({})
  })
})

describe('stripTerritoryTag', () => {
  it('removes the full tag including xONLY suffix', () => {
    expect(stripTerritoryTag('Caption PUBLICATIONxINxGERxSUIxAUTxONLY tail')).toBe(
      'Caption tail',
    )
  })

  it('removes tags without xONLY suffix', () => {
    expect(stripTerritoryTag('Foo PUBLICATIONxNOTxINxUSA bar')).toBe('Foo bar')
  })

  it('removes NOxSALE tags', () => {
    expect(stripTerritoryTag('Caption NOxSALExINxJPN')).toBe('Caption')
  })

  it('removes multiple tags from one caption', () => {
    expect(
      stripTerritoryTag('a PUBLICATIONxINxGERxONLY b PUBLICATIONxNOTxINxUSA c'),
    ).toBe('a b c')
  })

  it('collapses whitespace created by removal', () => {
    expect(stripTerritoryTag('  PUBLICATIONxINxGERxONLY   ')).toBe('')
  })

  it('leaves plain captions untouched', () => {
    expect(stripTerritoryTag('Just a plain caption.')).toBe('Just a plain caption.')
  })
})

describe('stripArchiveRef', () => {
  it('removes UnitedArchives codes', () => {
    expect(
      stripArchiveRef(
        'J.Morris Manchester Utd 1948 UnitedArchives00421716 tail',
      ),
    ).toBe('J.Morris Manchester Utd 1948 tail')
  })

  it('removes UA_-prefixed codes', () => {
    expect(stripArchiveRef('Caption UA_00421716 here')).toBe('Caption here')
  })

  it('removes IMG_-prefixed codes', () => {
    expect(stripArchiveRef('Caption IMG_2024_889201 here')).toBe('Caption here')
  })

  it('leaves the rest of the caption untouched', () => {
    expect(stripArchiveRef('Steffi Graf Wimbledon 1988 Tennis')).toBe(
      'Steffi Graf Wimbledon 1988 Tennis',
    )
  })

  it('collapses whitespace introduced by the removal', () => {
    expect(stripArchiveRef('foo    UnitedArchives12345    bar')).toBe('foo bar')
  })
})

describe('normalizeSuchtext (full pipeline)', () => {
  it('matches the J.Morris canonical example', () => {
    const raw =
      'J.Morris, Manchester Utd inside right 7th January 1948 UnitedArchives00421716 PUBLICATIONxINxGERxSUIxAUTxONLY'
    expect(normalizeSuchtext(raw)).toBe(
      'J.Morris, Manchester Utd inside right 7th January 1948',
    )
  })

  it('strips multiple noise types in one pass', () => {
    const raw =
      'Boris Becker Match UnitedArchives0089112 PUBLICATIONxNOTxINxUSA NOxSALExINxJPN'
    expect(normalizeSuchtext(raw)).toBe('Boris Becker Match')
  })

  it('is idempotent — re-applying produces the same result', () => {
    const raw =
      'Caption UnitedArchives12345 PUBLICATIONxINxGERxONLY rest'
    const once = normalizeSuchtext(raw)
    expect(normalizeSuchtext(once)).toBe(once)
  })
})

describe('parsePhotographer', () => {
  it('splits "IMAGO / teutopress" into agency + photographer', () => {
    expect(parsePhotographer('IMAGO / teutopress')).toEqual({
      agency: 'IMAGO',
      photographer: 'teutopress',
    })
  })

  it('handles missing whitespace around the slash', () => {
    expect(parsePhotographer('IMAGO/teutopress')).toEqual({
      agency: 'IMAGO',
      photographer: 'teutopress',
    })
  })

  it('trims surrounding whitespace', () => {
    expect(parsePhotographer('  IMAGO  /  Sven Simon  ')).toEqual({
      agency: 'IMAGO',
      photographer: 'Sven Simon',
    })
  })

  it('handles a non-IMAGO agency', () => {
    expect(parsePhotographer('dpa / Frank Rumpenhorst')).toEqual({
      agency: 'dpa',
      photographer: 'Frank Rumpenhorst',
    })
  })

  it('returns null agency for solo photographers (no slash)', () => {
    expect(parsePhotographer('Solo Photographer')).toEqual({
      agency: null,
      photographer: 'Solo Photographer',
    })
  })

  it('treats only the first slash as the separator', () => {
    expect(parsePhotographer('AP / Some / Name')).toEqual({
      agency: 'AP',
      photographer: 'Some / Name',
    })
  })
})

describe('parseGermanDate', () => {
  it('parses DD.MM.YYYY into a UTC Date', () => {
    const d = parseGermanDate('01.11.1995')
    expect(d.getUTCFullYear()).toBe(1995)
    expect(d.getUTCMonth()).toBe(10) // 0-indexed
    expect(d.getUTCDate()).toBe(1)
    expect(d.getUTCHours()).toBe(0)
  })

  it('accepts single-digit day and month', () => {
    const d = parseGermanDate('5.7.1980')
    expect(d.getUTCFullYear()).toBe(1980)
    expect(d.getUTCMonth()).toBe(6)
    expect(d.getUTCDate()).toBe(5)
  })

  it('trims surrounding whitespace', () => {
    const d = parseGermanDate('  31.12.2000  ')
    expect(d.toISOString()).toBe('2000-12-31T00:00:00.000Z')
  })

  it('throws on malformed input', () => {
    expect(() => parseGermanDate('1995-11-01')).toThrow(/Bad German date/)
    expect(() => parseGermanDate('nope')).toThrow(/Bad German date/)
    expect(() => parseGermanDate('')).toThrow(/Bad German date/)
  })

  it('throws on impossible dates (no silent rollover)', () => {
    expect(() => parseGermanDate('31.02.2020')).toThrow(/Bad German date/)
    expect(() => parseGermanDate('45.13.2020')).toThrow(/Bad German date/)
    expect(() => parseGermanDate('00.01.2020')).toThrow(/Bad German date/)
    expect(() => parseGermanDate('29.02.2021')).toThrow(/Bad German date/) // not a leap year
  })

  it('accepts leap-year Feb 29', () => {
    const d = parseGermanDate('29.02.2020')
    expect(d.toISOString()).toBe('2020-02-29T00:00:00.000Z')
  })
})
