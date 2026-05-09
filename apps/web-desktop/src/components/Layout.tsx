import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { moviesAPI, getImageUrl } from '../api'
import type { Movie } from '../types'
import { GoHome, GoHomeFill } from 'react-icons/go'
import { PiFilmSlate, PiFilmSlateFill } from 'react-icons/pi'
import { MdOutlineLiveTv, MdLiveTv } from 'react-icons/md'
import { HiOutlineHeart, HiHeart } from 'react-icons/hi2'
import { HiOutlineUser } from 'react-icons/hi2'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { FaGithub, FaTelegramPlane } from 'react-icons/fa'
import { HiOutlineDocumentText, HiOutlineDevicePhoneMobile, HiOutlineTv, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2'
import { ProfileModal } from './ProfileModal'

type Props = { children: React.ReactNode }
const KEY = 'neo_search_history_v1'

const NAV = [
  { label: 'Главная', path: '/', Icon: GoHome, IconActive: GoHomeFill },
  { label: 'Топ фильмов', path: '/movies-top', Icon: PiFilmSlate, IconActive: PiFilmSlateFill },
  { label: 'Топ сериалов', path: '/tv-top', Icon: MdOutlineLiveTv, IconActive: MdLiveTv },
  { label: 'Избранное', path: '/favorites', Icon: HiOutlineHeart, IconActive: HiHeart },
]

function readHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[] }
  catch { return [] }
}

const footerLinks = [
  { href: 'https://github.com/Neo-Open-Source/', label: 'GitHub', Icon: FaGithub },
  { href: 'https://t.me/neomovies_news', label: 'Telegram', Icon: FaTelegramPlane },
  { href: 'https://api.neomovies.ru', label: 'API Docs', Icon: HiOutlineDocumentText },
]

const appSwitches = [
  { href: 'https://m.domain', label: 'Мобильная версия', Icon: HiOutlineDevicePhoneMobile },
  { href: 'https://tv.domain', label: 'TV версия', Icon: HiOutlineTv },
]

const THEME_KEY = 'neo_desktop_theme'

export function Layout({ children }: Props) {
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>(() => readHistory())
  const [userName, setUserName] = useState('Вход')
  const [avatar, setAvatar] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem('token')
      const storedName = localStorage.getItem('userName')
      const storedEmail = localStorage.getItem('userEmail')
      const nextName = token ? (storedName || storedEmail || 'Профиль') : 'Вход'
      setUserName(nextName)
      setAvatar(token ? (localStorage.getItem('userAvatar') || '') : '')
    }

    syncUser()
    window.addEventListener('auth-changed', syncUser)
    return () => window.removeEventListener('auth-changed', syncUser)
  }, [])

  const saveSearchQuery = (value: string) => {
    const q = value.trim()
    if (!q) return
    const next = [q, ...history.filter((i) => i !== q)].slice(0, 12)
    setHistory(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const commitSearch = (value: string) => {
    const q = value.trim()
    if (!q) return
    saveSearchQuery(q)
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const routeQuery = params.get('q') || params.get('query') || ''
    if (location.pathname === '/search') {
      setQuery(routeQuery)
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current?.contains(event.target as Node)) return
      setSearchExpanded(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchExpanded(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (location.pathname === '/search' || query.trim()) {
      setSearchExpanded(true)
    }
  }, [location.pathname, query])

  useEffect(() => {
    setSearchExpanded(false)
  }, [location.pathname])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await moviesAPI.searchMovies(trimmed, 1)
        if (cancelled) return
        setSearchResults((res.data.results || []).slice(0, 6))
      } catch (error) {
        if (!cancelled) {
          console.error('Navbar search error:', error)
          setSearchResults([])
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const isSearchExpanded = searchExpanded || location.pathname === '/search' || query.trim().length > 0
  const showSearchPanel = searchExpanded && (query.trim().length > 0 || history.length > 0)

  const openMovie = (movie: Movie) => {
    const id = movie.kinopoisk_id ? `kp_${movie.kinopoisk_id}` : movie.id
    if (query.trim()) saveSearchQuery(query)
    navigate(`/${id}`)
    setSearchExpanded(false)
  }

  return (
    <div className="app-shell min-h-screen bg-[#07090d] text-zinc-100">
      <header className="sticky top-0 z-20 flex justify-center px-4 pt-4">
        <div className="app-navbar-shell flex w-fit min-w-[1080px] items-center gap-2 rounded-full border border-white/[0.07] bg-[linear-gradient(180deg,rgba(15,18,25,0.78),rgba(10,12,18,0.72))] px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm ring-1 ring-white/[0.025]">
          {/* Logo */}
          <button
            className="brand-wordmark flex shrink-0 items-center rounded-full bg-white/[0.045] px-4 py-2 text-[16px] text-white transition hover:bg-white/[0.06]"
            onClick={() => navigate('/')}
          >
            NeoMovies
          </button>

          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map(({ label, path, Icon, IconActive }) => {
              const active = location.pathname === path
              const Ic = active ? IconActive : Icon
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  data-active={active ? "true" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <Ic className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </nav>

          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Search */}
          <form
            className="flex items-center"
            onSubmit={(e) => { e.preventDefault(); commitSearch(query) }}
          >
            <div
              ref={searchRef}
              className={`search-pill relative flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-200 ${
                isSearchExpanded
                  ? 'w-[420px] border-white/[0.18] bg-white/[0.06]'
                  : 'w-[340px] border-transparent bg-transparent'
              }`}
            >
              <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                placeholder="Поиск фильмов и сериалов"
                className="search-input w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              {showSearchPanel ? (
                <div
                  className="search-dropdown absolute left-0 top-[calc(100%+10px)] z-50 w-[420px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(20,24,34,0.96),rgba(10,12,18,0.98))] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-white/[0.03]"
                >
                  {query.trim().length >= 2 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                          Быстрый поиск
                        </span>
                        <button type="button" onClick={() => commitSearch(query)} className="text-sm text-zinc-400 transition hover:text-white">
                          Все результаты
                        </button>
                      </div>
                      {searchLoading ? (
                        <div className="px-2 py-8 text-center text-sm text-zinc-500">Ищем...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.map((movie) => {
                            const title = movie.title || movie.name || movie.nameRu || movie.originalTitle || 'Untitled'
                            const meta = String(movie.year || movie.releaseDate || movie.release_date || movie.first_air_date || '').slice(0, 4)
                            const poster = getImageUrl(movie.poster_path || movie.posterUrlPreview || movie.posterUrl)
                            return (
                              <button key={String(movie.id)} type="button" onClick={() => openMovie(movie)} className="flex w-full items-center gap-3 rounded-[18px] px-2 py-2 text-left transition hover:bg-white/[0.05]">
                                <img src={poster} alt="" className="h-14 w-10 shrink-0 rounded-[10px] object-cover" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-zinc-100">{title}</div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {(movie.type === 'tv' || movie.media_type === 'tv') ? 'Сериал' : 'Фильм'}{meta ? ` • ${meta}` : ''}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="px-2 py-8 text-center text-sm text-zinc-500">Ничего не найдено</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Недавние поиски</div>
                      <div className="flex flex-wrap gap-2 px-2 pb-1">
                        {history.slice(0, 8).map((item) => (
                          <button key={item} type="button" onClick={() => commitSearch(item)} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white">
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </form>

          {/* User */}
          <button
            className="navbar-user ml-1 flex shrink-0 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
            onClick={() => (avatar || userName !== 'Вход' ? setProfileOpen(true) : navigate('/auth'))}
          >
            {avatar ? (
              <img src={avatar} className="h-6 w-6 rounded-full object-cover" alt="" />
            ) : (
              <HiOutlineUser className="h-5 w-5 text-zinc-300" />
            )}
            <span>{userName}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-10 px-6 py-6">{children}</main>
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <footer className="mx-auto mt-4 max-w-[1400px] px-6 pb-10">
        <div className="app-footer-shell grid gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm text-zinc-500 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="brand-wordmark shrink-0 text-zinc-200">NeoMovies</span>
            <span className="truncate text-zinc-500">2024–{currentYear} Все права защищены</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-center">
            {footerLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-l border-white/[0.07] pl-4 lg:justify-end">
            {appSwitches.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center justify-start gap-2 border-l border-white/[0.07] pl-4 lg:justify-end">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-100"
            >
              {theme === 'dark' ? (
                <>
                  <HiOutlineSun className="h-4 w-4" />
                  <span>Светлая тема</span>
                </>
              ) : (
                <>
                  <HiOutlineMoon className="h-4 w-4" />
                  <span>Тёмная тема</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
