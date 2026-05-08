import { useEffect, useState } from 'react'
import type { Movie } from '../../types'
import { favoritesAPI, getImageUrl } from '../../api'

type Props = {
  movie: Movie
  onOpen?: (movie: Movie) => void
}

function getTitle(movie: Movie) {
  return movie.title || movie.name || movie.nameRu || movie.originalTitle || 'Untitled'
}

function getRating(movie: Movie) {
  const value = movie.rating ?? movie.vote_average ?? movie.ratingKinopoisk ?? 0
  return Number(value) || 0
}

function getMeta(movie: Movie) {
  const year = String(movie.year || movie.releaseDate || movie.release_date || movie.first_air_date || '').slice(0, 4)
  const kind = movie.type === 'tv' || movie.media_type === 'tv' ? 'Сериал' : 'Фильм'
  return [kind, year].filter(Boolean).join(' • ')
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 3.75l2.53 5.13 5.66.83-4.1 4 1 5.64L12 16.68l-5.09 2.67 1-5.64-4.1-4 5.66-.83L12 3.75z" />
    </svg>
  )
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 4.75h10a1.25 1.25 0 0 1 1.25 1.25v13.34a.4.4 0 0 1-.66.31L12 14.9l-5.59 4.75a.4.4 0 0 1-.66-.31V6A1.25 1.25 0 0 1 7 4.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

export function MoviePosterCard({ movie, onOpen }: Props) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const title = getTitle(movie)
  const rating = getRating(movie)
  const poster = getImageUrl(movie.poster_path || movie.posterUrlPreview || movie.posterUrl)
  const meta = getMeta(movie)
  const mediaType = movie.type === 'tv' || movie.media_type === 'tv' ? 'tv' : 'movie'
  const favoriteId = String(movie.kinopoisk_id || movie.id).replace(/^kp_/, '')

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('token')))
  }, [])

  useEffect(() => {
    const syncFavorite = () => {
      setIsFavorite(favoritesAPI.checkIsFavorite(favoriteId, mediaType))
    }

    syncFavorite()
    const unsubscribe = favoritesAPI.subscribe(() => {
      syncFavorite()
    })

    return () => unsubscribe()
  }, [favoriteId, mediaType])

  const handleFavoriteClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!isLoggedIn || !favoriteId || isUpdating) return

    try {
      setIsUpdating(true)
      if (isFavorite) {
        await favoritesAPI.removeFromFavorites(favoriteId, mediaType)
      } else {
        await favoritesAPI.addToFavorites(favoriteId, mediaType, {
          title,
          nameRu: title,
          nameEn: movie.original_title || movie.nameEn || '',
          posterPath: movie.poster_path || movie.posterUrlPreview || movie.posterUrl,
          year: Number(String(movie.year || movie.releaseDate || movie.release_date || movie.first_air_date || '').slice(0, 4)) || 0,
        })
      }
    } catch (error) {
      console.error('Error updating favorite:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <article
      className="poster-card group w-[232px] shrink-0 cursor-pointer overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] transition duration-200 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
      onClick={() => onOpen?.(movie)}
    >
      <div className="relative h-[334px] overflow-hidden rounded-b-[20px]">
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={!isLoggedIn || isUpdating}
          className={`bookmark-btn absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.14] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] backdrop-blur-md transition ${
            isFavorite ? 'border-[#d8d0a8]/45 bg-[#e7d9a5]/22 text-[#efe2b0]' : 'hover:bg-white/[0.2]'
          } ${!isLoggedIn ? 'opacity-60' : ''}`}
          aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          <BookmarkIcon active={isFavorite} />
        </button>
      </div>
      <div className="space-y-2 px-4 pb-4 pt-3">
        <h3 className="poster-card-title line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-zinc-100">
          {title}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <p className="poster-card-meta text-[13px] text-zinc-500">{meta}</p>
          {rating > 0 ? (
            <span className="poster-card-rating inline-flex shrink-0 items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-zinc-300">
              <StarIcon />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}
