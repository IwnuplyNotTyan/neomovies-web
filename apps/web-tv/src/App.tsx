import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { api } from './api'
import { Sidebar } from './components/Sidebar'
import { Hero } from './components/Hero'
import { MediaRow } from './components/MediaRow'
import { WatchView } from './components/WatchView'
import { SearchView } from './components/SearchView'
import { useHomeRows } from './hooks/useHomeRows'
import { categoryTitles } from './categoryConfig'
import type { CategoryId } from './types'
import { getPosterImageUrl } from './imageUrl'

const CategoryView = lazy(() => import('./components/CategoryView').then((module) => ({ default: module.CategoryView })))

const categoryPaths = {
  popular: 'popular',
  movies: 'films',
  tv: 'tv',
} satisfies Record<CategoryId, string>

const pathCategories: Record<string, CategoryId> = {
  popular: 'popular',
  films: 'movies',
  tv: 'tv',
}

function readCategoryFromPath() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  return pathCategories[path] ?? null
}

function shouldOpenCategoryFromSidebar() {
  return readCategoryFromPath() !== null
}

function readCategoryIdFromFocusKey(focusKey: string): CategoryId | null {
  if (focusKey.startsWith('row-popular-') || focusKey.startsWith('category-popular-')) return 'popular'
  if (focusKey.startsWith('row-movies-') || focusKey.startsWith('category-movies-')) return 'movies'
  if (focusKey.startsWith('row-tv-') || focusKey.startsWith('category-tv-')) return 'tv'
  return null
}

function readWatchIdFromPath() {
  const match = window.location.pathname.match(/^\/watch\/([^/]+)$/)
  return match?.[1] ?? null
}

function readSearchFromPath() {
  return window.location.pathname === '/search'
}

function BackgroundImage({ src, fallbackSrc }: { src: string; fallbackSrc: string }) {
  const [loaded, setLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  if (!currentSrc) return null

  const handleError = () => {
    if (!fallbackSrc || currentSrc === fallbackSrc) return
    setLoaded(false)
    setCurrentSrc(fallbackSrc)
  }

  return (
    <img
      className={`layer-bg-image ${loaded ? 'is-loaded' : ''}`}
      src={currentSrc}
      alt=""
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  )
}

export default function App() {
  const { rows, activeMovie, setActiveMovie, isLoading } = useHomeRows()
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [lastContentFocusKey, setLastContentFocusKey] = useState('row-popular-card-0')
  const [activeContentCategoryId, setActiveContentCategoryId] = useState<CategoryId>('popular')
  const [lastCategoryFocusKey, setLastCategoryFocusKey] = useState('')
  const [pendingCategoryFocusKey, setPendingCategoryFocusKey] = useState('')
  const [pendingHomeSidebarFocus, setPendingHomeSidebarFocus] = useState(false)
  const [suppressSidebarCategoryOpen, setSuppressSidebarCategoryOpen] = useState(false)
  const [categoryReturnFocusKey, setCategoryReturnFocusKey] = useState('row-popular-card-0')
  const [openCategoryId, setOpenCategoryId] = useState<CategoryId | null>(() => readCategoryFromPath())
  const [categoryOpenedFromSidebar, setCategoryOpenedFromSidebar] = useState(() => shouldOpenCategoryFromSidebar())
  const [detailsReturnFocusKey, setDetailsReturnFocusKey] = useState('row-popular-card-0')
  const [watchMovieId, setWatchMovieId] = useState<string | null>(() => readWatchIdFromPath())
  const [searchOpen, setSearchOpen] = useState(() => readSearchFromPath())
  const [didAutoFocusHomeContent, setDidAutoFocusHomeContent] = useState(false)
  const [searchReturnFocusKey, setSearchReturnFocusKey] = useState('search-keyboard-lang-ru')

  const backdrop = useMemo(() => {
    if (!activeMovie) return ''
    return api.backdropUrl(activeMovie.id, 'large')
  }, [activeMovie])
  const backdropFallback = getPosterImageUrl(activeMovie?.posterUrl)
  const visibleRows = isLoading
    ? [
        { id: 'popular' as const, title: categoryTitles.popular, items: [] },
        { id: 'movies' as const, title: categoryTitles.movies, items: [] },
        { id: 'tv' as const, title: categoryTitles.tv, items: [] },
      ]
    : rows

  useEffect(() => {
    if (watchMovieId || searchOpen || isLoading || rows.length === 0) return

     if (pendingHomeSidebarFocus) {
      requestAnimationFrame(() => {
        setFocus('sidebar-home')
        setPendingHomeSidebarFocus(false)
      })
      return
    }

    if (openCategoryId && categoryOpenedFromSidebar) {
      requestAnimationFrame(() => {
        setFocus(`sidebar-${openCategoryId}`)
      })
      return
    }

    if (didAutoFocusHomeContent) return

    setFocus('row-popular-card-0')
    setDidAutoFocusHomeContent(true)
  }, [categoryOpenedFromSidebar, didAutoFocusHomeContent, isLoading, openCategoryId, pendingHomeSidebarFocus, rows.length, searchOpen, watchMovieId])

  useEffect(() => {
    const handlePopState = () => {
      const nextCategoryId = readCategoryFromPath()
      const nextWatchId = readWatchIdFromPath()
      const nextSearchOpen = readSearchFromPath()
      setWatchMovieId(nextWatchId)
      setSearchOpen(nextSearchOpen)
      setOpenCategoryId(nextCategoryId)
      setCategoryOpenedFromSidebar(nextWatchId === null && !nextSearchOpen && nextCategoryId !== null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const handleSidebarBack = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Backspace') return

      event.preventDefault()

      if (openCategoryId) {
        if (categoryOpenedFromSidebar) {
          setSuppressSidebarCategoryOpen(true)
          requestAnimationFrame(() => {
            setFocus(`sidebar-${openCategoryId}`)
          })
          return
        }

        setOpenCategoryId(null)
        setCategoryOpenedFromSidebar(false)
        window.history.pushState(null, '', '/')
        requestAnimationFrame(() => {
          setFocus(categoryReturnFocusKey)
        })
        return
      }

      if (watchMovieId) {
        setWatchMovieId(null)
        window.history.pushState(null, '', openCategoryId ? `/${categoryPaths[openCategoryId]}` : '/')
        requestAnimationFrame(() => {
          setFocus(detailsReturnFocusKey)
        })
        return
      }

      if (searchOpen) {
        setSearchOpen(false)
        window.history.pushState(null, '', '/')
        requestAnimationFrame(() => {
          setFocus('sidebar-search')
        })
        return
      }

      setSidebarHidden(false)
      requestAnimationFrame(() => {
        setFocus('sidebar-home')
      })
    }

    window.addEventListener('keydown', handleSidebarBack)
    return () => {
      window.removeEventListener('keydown', handleSidebarBack)
    }
  }, [categoryOpenedFromSidebar, categoryReturnFocusKey, detailsReturnFocusKey, openCategoryId, searchOpen, watchMovieId])

  const openDetails = (movie: { id: string }, focusKey: string) => {
    setDetailsReturnFocusKey(focusKey)
    setWatchMovieId(movie.id)
    window.history.pushState(null, '', `/watch/${movie.id}`)
  }

  const openCategory = (categoryId: CategoryId) => {
    setCategoryReturnFocusKey(lastContentFocusKey)
    setCategoryOpenedFromSidebar(false)
    setOpenCategoryId(categoryId)
    window.history.pushState(null, '', `/${categoryPaths[categoryId]}`)
  }

  const openCategoryFromSidebar = (categoryId: CategoryId) => {
    setSuppressSidebarCategoryOpen(false)
    const nextFocusKey = lastCategoryFocusKey.startsWith(`category-${categoryId}-card-`)
      ? lastCategoryFocusKey
      : `category-${categoryId}-card-0`

    setCategoryReturnFocusKey(lastContentFocusKey)
    setCategoryOpenedFromSidebar(true)
    setSidebarHidden(false)
    setOpenCategoryId(categoryId)
    setLastCategoryFocusKey(nextFocusKey)
    setPendingCategoryFocusKey(nextFocusKey)
    if (window.location.pathname !== `/${categoryPaths[categoryId]}`) {
      window.history.pushState(null, '', `/${categoryPaths[categoryId]}`)
    }
  }

  const focusSidebarFromCategory = (categoryId: CategoryId) => {
    setSuppressSidebarCategoryOpen(false)
    setCategoryOpenedFromSidebar(true)
    setSidebarHidden(false)
    setPendingCategoryFocusKey('')

    requestAnimationFrame(() => {
      setFocus(`sidebar-${categoryId}`)
    })
  }

  const openHomeFromSidebar = () => {
    if (searchOpen) {
      setSearchOpen(false)
      setSuppressSidebarCategoryOpen(false)
      setPendingHomeSidebarFocus(true)
      if (window.location.pathname !== '/') window.history.pushState(null, '', '/')
      return
    }

    if (!openCategoryId) return
    setSuppressSidebarCategoryOpen(false)
    setPendingHomeSidebarFocus(true)
    setOpenCategoryId(null)
    setCategoryOpenedFromSidebar(false)
    if (window.location.pathname !== '/') window.history.pushState(null, '', '/')
  }

  const openSearchFromSidebar = () => {
    setOpenCategoryId(null)
    setCategoryOpenedFromSidebar(false)
    setSearchOpen(true)
    setSidebarHidden(false)
    if (window.location.pathname !== '/search') {
      window.history.pushState(null, '', '/search')
    }
  }

  const handleHomeContentFocus = (focusKey: string) => {
    setLastContentFocusKey(focusKey)
    const nextCategoryId = readCategoryIdFromFocusKey(focusKey)
    if (nextCategoryId) setActiveContentCategoryId(nextCategoryId)
  }

  const handleCategoryContentFocus = (focusKey: string) => {
    setLastCategoryFocusKey(focusKey)
    const nextCategoryId = readCategoryIdFromFocusKey(focusKey)
    if (nextCategoryId) setActiveContentCategoryId(nextCategoryId)
  }

  const activeSidebarItem = openCategoryId
    ? activeContentCategoryId
    : activeContentCategoryId
  const sidebarReturnFocusKey = categoryOpenedFromSidebar && openCategoryId
    ? (lastCategoryFocusKey.startsWith(`category-${openCategoryId}-card-`) ? lastCategoryFocusKey : `category-${openCategoryId}-card-0`)
    : searchOpen
      ? searchReturnFocusKey
      : lastContentFocusKey
  const currentCategoryPath = openCategoryId ? `/${categoryPaths[openCategoryId]}` : '/'

  return (
    <div className="app-layout">
      <div className="layer-bg">
        <BackgroundImage key={backdrop} src={backdrop} fallbackSrc={backdropFallback} />
        <div className="layer-bg-overlay" />
      </div>

      {watchMovieId || (openCategoryId && !categoryOpenedFromSidebar) ? null : (
        <Sidebar
          activeItem={searchOpen ? 'search' : activeSidebarItem}
          hidden={sidebarHidden}
          returnFocusKey={sidebarReturnFocusKey}
          onOpenCategory={openCategoryFromSidebar}
          onOpenHome={openHomeFromSidebar}
          onOpenSearch={openSearchFromSidebar}
          suppressCategoryOpen={suppressSidebarCategoryOpen}
        />
      )}

      {watchMovieId ? (
        <WatchView
          key={watchMovieId}
          movieId={watchMovieId}
          onBack={() => {
            setWatchMovieId(null)
            window.history.pushState(null, '', currentCategoryPath)
            requestAnimationFrame(() => {
              setFocus(detailsReturnFocusKey)
            })
          }}
        />
      ) : searchOpen ? (
        <SearchView
          onBackToSidebar={() => {
            setSearchOpen(false)
            if (window.location.pathname !== '/') {
              window.history.pushState(null, '', '/')
            }
            requestAnimationFrame(() => {
              setFocus('sidebar-search')
            })
          }}
          onOpenDetails={openDetails}
          onCardFocus={setActiveMovie}
          withSidebar
          onFocusChange={setSearchReturnFocusKey}
        />
      ) : openCategoryId ? (
        <Suspense fallback={null}>
          <CategoryView
            categoryId={openCategoryId}
            onCardFocus={setActiveMovie}
            onContentFocus={handleCategoryContentFocus}
            onOpenDetails={openDetails}
            autoFocusFirstCard={!categoryOpenedFromSidebar}
            withSidebar={categoryOpenedFromSidebar}
            preferredFocusKey={sidebarReturnFocusKey}
            restoreFocusKey={pendingCategoryFocusKey}
            onRestoreFocusApplied={() => setPendingCategoryFocusKey('')}
            onSidebarFocusRequest={focusSidebarFromCategory}
          />
        </Suspense>
      ) : (
        <div className="content">
          <div className="content-spacer">
            <Hero movie={activeMovie} />
          </div>

          <div className="rows-scroll">
            {visibleRows.map((row) => (
              <MediaRow
                key={row.id}
                rowId={row.id}
                title={row.title}
                items={row.items}
                loading={isLoading}
                onSidebarHiddenChange={setSidebarHidden}
                onCardFocus={setActiveMovie}
                onContentFocus={handleHomeContentFocus}
                onOpenCategory={() => openCategory(row.id)}
                onOpenDetails={openDetails}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
