import { Search } from 'lucide-react'
import type { RawSearchParams } from '@/lib/search/searchParams'
import { PreservedInputs } from './shared'

export function SearchForm({
  q,
  sp,
}: {
  q: string
  sp: RawSearchParams
}) {
  return (
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
      <PreservedInputs sp={sp} omit={['q', 'page']} />
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Go
      </button>
    </form>
  )
}
