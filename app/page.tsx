import { Search } from 'lucide-react'
import { imageSearch } from '@/lib/search'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

type RawSearchParams = Promise<{ q?: string }>

export default async function HomePage({ searchParams }: { searchParams: RawSearchParams }) {
  const { q = '' } = await searchParams
  const results = q ? await imageSearch.search({ query: q, perPage: 20 }) : null

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form action="/" method="get" className="mt-6 flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search images…"
            autoFocus
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go
        </button>
      </form>

      {results && (
        <p className="mt-4 text-sm text-zinc-500">
          {results.total.toLocaleString()} result{results.total === 1 ? '' : 's'} · {results.tookMs}ms
        </p>
      )}

      {results && results.hits.length === 0 && (
        <p className="mt-12 text-center text-sm text-zinc-500">No matches.</p>
      )}

      <ul className="mt-6 space-y-3">
        {results?.hits.map((hit) => (
          <li
            key={hit.bildnummer}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-mono text-xs text-zinc-500">{hit.bildnummer}</div>
              <div className="text-xs text-zinc-500">
                {dateFormatter.format(hit.datum)} · {hit.width}×{hit.height}
              </div>
            </div>
            <div
              className="mt-2 text-sm"
              dangerouslySetInnerHTML={{
                __html: hit.highlight?.suchtext ?? hit.suchtext,
              }}
            />
            <div className="mt-2 text-xs text-zinc-500">
              {hit.agency ? `${hit.agency} / ` : ''}
              {hit.fotografen}
              {hit.allowedTerritories?.length ? (
                <span className="ml-2">· only: {hit.allowedTerritories.join(', ')}</span>
              ) : null}
              {hit.deniedTerritories?.length ? (
                <span className="ml-2 text-red-600">· not: {hit.deniedTerritories.join(', ')}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
