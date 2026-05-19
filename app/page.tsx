import { redirect } from 'next/navigation'
import { imageSearch } from '@/lib/search'
import {
  MAX_RESULTS,
  canonicalUrlIfDifferent,
  parseSearchParams,
  type RawSearchParams,
} from '@/lib/search/searchParams'

import { ActiveFilters } from '@/components/search/ActiveFilters'
import { DateRange } from '@/components/search/DateRange'
import { FacetGroup } from '@/components/search/FacetGroup'
import { Pagination } from '@/components/search/Pagination'
import { ResultCard } from '@/components/search/ResultCard'
import { SearchForm } from '@/components/search/SearchForm'
import { SortPills } from '@/components/search/SortPills'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<RawSearchParams> }

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams

  // Redirect to a clean URL if the incoming one has unknown keys, invalid
  // enum values, or redundant defaults.
  const canonical = canonicalUrlIfDifferent(sp)
  if (canonical) redirect(canonical)

  const { request, pageWasCapped, raw } = parseSearchParams(sp)

  const hasInput = !!raw.q || !!request.filters
  const results = await imageSearch.search(request)

  // Cap pagination at MAX_RESULTS so we never link to pages we'd silently
  // clamp on click. Also show the cap notice whenever the total exceeds the
  // cap — not only when the URL itself overshot.
  const maxPages = Math.max(1, Math.floor(MAX_RESULTS / results.perPage))
  const cappedTotalPages = Math.min(results.totalPages, maxPages)
  const showCapNotice = pageWasCapped || results.total > MAX_RESULTS

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <SearchForm q={raw.q} sp={sp} />

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <SortPills current={raw.sort} sp={sp} />
          <DateRange fromYear={raw.fromYear} toYear={raw.toYear} sp={sp} />

          <FacetGroup
            label="Photographer"
            paramKey="photographer"
            buckets={results.facets?.fotografen}
            selected={raw.photographer}
            sp={sp}
          />
          <FacetGroup
            label="Orientation"
            paramKey="orient"
            buckets={results.facets?.orientation}
            selected={raw.orientation ? [raw.orientation] : undefined}
            single
            sp={sp}
          />

          <ActiveFilters sp={sp} raw={raw} />
        </aside>

        <section>
          {hasInput && (
            <p className="text-sm text-zinc-500">
              {results.total.toLocaleString()} result{results.total === 1 ? '' : 's'}
              {' · '}
              {results.tookMs}ms
            </p>
          )}

          {showCapNotice && (
            <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Showing the first {MAX_RESULTS.toLocaleString()} results. Refine your search to see more.
            </p>
          )}

          {results.hits.length === 0 ? (
            <p className="mt-16 text-center text-sm text-zinc-500">
              {hasInput
                ? 'No matches. Try removing a filter.'
                : 'Start typing or pick a filter.'}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {results.hits.map((hit) => (
                <ResultCard key={hit.bildnummer} hit={hit} />
              ))}
            </ul>
          )}

          <Pagination
            page={results.page}
            totalPages={cappedTotalPages}
            sp={sp}
          />
        </section>
      </div>
    </main>
  )
}
