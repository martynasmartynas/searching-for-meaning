import Link from 'next/link'
import {
  hrefWith,
  toggleArrayHref,
  type RawSearchParams,
} from '@/lib/search/searchParams'
import type { FacetBucket } from '@/lib/search/types'
import { FacetLabel } from './shared'

export function FacetGroup({
  label,
  paramKey,
  buckets,
  selected,
  single,
  sp,
}: {
  label: string
  paramKey: string
  buckets: FacetBucket[] | undefined
  selected: string[] | undefined
  /** Single-select facets (e.g. orientation). Clicking the active value clears it. */
  single?: boolean
  sp: RawSearchParams
}) {
  if (!buckets?.length) return null
  const top = buckets.slice(0, 10)
  return (
    <div>
      <FacetLabel>{label}</FacetLabel>
      <ul className="mt-2 space-y-1">
        {top.map((b) => {
          const isSelected = selected?.includes(b.value) ?? false
          const href = single
            ? hrefWith(sp, { [paramKey]: isSelected ? null : b.value, page: null })
            : toggleArrayHref(sp, paramKey, b.value)
          return (
            <li key={b.value}>
              <Link
                href={href}
                className={
                  'flex items-center justify-between gap-2 rounded px-1 py-0.5 text-xs transition-colors ' +
                  (isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800')
                }
              >
                <span className="truncate" title={b.value}>{b.value}</span>
                <span className={isSelected ? 'opacity-80' : 'text-zinc-400'}>
                  {b.count}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
