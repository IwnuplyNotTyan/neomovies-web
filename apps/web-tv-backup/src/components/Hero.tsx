import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../api'
import './Hero.css'

type HeroProps = {
  movie: ApiMovie | null
}

export function Hero({ movie }: HeroProps) {
  if (!movie) {
    return <div className="hero hero-empty" />
  }

  return (
    <div className="hero">
      <img
        className="hero-logo"
        src={`${api.logoUrl(movie.id)}?size=small&format=webp&quality=80`}
        alt={movie.title}
      />
      <div className="hero-desc">{movie.description}</div>
    </div>
  )
}
