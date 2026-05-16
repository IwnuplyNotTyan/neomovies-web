import { Star } from 'lucide-react'
import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../api'
import './PosterCard.css'

type PosterCardProps = {
  movie: ApiMovie
  focusKey: string
  cardIndex: number
  onEnterView: (element: HTMLButtonElement) => void
  onFocused: (movie: ApiMovie) => void
  onSidebarHiddenChange?: (hidden: boolean) => void
  onContentFocus?: (focusKey: string) => void
  onArrowMove?: (direction: string) => void
}

export function PosterCard({ movie, focusKey, cardIndex, onEnterView, onFocused, onSidebarHiddenChange, onContentFocus, onArrowMove }: PosterCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: () => {
      // details.node is undefined in norigin v3 — use ref.current directly
      if (ref.current) onEnterView(ref.current as HTMLButtonElement)
      onContentFocus?.(focusKey)
      onFocused(movie)
    },
    onArrowPress: (direction) => {
      if (direction !== 'left' || cardIndex !== 0) {
        onArrowMove?.(direction)
        return true
      }

      onSidebarHiddenChange?.(false)
      requestAnimationFrame(() => {
        setFocus('sidebar-home')
      })

      return false
    },
  })

  return (
    <button ref={ref} type="button" className={`card ${focused ? 'is-focused' : ''}`}>
      <div className="card-media">
        <img className="card-image" src={`${api.backdropPageUrl(movie.id, 1)}/medium`} alt={movie.title} loading="lazy" />
        <div className="card-shine" />
        <div className="card-overlay">
          <span className="card-title">{movie.title}</span>
          <span className="card-rating-pill">
            <Star size={12} fill="currentColor" strokeWidth={0} />
            {movie.rating > 0 ? movie.rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </button>
  )
}
