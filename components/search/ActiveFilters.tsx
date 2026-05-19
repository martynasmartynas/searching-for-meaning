import Link from 'next/link'
import { X } from 'lucide-react'
import {
  hrefWith,
  parseSearchParams,
  toggleArrayHref,
  type RawSearchParams,
} from '@/lib/search/searchParams'
import { FacetLabel } from './shared'

type Raw = ReturnType<typeof parseSearchParams>['raw']

export function ActiveFilters({ sp, raw }: { sp: RawSearchParams; raw: Raw }) {
  const chips: Array<{ key: string; label: string; clear: string }> = []

  if (raw.fromYear || raw.toYear) {
    chips.push({
      key: 'date',
      label: `${raw.fromYear ?? '…'}–${raw.toYear ?? '…'}`,
      clear: hrefWith(sp, { from: null, to: null, page: null }),
    })
  }
  raw.photographer?.forEach((v) =>
    chips.push({
      key: `p-${v}`,
      label: v,
      clear: toggleArrayHref(sp, 'photographer', v),
    }),
  )
  if (raw.orientation) {
    chips.push({
      key: 'orient',
      label: raw.orientation,
      clear: hrefWith(sp, { orient: null, page: null }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div>
      <FacetLabel>Active filters</FacetLabel>
      <ul className="mt-2 flex flex-wrap gap-1">
        {chips.map((c) => (
          <li key={c.key}>
            <Link
              href={c.clear}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {c.label}
              <X className="size-3" />
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/"
            className="rounded-full px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            clear all
          </Link>
        </li>
      </ul>
    </div>
  )
}
