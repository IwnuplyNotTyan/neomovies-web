import { Star } from 'lucide-solid'
import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../data'
import './styles/PosterCard.css'

type PosterCardProps = {
  movie: ApiMovie
  autofocus?: boolean
  onFocus: (movie: ApiMovie) => void
}

export function PosterCard(props: PosterCardProps) {
  const image = () => `${api.backdropPageUrl(props.movie.id, 1)}/medium`

  return (
    <button 
      type="button"
      class="card focusable"
      data-autofocus={props.autofocus ? 'true' : undefined}
      onFocus={(e) => {
        // Only scroll if needed, browser does this natively, but we ensure smooth center
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        props.onFocus(props.movie)
      }}
    >
      <img class="card-image" src={image()} alt={props.movie.title} loading="lazy" />
      <div class="card-gradient" />
      <div class="card-info">
        <div class="card-title">{props.movie.title}</div>
        <div class="card-rating">
          <Star size={14} fill="currentColor" stroke-width={2.5} />
          <span>{props.movie.rating > 0 ? props.movie.rating.toFixed(1) : '—'}</span>
        </div>
      </div>
    </button>
  )
}

