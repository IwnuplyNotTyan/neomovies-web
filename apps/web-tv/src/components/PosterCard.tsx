import { useState } from 'react'
import Star from 'lucide-react/dist/esm/icons/star.js'
import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ApiMovie } from '@neomovies/api-client'
import { getBackdropPageImageUrl, getPosterImageUrl } from '../imageUrl'
import './PosterCard.css'

type PosterCardProps = {
  movie: ApiMovie
  focusKey: string
  cardIndex: number
  variant?: 'default' | 'search'
  onEnterView: (element: HTMLButtonElement) => void
  onFocused: (movie: ApiMovie) => void
  onSidebarHiddenChange?: (hidden: boolean) => void
  onContentFocus?: (focusKey: string) => void
  onArrowMove?: (direction: string) => void
  onArrowPress?: (direction: string) => boolean
  onEnterPress?: (movie: ApiMovie, focusKey: string) => void
}

export function PosterCard({ movie, focusKey, cardIndex, variant = 'default', onEnterView, onFocused, onSidebarHiddenChange, onContentFocus, onArrowMove, onArrowPress, onEnterPress }: PosterCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const fallbackSrc = getPosterImageUrl(movie.posterUrl)
  const backdropSrc = getBackdropPageImageUrl(movie.id, 'small')
  const primarySrc = variant === 'search' ? fallbackSrc : backdropSrc
  const [imageSrc, setImageSrc] = useState(primarySrc)

  const handleFocus = () => {
    if (ref.current) onEnterView(ref.current as HTMLButtonElement)
    onContentFocus?.(focusKey)
    onFocused(movie)
  }

  const handleArrowPress = (direction: string) => {
    const handled = onArrowPress?.(direction)
    if (handled === false) return false

    if (onArrowPress) {
      if (direction === 'left' || direction === 'right') {
        onArrowMove?.(direction)
      }
      return handled ?? true
    }

    if (direction !== 'left' || cardIndex !== 0) {
      onArrowMove?.(direction)
      return true
    }

    onSidebarHiddenChange?.(false)
    requestAnimationFrame(() => {
      setFocus('sidebar-home')
    })

    return false
  }

  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: handleFocus,
    onArrowPress: handleArrowPress,
    onEnterPress: () => onEnterPress?.(movie, focusKey),
  })

  const handleImageError = () => {
    if (!fallbackSrc || imageSrc === fallbackSrc) return
    setImageLoaded(false)
    setImageSrc(fallbackSrc)
  }

  return (
    <button ref={ref} type="button" data-focus-key={focusKey} className={`card card-${variant} ${focused ? 'is-focused' : ''}`}>
      <div className="card-media">
        <img
          className={`card-image ${imageLoaded ? 'is-loaded' : ''}`}
          src={imageSrc}
          alt={movie.title}
          width={320}
          height={180}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
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
