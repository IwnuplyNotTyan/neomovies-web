import { Star } from 'lucide-solid'
import type { ApiMovie } from '@neomovies/api-client'
import { api, apiBaseUrl } from '../data'

type MediaCardProps = {
  movie: ApiMovie
  active?: boolean
  variant?: 'wide' | 'poster'
  imageSource?: 'poster' | 'backdrop'
}

export function MediaCard(props: MediaCardProps) {
  const absolute = (url: string) => (url.startsWith('http://') || url.startsWith('https://') ? url : `${apiBaseUrl}${url}`)
  const img = () => {
    if (props.imageSource === 'backdrop') return `${api.backdropPageUrl(props.movie.id, 1)}/medium`
    return props.movie.posterUrl?.trim().length
      ? absolute(props.movie.posterUrl)
      : `${api.backdropPageUrl(props.movie.id, 1)}/medium`
  }

  return (
    <article class={`tv-card ${props.variant === 'poster' ? 'tv-card-poster' : ''} ${props.active ? 'tv-card-active' : ''}`}>
      <img class="tv-card-image" src={img()} alt={props.movie.title} loading="lazy" />
      <div class="tv-card-light" />
      <div class="tv-card-depth" />
      <div class="tv-card-meta">
        <div class="tv-card-title">{props.movie.title}</div>
        <div class="tv-card-rating">
          <Star size={14} fill="currentColor" stroke-width={1.8} />
          <span>{props.movie.rating > 0 ? props.movie.rating.toFixed(1) : '—'}</span>
        </div>
      </div>
    </article>
  )
}
