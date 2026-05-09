import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { moviesAPI, tvAPI } from '../api'
import { recentlyViewedCache } from '../api/recentlyViewedCache'
import type { Movie } from '../types'
import { MoviePosterCard } from '../features/shared/movie-card'
import { ContinueWatchingRow } from '../features/home/continue-watching'
import { RecentlyViewedRow } from '../features/home/recently-viewed'

type ContinueItem = { id: string; movie: Movie; progress: number; updatedAt: string }

const CONTINUE_KEY = 'neo_continue_watching_v1'
const POPULAR_KEY = 'neo_home_popular_v1'
const TOP_MOVIES_KEY = 'neo_home_top_movies_v1'
const TOP_SERIES_KEY = 'neo_home_top_series_v1'

function parseStoredContinue(): ContinueItem[] {
  try { return JSON.parse(localStorage.getItem(CONTINUE_KEY) || '[]') }
  catch { return [] }
}

function readMovieCache(key: string): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as Movie[]
  } catch {
    return []
  }
}

function writeMovieCache(key: string, value: Movie[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota/storage errors for non-critical home caches.
  }
}

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

function MovieRow({
  title, movies, loading, onSeeAll,
}: { title: string; movies: Movie[]; loading: boolean; onSeeAll?: () => void }) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const step = Math.max(720, Math.floor(el.clientWidth * 0.72))
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' })
    window.setTimeout(updateScrollState, 250)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY * 2.5, behavior: 'smooth' })
      window.setTimeout(updateScrollState, 50)
    }
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [movies.length])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="row-heading text-[30px] font-black tracking-[-0.04em] text-white">{title}</h2>
        <div className="row-controls flex items-center gap-3 rounded-full border border-white/[0.07] bg-[linear-gradient(180deg,rgba(22,26,35,0.42),rgba(12,15,22,0.32))] p-1.5 pl-3 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-sm ring-1 ring-white/[0.025]">
          {onSeeAll ? (
            <button
              onClick={onSeeAll}
              className="row-see-all text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
            >
              Все
            </button>
          ) : null}
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
      {loading ? (
        <div className="text-sm text-zinc-600">Загрузка...</div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie) => (
            <MoviePosterCard
              key={String(movie.id)}
              movie={movie}
              onOpen={(m) => {
                const id = m.kinopoisk_id ? `kp_${m.kinopoisk_id}` : m.id
                navigate(`/${id}`)
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export const Home = () => {
  const navigate = useNavigate()
  const [popular, setPopular] = useState<Movie[]>(() => readMovieCache(POPULAR_KEY))
  const [topMovies, setTopMovies] = useState<Movie[]>(() => readMovieCache(TOP_MOVIES_KEY))
  const [topSeries, setTopSeries] = useState<Movie[]>(() => readMovieCache(TOP_SERIES_KEY))
  const [recentlyViewed] = useState<Movie[]>(() => recentlyViewedCache.get())
  const [loadingPopular, setLoadingPopular] = useState(popular.length === 0)
  const [loadingTop, setLoadingTop] = useState(topMovies.length === 0)
  const [loadingSeries, setLoadingSeries] = useState(topSeries.length === 0)

  const hasProfile = useMemo(
    () => Boolean(localStorage.getItem('token') && localStorage.getItem('userEmail')),
    [],
  )
  const continueItems = useMemo(() => parseStoredContinue(), [])

  useEffect(() => {
    moviesAPI.getPopular(1)
      .then((r) => {
        const next = (r.data.results || []).slice(0, 20)
        setPopular(next)
        writeMovieCache(POPULAR_KEY, next)
      })
      .finally(() => setLoadingPopular(false))

    moviesAPI.getTopRated(1)
      .then((r) => {
        const next = (r.data.results || []).slice(0, 14)
        setTopMovies(next)
        writeMovieCache(TOP_MOVIES_KEY, next)
      })
      .finally(() => setLoadingTop(false))

    tvAPI.getTopRated(1)
      .then((r) => {
        const next = (r.data.results || []).slice(0, 14)
        setTopSeries(next)
        writeMovieCache(TOP_SERIES_KEY, next)
      })
      .finally(() => setLoadingSeries(false))
  }, [])

  return (
    <div className="space-y-10">
      <RecentlyViewedRow movies={recentlyViewed} />
      <ContinueWatchingRow profileReady={hasProfile} items={continueItems} />

      <MovieRow title="Популярное" movies={popular} loading={loadingPopular} onSeeAll={() => navigate('/movies')} />
      <MovieRow title="Топ фильмов" movies={topMovies} loading={loadingTop} onSeeAll={() => navigate('/movies-top')} />
      <MovieRow title="Топ сериалов" movies={topSeries} loading={loadingSeries} onSeeAll={() => navigate('/tv-top')} />
    </div>
  )
}
