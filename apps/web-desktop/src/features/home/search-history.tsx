import { Button } from '@neomovies/ui'

export type SearchHistoryProps = {
  items: string[]
  onPick: (value: string) => void
  onClear: () => void
}

export function SearchHistory({ items, onPick, onClear }: SearchHistoryProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Недавние поиски</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>Очистить</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  )
}
