import type { RawSearchParams } from '@/lib/search/searchParams'

export function FacetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </div>
  )
}

/** Render hidden inputs for every searchParam except the given keys.
 *  Lets `<form method="get">` preserve other filters when submitting. */
export function PreservedInputs({
  sp,
  omit,
}: {
  sp: RawSearchParams
  omit: string[]
}) {
  return (
    <>
      {Object.entries(sp).flatMap(([k, v]) => {
        if (omit.includes(k) || v == null) return []
        const values = Array.isArray(v) ? v : [v]
        return values.map((val, i) => (
          <input key={`${k}-${i}`} type="hidden" name={k} value={val} />
        ))
      })}
    </>
  )
}
