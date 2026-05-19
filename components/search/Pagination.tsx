import Link from 'next/link'
import { hrefWith, type RawSearchParams } from '@/lib/search/searchParams'

export function Pagination({
  page,
  totalPages,
  sp,
}: {
  page: number
  totalPages: number
  sp: RawSearchParams
}) {
  if (totalPages <= 1) return null
  const window = paginationWindow(page, totalPages)
  return (
    <nav className="mt-8 flex items-center justify-center gap-1 text-sm">
      <PageLink sp={sp} page={page - 1} disabled={page <= 1}>
        ‹ prev
      </PageLink>
      {window.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-zinc-400">…</span>
        ) : (
          <PageLink key={p} sp={sp} page={p} active={p === page}>
            {p}
          </PageLink>
        ),
      )}
      <PageLink sp={sp} page={page + 1} disabled={page >= totalPages}>
        next ›
      </PageLink>
    </nav>
  )
}

function PageLink({
  sp,
  page,
  disabled,
  active,
  children,
}: {
  sp: RawSearchParams
  page: number
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className="rounded px-2 py-1 text-zinc-300 dark:text-zinc-700">
        {children}
      </span>
    )
  }
  return (
    <Link
      href={hrefWith(sp, { page: page === 1 ? null : page })}
      className={
        'rounded px-2 py-1 ' +
        (active
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800')
      }
    >
      {children}
    </Link>
  )
}

function paginationWindow(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: Array<number | '…'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
}
