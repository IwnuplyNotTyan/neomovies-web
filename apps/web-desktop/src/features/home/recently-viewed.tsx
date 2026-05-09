import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../api/client'
import { favoritesAPI } from '../../api/favorites'
import type { Movie } from '../../types'

type Props = {
  movies: Movie[]
}

type ImageUrlsByKpId = Record<string, { urls: string[]; state: ImageLoadState }>

const IMAGE_CACHE_KEY = 'neo_recently_viewed_images_v1'

function loadImageCache(): ImageUrlsByKpId {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveImageCache(cache: ImageUrlsByKpId): void {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // silent fail
  }
}

function getOrFallbackUrl(kpId: string, urls: string[], state: ImageLoadState): string {
  if (state === 'error' || urls.length === 0) {
  }
  return urls[0]
}

function getKpId(movie: Movie): string | null {
  if (movie.kinopoisk_id) return String(movie.kinopoisk_id)
  const idStr = String(movie.id)
  return idStr.replace(/^kp_/, '') || null
}

function isTvShow(movie: Movie): boolean {
  return movie.type === 'tv' || movie.media_type === 'tv' || (!movie.type && !movie.media_type && movie.first_air_date && !movie.release_date)
}

function getImageUrls(movie: Movie, kpId: string): string[] {
  if (isTvShow(movie)) {
    return [
      `${API_BASE_URL}/api/v1/images/backdrops/page/${kpId}/medium`,
      `${API_BASE_URL}/api/v1/images/screens/${kpId}/1/1/medium`,
    ]
  }
  return [
    `${API_BASE_URL}/api/v1/images/backdrops/page/${kpId}/medium`,
    `${API_BASE_URL}/api/v1/images/backdrops/${kpId}/medium`,
    `${API_BASE_URL}/api/v1/images/kp/${kpId}`,
    `${API_BASE_URL}/api/v1/images/kp_small/${kpId}`
  ]
}

type ImageLoadState = 'loading' | 'loaded' | 'error'

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 18l6-6-6-6" />
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

export function RecentlyViewedRow({ movies }: Props) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [imageUrls, setImageUrls] = useState<ImageUrlsByKpId>(() => loadImageCache())
  const imageUrlsRef = useRef(imageUrls)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set())

  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('token')), [])

  useEffect(() => {
    movies.forEach((movie) => {
      const kpId = getKpId(movie)
      if (!kpId) return

      const existing = imageUrlsRef.current[kpId]
      if (existing?.state === 'loaded' || existing?.state === 'loading') return

      const tryLoadWithFallback = (urls: string[], index: number = 0) => {
        if (index >= urls.length) {
          setImageUrls((prev) => {
            const next = { ...prev, [kpId]: { urls: [], state: 'error' } }
            imageUrlsRef.current = next
            saveImageCache(next)
            return next
          })
          return
        }

        const currentUrl = urls[index]
        setImageUrls((prev) => {
          imageUrlsRef.current = prev
          return { ...prev, [kpId]: { urls: [currentUrl], state: 'loading' } }
        })

        const img = new Image()
        img.src = currentUrl
        img.onload = () => {
          setImageUrls((prev) => {
            const next = { ...prev, [kpId]: { urls: [currentUrl], state: 'loaded' } }
            imageUrlsRef.current = next
            saveImageCache(next)
            return next
          })
        }
        img.onerror = () => {
          tryLoadWithFallback(urls, index + 1)
        }
      }

      const urls = getImageUrls(movie, kpId)
      if (urls.length > 0) {
        tryLoadWithFallback(urls)
      }
    })
  }, [movies])

  useEffect(() => {
    movies.forEach((movie) => {
      const kpId = getKpId(movie)
      if (!kpId) return
      const mediaType = isTvShow(movie) ? 'tv' : 'movie'
      const isFav = favoritesAPI.checkIsFavorite(kpId, mediaType)
      setFavorites((prev) => {
        const next = new Set(prev)
        if (isFav) next.add(kpId)
        else next.delete(kpId)
        return next
      })
    })
    const unsubscribe = favoritesAPI.subscribe(() => {
      movies.forEach((movie) => {
        const kpId = getKpId(movie)
        if (!kpId) return
        const mediaType = isTvShow(movie) ? 'tv' : 'movie'
        const isFav = favoritesAPI.checkIsFavorite(kpId, mediaType)
        setFavorites((prev) => {
          const next = new Set(prev)
          if (isFav) next.add(kpId)
          else next.delete(kpId)
          return next
        })
      })
    })
    return () => unsubscribe()
  }, [movies])

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const step = Math.max(760, Math.floor(el.clientWidth * 0.72))
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' })
    window.setTimeout(updateScrollState, 250)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [movies.length])

  const handleFavoriteClick = async (event: React.MouseEvent, movie: Movie) => {
    event.stopPropagation()
    const kpId = getKpId(movie)
    if (!kpId || !isLoggedIn) return

    const key = `${kpId}-${isTvShow(movie) ? 'tv' : 'movie'}`
    if (updatingIds.has(key)) return

    setUpdatingIds((prev) => new Set(prev).add(key))

    try {
      const mediaType = isTvShow(movie) ? 'tv' : 'movie'
      const isFav = favoritesAPI.checkIsFavorite(kpId, mediaType)
      if (isFav) {
        await favoritesAPI.removeFromFavorites(kpId, mediaType)
      } else {
        const title = movie.title || movie.nameRu || movie.nameEn || 'Untitled'
        const year = Number(String(movie.year || movie.releaseDate || movie.release_date || movie.first_air_date || '').slice(0, 4)) || 0
        await favoritesAPI.addToFavorites(kpId, mediaType, {
          title,
          nameRu: title,
          nameEn: movie.original_title || movie.nameEn || '',
          posterPath: movie.poster_path || movie.posterUrlPreview || movie.posterUrl,
          year,
          rating: movie.rating ?? movie.vote_average ?? movie.ratingKinopoisk ?? 0,
        })
      }
    } catch (error) {
      console.error('Error updating favorite:', error)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  if (movies.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="row-heading text-[30px] font-black tracking-[-0.04em] text-white">Недавно просмотренные</h2>
        <div className="row-controls flex items-center gap-3 rounded-full border border-white/[0.07] bg-[linear-gradient(180deg,rgba(22,26,35,0.42),rgba(12,15,22,0.32))] p-1.5 pl-3 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-sm ring-1 ring-white/[0.025]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="row-scroll-btn grid h-10 w-10 place-items-center rounded-full border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-400 transition hover:border-white/[0.1] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:text-zinc-200 disabled:border-white/[0.04] disabled:bg-transparent disabled:text-zinc-700 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="row-scroll-btn grid h-10 w-10 place-items-center rounded-full border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-400 transition hover:border-white/[0.1] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:text-zinc-200 disabled:border-white/[0.04] disabled:bg-transparent disabled:text-zinc-700 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {movies.map((movie) => {
          const kpId = getKpId(movie)
          if (!kpId) return null
          const imageData = imageUrls[kpId]
          const urls = imageData?.urls || []
          const loadState = imageData?.state || 'loading'
          const imageUrl = getOrFallbackUrl(kpId, urls, loadState)
          const isTv = isTvShow(movie)
          const key = `${kpId}-${isTv ? 'tv' : 'movie'}`
          const isFavorite = favorites.has(kpId)
          const isUpdating = updatingIds.has(key)
          
          return (
            <article
              key={kpId}
              className="recently-viewed-card group relative w-[380px] shrink-0 cursor-pointer overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] transition duration-200 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
              onClick={() => navigate(`/${kpId}`)}
            >
              <div className="relative h-[214px] overflow-hidden rounded-b-[18px]">
                <img
                  src={imageUrl}
                  alt={movie.title || movie.nameRu || movie.nameEn || ''}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                <button
                  type="button"
                  onClick={(e) => handleFavoriteClick(e, movie)}
                  disabled={!isLoggedIn || isUpdating}
                  className={`bookmark-btn absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.14] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] backdrop-blur-md transition ${
                    isFavorite ? 'border-[#d8d0a8]/45 bg-[#e7d9a5]/22 text-[#efe2b0]' : 'hover:bg-white/[0.2]'
                  } ${!isLoggedIn ? 'opacity-60' : ''}`}
                  aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                  <BookmarkIcon active={isFavorite} />
                </button>
              </div>
              <div className="space-y-1 px-4 pb-4 pt-3">
                <h3 className="line-clamp-1 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-zinc-100">
                  {movie.title || movie.nameRu || movie.nameEn || 'Untitled'}
                </h3>
                <p className="text-[13px] text-zinc-500">
                  {isTv ? 'Сериал' : 'Фильм'} • {String(movie.year || movie.releaseDate || movie.release_date || '').slice(0, 4)}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
