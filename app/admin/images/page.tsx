import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/db'
import { agencies, images, photographers } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' })

export default async function ImagesPage() {
  const rows = await db
    .select({
      bildnummer: images.bildnummer,
      suchtext: images.suchtext,
      fotografen: photographers.name,
      agency: agencies.name,
      datum: images.datum,
      width: images.width,
      height: images.height,
      allowed: images.allowedTerritories,
      denied: images.deniedTerritories,
      createdAt: images.createdAt,
    })
    .from(images)
    .innerJoin(photographers, eq(images.photographerId, photographers.id))
    .leftJoin(agencies, eq(photographers.agencyId, agencies.id))
    .orderBy(desc(images.createdAt))
    .limit(50)

  const total = await db.$count(images)

  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Images</h1>
        <span className="text-sm text-zinc-500">
          {total.toLocaleString()} total · showing latest {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          No images yet. Generate some on the{' '}
          <a href="/admin/seed" className="underline">Seed</a> page.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Bildnummer</th>
                <th className="px-3 py-2">Caption</th>
                <th className="px-3 py-2">Agency</th>
                <th className="px-3 py-2">Photographer</th>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Rights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((r) => (
                <tr key={r.bildnummer}>
                  <td className="px-3 py-2 font-mono text-xs">{r.bildnummer}</td>
                  <td className="max-w-md truncate px-3 py-2" title={r.suchtext}>{r.suchtext}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{r.agency ?? '—'}</td>
                  <td className="px-3 py-2">{r.fotografen}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{dateFormatter.format(r.datum)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-zinc-500">{r.width}×{r.height}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.allowed?.length ? <span>only: {r.allowed.join(', ')}</span> : null}
                    {r.denied?.length  ? <span className="text-red-600">not: {r.denied.join(', ')}</span> : null}
                    {!r.allowed?.length && !r.denied?.length ? <span className="text-zinc-400">—</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
