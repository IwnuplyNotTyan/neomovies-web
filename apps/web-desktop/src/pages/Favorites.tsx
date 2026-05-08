import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { favoritesAPI, type FavoriteItem } from '../api'
import type { Movie } from '../types'
import { MoviePosterCard } from '../features/shared/movie-card'

function toMovie(favorite: FavoriteItem): Movie {
  const rawId = String(favorite.mediaId || favorite.id || '')
  const kpNumericId = Number(rawId.replace(/^kp_/, ''))

  return {
    id: rawId || favorite.id,
    kinopoisk_id: Number.isFinite(kpNumericId) ? kpNumericId : undefined,
    title: favorite.title,
    name: favorite.title,
    nameRu: favorite.nameRu,
    nameEn: favorite.nameEn,
    poster_path: favorite.posterPath || favorite.posterUrl,
    posterUrl: favorite.posterUrl || favorite.posterPath,
    posterUrlPreview: favorite.posterUrl || favorite.posterPath,
    release_date: favorite.year ? `${favorite.year}-01-01` : '',
    first_air_date: favorite.year ? `${favorite.year}-01-01` : '',
    vote_average: favorite.rating,
    ratingKinopoisk: favorite.rating,
    type: favorite.mediaType,
    media_type: favorite.mediaType,
    year: favorite.year,
  }
}

export const Favorites = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('token')))
    }

    syncAuth()
    window.addEventListener('auth-changed', syncAuth)
    return () => window.removeEventListener('auth-changed', syncAuth)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([])
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        await favoritesAPI.initialize()
        const data = await favoritesAPI.getFavorites(true)
        if (!cancelled) {
          setFavorites(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    const unsubscribe = favoritesAPI.subscribe((items) => {
      if (!cancelled) {
        setFavorites(items)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isLoggedIn])

  const movies = useMemo(() => favorites.map(toMovie), [favorites])

  if (!isLoggedIn) {
    return (
      <section className="favorites-shell space-y-8">
        <header className="space-y-4 rounded-[30px] border border-white/8 bg-white/[0.02] px-6 py-6">
          <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            NeoMovies
          </span>
          <div className="space-y-2">
            <h1 className="text-[44px] font-black tracking-[-0.05em] text-white">Избранное</h1>
            <p className="max-w-2xl text-[15px] leading-7 text-zinc-500">
              Сохраняй фильмы и сериалы в личную коллекцию, чтобы быстро возвращаться к ним позже.
            </p>
          </div>
        </header>

        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-bold text-white">Нужен вход в аккаунт</h2>
            <p className="text-zinc-500">
              Избранное хранится в профиле NeoMovies. Войди в аккаунт, чтобы видеть сохранённые фильмы и сериалы на всех устройствах.
            </p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="rounded-full border border-white/10 bg-white text-sm font-medium text-[#07090d] px-5 py-3 transition hover:opacity-90"
            >
              Перейти ко входу
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="favorites-shell space-y-8">
      <header className="space-y-4 rounded-[30px] border border-white/8 bg-white/[0.02] px-6 py-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          NeoMovies
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[44px] font-black tracking-[-0.05em] text-white">Избранное</h1>
            <p className="max-w-3xl text-[15px] leading-7 text-zinc-500">
              Твоя персональная коллекция фильмов и сериалов. Снимаются из списка прямо через bookmark на карточке.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400">
            {favorites.length} в коллекции
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-[24px] border border-[#5f2b2b] bg-[#2b1313] px-5 py-4 text-sm text-[#f3b0b0]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
              <div className="aspect-[0.7] animate-pulse bg-white/[0.04]" />
              <div className="space-y-2 px-4 py-4">
                <div className="h-5 w-4/5 animate-pulse rounded-full bg-white/[0.04]" />
                <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-zinc-500">
          В избранном пока пусто. Добавляй фильмы и сериалы через bookmark на карточках.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {movies.map((movie) => (
            <MoviePosterCard
              key={String(movie.id)}
              movie={movie}
              onOpen={(item) => {
                const id = item.kinopoisk_id ? `kp_${item.kinopoisk_id}` : item.id
                navigate(`/${id}`)
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
