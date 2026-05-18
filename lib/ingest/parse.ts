// IOC/FIFA country codes used in IMAGO rights tags → ISO 3166-1 alpha-2
const IOC_TO_ISO: Record<string, string> = {
  GER: 'DE', SUI: 'CH', AUT: 'AT', USA: 'US', GBR: 'GB', FRA: 'FR',
  ITA: 'IT', ESP: 'ES', NED: 'NL', BEL: 'BE', DEN: 'DK', SWE: 'SE',
  NOR: 'NO', FIN: 'FI', POL: 'PL', CZE: 'CZ', JPN: 'JP', CHN: 'CN',
  KOR: 'KR', RUS: 'RU', BRA: 'BR', ARG: 'AR', CAN: 'CA', AUS: 'AU',
}

// Matches both forms — with or without trailing xONLY:
//   PUBLICATIONxINxGERxSUIxAUTxONLY     (allow)
//   PUBLICATIONxINxGERxONLY             (allow)
//   PUBLICATIONxNOTxINxUSA              (deny, no ONLY)
//   PUBLICATIONxNOTxINxUSAxONLY         (deny, with ONLY)
//
// The non-greedy codes + trailing lookahead prevents `xONL` of `xONLY`
// from being captured as a 3-letter code.
const TAG_RE =
  /PUBLICATIONx(IN|NOTxIN)((?:x[A-Z]{3})+?)(?:xONLY)?(?=\s|$|[^A-Za-z])/g

// "No sale" is always a denial:
//   NOxSALExINxJPN
const NOSALE_RE = /NOxSALExIN((?:x[A-Z]{3})+)(?=\s|$|[^A-Za-z])/g

const COMBINED_STRIP_RE = new RegExp(
  `(${TAG_RE.source})|(${NOSALE_RE.source})`,
  'g',
)

// Internal archive-reference codes embedded in captions. Examples:
//   UnitedArchives00421716
//   UA_00421716
//   IMG_2024_889201
// They're vendor-internal pointers and have no value as searchable text.
const ARCHIVE_REF_RE =
  /\b(?:UnitedArchives|UA|IMG)[_\d]*\d{4,}\b/g

type Territories = { allowed?: string[]; denied?: string[] }

function codesToIso(codeBlock: string): string[] {
  return [...codeBlock.matchAll(/x([A-Z]{3})/g)]
    .map((m) => IOC_TO_ISO[m[1]])
    .filter((iso): iso is string => Boolean(iso))
}

export function parseTerritories(suchtext: string): Territories {
  const allowed: string[] = []
  const denied: string[] = []

  for (const m of suchtext.matchAll(TAG_RE)) {
    const isNegation = m[1] === 'NOTxIN'
    const isos = codesToIso(m[2])
    if (isNegation) denied.push(...isos)
    else            allowed.push(...isos)
  }

  for (const m of suchtext.matchAll(NOSALE_RE)) {
    denied.push(...codesToIso(m[1]))
  }

  const out: Territories = {}
  if (allowed.length) out.allowed = [...new Set(allowed)]
  if (denied.length)  out.denied  = [...new Set(denied)]
  return out
}

export function stripTerritoryTag(suchtext: string): string {
  return suchtext
    .replace(COMBINED_STRIP_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripArchiveRef(suchtext: string): string {
  return suchtext.replace(ARCHIVE_REF_RE, '').replace(/\s+/g, ' ').trim()
}

/**
 * Split a raw "Agency / Photographer" string into structured parts.
 *   "IMAGO / teutopress"   → { agency: 'IMAGO', photographer: 'teutopress' }
 *   "dpa/Frank Rumpenhorst" → { agency: 'dpa', photographer: 'Frank Rumpenhorst' }
 *   "Solo Photographer"     → { agency: null, photographer: 'Solo Photographer' }
 *
 * Agencies are stored as a first-class entity so we can ingest non-IMAGO
 * sources without changing the schema. Photographers with the same name from
 * different agencies are different rows.
 */
export function parsePhotographer(raw: string): {
  agency: string | null
  photographer: string
} {
  const trimmed = raw.trim()
  const m = /^([^/]+?)\s*\/\s*(.+)$/.exec(trimmed)
  if (!m) return { agency: null, photographer: trimmed }
  return { agency: m[1].trim(), photographer: m[2].trim() }
}

/**
 * Full caption preprocessing pipeline applied at ingest time. The string this
 * returns is what gets stored in `images.suchtext` and pushed to Meilisearch.
 *
 * Stages:
 *   1. Strip rights/territory tags (parsed into structured fields separately)
 *   2. Strip internal archive references (no value as searchable text)
 *   3. Collapse whitespace introduced by the removals
 *
 * The original `suchtext` is *not* retained — territories live in their own
 * columns, archive refs are pure noise. If you ever need the raw form for
 * forensics, capture it before calling this function.
 */
export function normalizeSuchtext(raw: string): string {
  return stripArchiveRef(stripTerritoryTag(raw))
}

export function parseGermanDate(input: string): Date {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input.trim())
  if (!m) throw new Error(`Bad German date: ${input}`)
  const [, d, mo, y] = m
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))
  if (Number.isNaN(date.getTime())) throw new Error(`Bad German date: ${input}`)
  return date
}
