import Link from 'next/link'
import { hrefWith, type RawSearchParams } from '@/lib/search/searchParams'
import type { SortMode } from '@/lib/search/types'
import { FacetLabel } from './shared'

const MODES: SortMode[] = ['relevance', 'newest', 'oldest']
const LABELS: Record<SortMode, string> = {
  relevance: 'Relevance',
  newest: 'Newest',
  oldest: 'Oldest',
}

export function SortPills({
  current,
  sp,
}: {
  current: SortMode
  sp: RawSearchParams
}) {
  return (
    <div>
      <FacetLabel>Sort</FacetLabel>
      <div className="mt-2 flex flex-wrap gap-1">
        {MODES.map((m) => {
          const active = current === m
          return (
            <Link
              key={m}
              href={hrefWith(sp, { sort: m === 'relevance' ? null : m, page: null })}
              className={
                'rounded-full px-3 py-1 text-xs ' +
                (active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700')
              }
            >
              {LABELS[m]}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
