import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { favoritesAPI, getImageUrl, moviesAPI, playersAPI } from '../api'
import { TorrentSelector } from '../components/TorrentSelector'
import type { Movie } from '../types'

type PlayerKey = 'cdn' | 'alloha' | 'lumex' | 'collaps'

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M8.75 6.75v10.5L17 12 8.75 6.75Z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
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

function extractKpId(value: unknown): string {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value.replace(/^kp_/, '')
  return ''
}

function getTitle(movie: Movie) {
  return movie.title || movie.nameRu || movie.nameOriginal || movie.name || 'Unknown'
}

function getYear(movie: Movie) {
  if (movie.release_date) return new Date(movie.release_date).getFullYear()
  if (movie.first_air_date) return new Date(movie.first_air_date).getFullYear()
  return movie.year
}

function getRating(movie: Movie) {
  const value = movie.rating ?? movie.vote_average ?? movie.ratingKinopoisk ?? 0
  return Number(value) || 0
}

function getDescription(movie: Movie) {
  return movie.overview || movie.description || 'Описание недоступно'
}


function resolveMediaType(movie: Movie): 'movie' | 'tv' {
  if (movie.type === 'tv' || movie.media_type === 'tv') return 'tv'
  if (movie.type === 'movie' || movie.media_type === 'movie') return 'movie'
  if (movie.first_air_date && !movie.release_date) return 'tv'
  if (movie.name && !movie.title) return 'tv'
  return 'movie'
}

const PLAYER_LABELS: Record<PlayerKey, string> = {
  cdn: 'Плеер 1',
  alloha: 'Alloha',
  collaps: 'Collaps',
  lumex: 'Lumex',
}

export const MovieDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerKey>('cdn')
  const [playerUrl, setPlayerUrl] = useState<string | null>(null)
  const [playerHtml, setPlayerHtml] = useState<string | null>(null)
  const [cdnAvailable, setCdnAvailable] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [favoriteUpdating, setFavoriteUpdating] = useState(false)

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('token')))
  }, [])

  useEffect(() => {
    if (!movie) return

    const mediaType = resolveMediaType(movie)
    const favoriteId = extractKpId(movie.externalIds?.kp || movie.kinopoisk_id || movie.id)

    const syncFavorite = () => {
      setIsFavorite(favoritesAPI.checkIsFavorite(favoriteId, mediaType))
    }

    syncFavorite()
    const unsubscribe = favoritesAPI.subscribe(() => {
      syncFavorite()
    })

    return () => unsubscribe()
  }, [movie])

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const movieId = id.startsWith('kp_') ? id : `kp_${id}`
        const res = await moviesAPI.getMovieById(movieId)
        if (cancelled) return
        setMovie(res.data)
      } catch (error) {
        if (!cancelled) {
          setMovie(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!movie) return
    void loadPlayer(movie, 'cdn')
  }, [movie])

  const loadPlayer = async (movieData: Movie, player: PlayerKey) => {
    try {
      const kpId = movieData.externalIds?.kp || movieData.kinopoisk_id || movieData.filmId
      if (!kpId) return

      if (player === 'cdn') {
        const apiBase = import.meta.env.VITE_API_URL || ''
        const cdnUrl = `${apiBase}/api/v1/players/cdn/kp/${kpId}`
        try {
          const check = await fetch(cdnUrl)
          const ct = check.headers.get('content-type') || ''
          if (!check.ok || ct.includes('application/json')) {
            setCdnAvailable(false)
            setSelectedPlayer('alloha')
            void loadPlayer(movieData, 'alloha')
            return
          }
        } catch {
          setCdnAvailable(false)
          setSelectedPlayer('alloha')
          void loadPlayer(movieData, 'alloha')
          return
        }
        setCdnAvailable(true)
        setSelectedPlayer('cdn')
        setPlayerUrl(cdnUrl)
        setPlayerHtml(null)
        return
      }

      let response = ''
      if (player === 'alloha') {
        const res = await playersAPI.getAllohaPlayer('kp', kpId)
        response = res.data
      } else if (player === 'lumex') {
        const res = await playersAPI.getLumexPlayer('kp', kpId)
        response = res.data
      } else if (player === 'collaps') {
        const res = await playersAPI.getCollapsPlayer('kp', kpId)
        response = res.data
      }

      setSelectedPlayer(player)

      if (response.startsWith('<')) {
        const srcMatch = response.match(/src="([^"]+)"/i)
        if (srcMatch?.[1]) {
          setPlayerUrl(srcMatch[1])
          setPlayerHtml(null)
        } else {
          const dataSrcMatch = response.match(/data-src="([^"]+)"/i)
          if (dataSrcMatch?.[1]) {
            setPlayerUrl(dataSrcMatch[1])
            setPlayerHtml(null)
          } else {
            setPlayerHtml(response)
            setPlayerUrl(null)
          }
        }
      } else if (response.trim()) {
        setPlayerUrl(response)
        setPlayerHtml(null)
      }
    } catch {
      // keep silent, same as previous behavior
    }
  }

  const handleFavoriteClick = async () => {
    if (!isLoggedIn || !movie || favoriteUpdating) return

    try {
      setFavoriteUpdating(true)
      const mediaType = resolveMediaType(movie)
      const movieId = extractKpId(movie.externalIds?.kp || movie.kinopoisk_id || movie.id)
      if (!movieId) return

      if (isFavorite) {
        await favoritesAPI.removeFromFavorites(movieId, mediaType)
      } else {
        const title = getTitle(movie)
        const posterPath = movie.poster_path || movie.posterUrlPreview || movie.posterUrl
        const year = Number(getYear(movie)) || 0
        await favoritesAPI.addToFavorites(movieId, mediaType, {
          title,
          nameRu: title,
          nameEn: movie.original_title || movie.originalTitle || movie.nameEn || '',
          posterPath,
          year,
          rating: getRating(movie),
        })
      }
    } finally {
      setFavoriteUpdating(false)
    }
  }

  const title = useMemo(() => (movie ? getTitle(movie) : ''), [movie])
  const rating = useMemo(() => (movie ? getRating(movie) : 0), [movie])
  const year = useMemo(() => (movie ? getYear(movie) : ''), [movie])
  const description = useMemo(() => (movie ? getDescription(movie) : ''), [movie])
  const posterPath = movie ? getImageUrl(movie.poster_path || movie.posterUrlPreview || movie.posterUrl) : ''
  const genres = movie?.genres || []
  const isTv = movie ? resolveMediaType(movie) === 'tv' : false

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-zinc-500">
        Загрузка...
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-zinc-500">
        Контент не найден
      </div>
    )
  }

  return (
    <section className="movie-details-shell space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-4 self-start">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Назад"
          >
            <ArrowLeftIcon />
          </button>

          <div className="overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.03]">
            <img
              src={posterPath}
              alt={title}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
        </div>

        <div className="details-panel space-y-6 rounded-[30px] border border-white/8 bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[760px] space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="details-badge inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {isTv ? 'Сериал' : 'Фильм'}
                </span>
                {rating > 0 ? (
                  <span className="details-badge inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[13px] font-medium text-zinc-300">
                    <StarIcon />
                    {rating.toFixed(1)}
                  </span>
                ) : null}
                {year ? <span className="text-sm text-zinc-500">{year}</span> : null}
              </div>

              <div className="space-y-3">
                <h1 className="details-title text-[40px] font-black leading-[0.96] tracking-[-0.05em] text-white xl:text-[44px]">
                  {title}
                </h1>
                <p className="details-desc max-w-[720px] text-[15px] leading-8 text-zinc-400">
                  {description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={!isLoggedIn || favoriteUpdating}
              className={`details-bookmark-btn grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-white/[0.08] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] backdrop-blur-md transition ${
                isFavorite ? 'border-[#d8d0a8]/45 bg-[#e7d9a5]/22 text-[#efe2b0]' : 'hover:bg-white/[0.12]'
              } ${!isLoggedIn ? 'opacity-60' : ''}`}
              aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <BookmarkIcon active={isFavorite} />
            </button>
          </div>

          {genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span
                  key={genre.id}
                  className="details-genre rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="details-player-section space-y-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="details-section-title text-lg font-bold text-white">Смотреть онлайн</div>
                <p className="text-sm text-zinc-500">Выбери источник плеера или открой список торрентов.</p>
              </div>
              <TorrentSelector
                kpId={movie.externalIds?.kp || movie.kinopoisk_id || movie.id}
                type={isTv ? 'tv' : 'movie'}
                title={title}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(cdnAvailable ? (['cdn', 'alloha', 'collaps', 'lumex'] as PlayerKey[]) : (['alloha', 'collaps', 'lumex'] as PlayerKey[])).map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => void loadPlayer(movie, player)}
                  className={`player-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedPlayer === player
                      ? 'bg-white text-[#07090d]'
                      : 'border border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/12 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <PlayIcon />
                  {PLAYER_LABELS[player]}
                </button>
              ))}
            </div>

            {playerUrl && !playerUrl.includes('blob:') ? (
              <div className="overflow-hidden rounded-[24px] border border-white/8 bg-black">
                <iframe
                  src={playerUrl}
                  allowFullScreen
                  className="block h-[320px] w-full md:h-[420px] xl:h-[560px]"
                />
              </div>
            ) : null}

            {playerHtml ? (
              <div className="overflow-hidden rounded-[24px] border border-white/8 bg-black">
                <iframe
                  srcDoc={playerHtml}
                  allowFullScreen
                  className="block h-[320px] w-full md:h-[420px] xl:h-[560px]"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
