import type { Movie } from '../../types'
import { MoviePosterCard } from '../shared/movie-card'

type ContinueItem = {
  id: string
  movie: Movie
  progress: number
  updatedAt: string
}

type Props = {
  profileReady: boolean
  items: ContinueItem[]
}

export function ContinueWatchingRow({ profileReady, items }: Props) {
  if (!profileReady || items.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="row-heading text-[30px] font-black tracking-[-0.04em] text-white">Продолжить просмотр</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <MoviePosterCard movie={item.movie} />
            <div className="w-[232px]">
              <div className="h-1.5 rounded-full bg-zinc-800">
                <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
