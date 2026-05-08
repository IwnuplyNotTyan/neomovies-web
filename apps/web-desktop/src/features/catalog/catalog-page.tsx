import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoviePosterCard } from '../shared/movie-card'
import { filterValidMovies } from '../../utils/filterMovies'
import type { Movie, MovieResponse, TVResponse } from '../../types'

type CatalogFetcher = (page: number) => Promise<{ data: MovieResponse | TVResponse }>

type CatalogPageProps = {
  title: string
  subtitle: string
  emptyText: string
  cacheKey: string
  fetchPage: CatalogFetcher
}

type CachedPage = {
  page: number
  totalPages: number
  items: Movie[]
}

function readCache(cacheKey: string): CachedPage | null {
  try {
    const raw = localStorage.getItem(cacheKey)
    return raw ? JSON.parse(raw) as CachedPage : null
  } catch {
    return null
  }
}

function writeCache(cacheKey: string, value: CachedPage) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(value))
  } catch {
    // Ignore non-critical cache write failures.
  }
}

function getPageWindow(page: number, totalPages: number) {
  const total = Math.min(totalPages, 500)
  const start = Math.max(1, page - 2)
  const end = Math.min(total, start + 4)
  const normalizedStart = Math.max(1, end - 4)
  return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index)
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (nextPage: number) => void
}) {
  const maxPages = Math.min(totalPages, 500)
  const pageWindow = getPageWindow(page, maxPages)

  if (maxPages <= 1) return null

  return (
    <div className="pagination-bar flex flex-wrap items-center justify-center gap-2">

      {pageWindow.map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`h-10 min-w-10 rounded-full px-3 text-sm font-medium transition ${
            value === page
              ? 'bg-white text-[#07090d]'
              : 'border border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/12 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          {value}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= maxPages}
        className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-white/[0.02] disabled:text-zinc-700"
      >
        Дальше
      </button>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]"
        >
          <div className="aspect-[0.7] animate-pulse bg-white/[0.04]" />
          <div className="space-y-2 px-4 py-4">
            <div className="h-5 w-4/5 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CatalogPage({
  title,
  subtitle,
  emptyText,
  cacheKey,
  fetchPage,
}: CatalogPageProps) {
  const navigate = useNavigate()
  const cached = useMemo(() => readCache(cacheKey), [cacheKey])
  const [items, setItems] = useState<Movie[]>(cached?.items ?? [])
  const [loading, setLoading] = useState(items.length === 0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(cached?.totalPages ?? 1)

  const changePage = (next: number) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(items.length === 0)
        const res = await fetchPage(page)
        if (cancelled) return
        const nextItems = filterValidMovies((res.data.results || []) as Movie[])
        const nextTotalPages = res.data.total_pages || 1
        setItems(nextItems)
        setTotalPages(nextTotalPages)
        writeCache(cacheKey, { page, totalPages: nextTotalPages, items: nextItems })
      } catch (error) {
        console.error(`Error fetching ${cacheKey}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [cacheKey, fetchPage, page])

  return (
    <section className="catalog-shell space-y-8">
      <header className="space-y-4 rounded-[30px] border border-white/8 bg-white/[0.02] px-6 py-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          NeoMovies
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[44px] font-black tracking-[-0.05em] text-white">{title}</h1>
            <p className="max-w-3xl text-[15px] leading-7 text-zinc-500">{subtitle}</p>
          </div>
          <div className="catalog-page-badge rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400">
            Страница {page} из {Math.min(totalPages, 500)}
          </div>
        </div>
      </header>

      {loading ? (
        <LoadingGrid />
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-zinc-500">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((movie) => (
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

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}
    </section>
  )
}
