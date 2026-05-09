import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../api/client'
import type { Movie } from '../../types'

type Props = {
  movies: Movie[]
}

type ImageUrlsByKpId = Record<string, string[]>

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
    return Array.from({ length: 4 }, (_, i) => `${API_BASE_URL}/api/v1/images/screens/${kpId}/1/${i + 1}/medium`)
  }
  return Array.from({ length: 4 }, (_, i) => `${API_BASE_URL}/api/v1/images/backdrops/${kpId}/medium`)
}

export function RecentlyViewedRow({ movies }: Props) {
  const navigate = useNavigate()
  const [imageUrls, setImageUrls] = useState<ImageUrlsByKpId>(() => loadImageCache())

  useEffect(() => {
    movies.forEach((movie) => {
      const kpId = getKpId(movie)
      if (!kpId || imageUrls[kpId]) return

      const urls = getImageUrls(movie, kpId)
      if (urls.length > 0) {
        const img = new Image()
        img.src = urls[0]
        img.onload = () => {
          setImageUrls((prev) => {
            const next = { ...prev, [kpId]: urls }
            saveImageCache(next)
            return next
          })
        }
        img.onerror = () => {
          // don't cache failed loads
        }
      }
    })
  }, [movies, imageUrls])

  if (movies.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="row-heading text-[30px] font-black tracking-[-0.04em] text-white">Недавно просмотренные</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((movie) => {
          const kpId = getKpId(movie)
          if (!kpId) return null
          const urls = imageUrls[kpId] || []
          
          return (
            <article
              key={kpId}
              className="recently-viewed-card group relative w-[380px] shrink-0 cursor-pointer overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] transition duration-200 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
              onClick={() => navigate(`/${kpId}`)}
            >
              <div className="relative h-[214px] overflow-hidden rounded-b-[18px]">
                {urls.length > 0 ? (
                  <img
                    src={urls[0]}
                    alt={movie.title || movie.nameRu || movie.nameEn || ''}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500">
                    Загрузка...
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent opacity-60" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="space-y-1 px-4 pb-4 pt-3">
                <h3 className="line-clamp-1 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-zinc-100">
                  {movie.title || movie.nameRu || movie.nameEn || 'Untitled'}
                </h3>
                <p className="text-[13px] text-zinc-500">
                  {String(movie.year || movie.releaseDate || movie.release_date || '').slice(0, 4)}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
