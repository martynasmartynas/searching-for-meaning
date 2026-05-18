import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/db'
import { agencies, images, photographers } from '@/lib/db/schema'
import type { FakeRawImage } from '@/lib/fake/generateImage'
import {
  normalizeSuchtext,
  parseGermanDate,
  parsePhotographer,
  parseTerritories,
} from './parse'

async function upsertAgencies(names: string[]): Promise<Map<string, number>> {
  if (names.length === 0) return new Map()
  const rows = await db
    .insert(agencies)
    .values(names.map((name) => ({ name })))
    .onConflictDoUpdate({
      target: agencies.name,
      set: { name: sql`EXCLUDED.name` },
    })
    .returning({ id: agencies.id, name: agencies.name })
  return new Map(rows.map((r) => [r.name, r.id]))
}

const key = (agencyId: number | null, name: string) => `${agencyId ?? 'null'}|${name}`

async function upsertPhotographers(
  pairs: Array<{ agencyId: number | null; name: string }>,
): Promise<Map<string, number>> {
  if (pairs.length === 0) return new Map()
  const seen = new Set<string>()
  const unique = pairs.filter((p) => {
    const k = key(p.agencyId, p.name)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const rows = await db
    .insert(photographers)
    .values(unique)
    .onConflictDoUpdate({
      target: [photographers.agencyId, photographers.name],
      set: { name: sql`EXCLUDED.name` },
    })
    .returning({
      id: photographers.id,
      name: photographers.name,
      agencyId: photographers.agencyId,
    })

  return new Map(rows.map((r) => [key(r.agencyId, r.name), r.id]))
}

/**
 * Single ingest pipeline used by both the CLI seed script and the admin
 * Server Action. Upserts agencies → photographers → images, applies all
 * preprocessing (territory parsing, archive-ref stripping), and skips any
 * `bildnummer` that already exists.
 *
 * Returns the number of newly inserted image rows.
 */
export async function ingestRawImages(raws: FakeRawImage[]): Promise<number> {
  if (raws.length === 0) return 0

  const parsed = raws.map((r) => ({
    raw: r.fotografen,
    ...parsePhotographer(r.fotografen),
  }))

  const agencyNames = [
    ...new Set(parsed.map((p) => p.agency).filter((n): n is string => Boolean(n))),
  ]
  const agencyId = await upsertAgencies(agencyNames)

  const photographerId = await upsertPhotographers(
    parsed.map((p) => ({
      agencyId: p.agency ? agencyId.get(p.agency)! : null,
      name: p.photographer,
    })),
  )

  const lookupId = (raw: string) => {
    const p = parsePhotographer(raw)
    const aid = p.agency ? agencyId.get(p.agency)! : null
    return photographerId.get(key(aid, p.photographer))!
  }

  const seen = new Set<string>()
  const rows = raws
    .map((r) => {
      const t = parseTerritories(r.suchtext)
      return {
        bildnummer: r.bildnummer,
        suchtext: normalizeSuchtext(r.suchtext),
        photographerId: lookupId(r.fotografen),
        datum: parseGermanDate(r.datum),
        width: Number(r.breite),
        height: Number(r.hoehe),
        allowedTerritories: t.allowed ?? null,
        deniedTerritories: t.denied ?? null,
      }
    })
    .filter((row) => !seen.has(row.bildnummer) && seen.add(row.bildnummer))

  const result = await db
    .insert(images)
    .values(rows)
    .onConflictDoNothing({ target: images.bildnummer })
    .returning({ bildnummer: images.bildnummer })

  return result.length
}
