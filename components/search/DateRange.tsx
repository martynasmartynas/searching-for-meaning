import type { RawSearchParams } from '@/lib/search/searchParams'
import { FacetLabel, PreservedInputs } from './shared'

export function DateRange({
  fromYear,
  toYear,
  sp,
}: {
  fromYear?: number
  toYear?: number
  sp: RawSearchParams
}) {
  return (
    <form action="/" method="get">
      <FacetLabel>Year</FacetLabel>
      <div className="mt-2 flex items-center gap-1 text-sm">
        <input
          name="from"
          type="number"
          min={1900}
          max={2100}
          defaultValue={fromYear ?? ''}
          placeholder="from"
          className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="text-xs text-zinc-400">–</span>
        <input
          name="to"
          type="number"
          min={1900}
          max={2100}
          defaultValue={toYear ?? ''}
          placeholder="to"
          className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <PreservedInputs sp={sp} omit={['from', 'to', 'page']} />
      <button
        type="submit"
        className="mt-2 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Apply
      </button>
    </form>
  )
}
