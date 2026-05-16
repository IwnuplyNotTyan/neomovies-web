import { Star } from 'lucide-solid'
import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../data'
import './styles/PosterCard.css'

type PosterCardProps = {
  movie: ApiMovie
  autofocus?: boolean
  onFocus: (el: HTMLElement) => void
}

export function PosterCard(props: PosterCardProps) {
  const image = () => `${api.backdropPageUrl(props.movie.id, 1)}/medium`

  return (
    <button
      type="button"
      class="card focusable"
      data-autofocus={props.autofocus ? 'true' : undefined}
      onFocus={(e) => props.onFocus(e.currentTarget)}
    >
      <div class="card-media">
        <img class="card-image" src={image()} alt={props.movie.title} loading="lazy" />
        <div class="card-shine" />
      </div>

      <div class="card-info">
        <span class="card-title">{props.movie.title}</span>
        <span class="card-rating">
          <Star size={12} fill="currentColor" stroke-width={0} />
          {props.movie.rating > 0 ? props.movie.rating.toFixed(1) : '—'}
        </span>
      </div>
    </button>
  )
}
