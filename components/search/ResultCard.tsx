import type { ImageHit } from '@/lib/search/types'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

export function ResultCard({ hit }: { hit: ImageHit }) {
  return (
    <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-xs text-zinc-500">{hit.bildnummer}</div>
        <div className="text-xs text-zinc-500">
          {dateFormatter.format(hit.datum)} · {hit.width}×{hit.height} · {hit.orientation}
        </div>
      </div>
      <div
        className="mt-2 text-sm"
        dangerouslySetInnerHTML={{
          __html: hit.highlight?.suchtext ?? hit.suchtext,
        }}
      />
      <div className="mt-2 text-xs text-zinc-500">
        {hit.fotografen}
        {hit.allowedTerritories?.length ? (
          <span className="ml-2">· only: {hit.allowedTerritories.join(', ')}</span>
        ) : null}
        {hit.deniedTerritories?.length ? (
          <span className="ml-2 text-red-600">
            · not: {hit.deniedTerritories.join(', ')}
          </span>
        ) : null}
      </div>
    </li>
  )
}
