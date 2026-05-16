import { Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { api, fetchPopularPage, fetchTopMoviesPage, fetchTopTvPage } from './data'
import { Sidebar } from './components/Sidebar'
import { MediaRow } from './components/MediaRow'
import { focusFirstContent, focusSidebar, initSpatialNavigation, refreshFocusable } from './engine/spatial'
import type { ApiMovie } from '@neomovies/api-client'
import './styles/App.css'

export default function App() {
  const [rowsData, setRowsData] = createSignal<{ popular: ApiMovie[], movies: ApiMovie[], tv: ApiMovie[] }>({
    popular: [],
    movies: [],
    tv: [],
  })
  const [activeMovie, setActiveMovie] = createSignal<ApiMovie>()
  const [isLoading, setIsLoading] = createSignal(true)
  const [sidebarDepth, setSidebarDepth] = createSignal(false)

  const rows = createMemo(() => {
    const { popular, movies, tv } = rowsData()
    return [
      { id: 'popular', title: 'Популярное', items: popular.slice(0, 15) },
      { id: 'movies',  title: 'Фильмы',     items: movies.slice(0, 15) },
      { id: 'tv',      title: 'Сериалы',    items: tv.slice(0, 15) },
    ].filter(r => r.items.length > 0)
  })

  onMount(() => {
    initSpatialNavigation()

    void Promise.all([
      fetchPopularPage(1),
      fetchTopMoviesPage(1),
      fetchTopTvPage(1),
    ]).then(([popular, movies, tv]) => {
      setRowsData({
        popular: popular.data.results ?? [],
        movies: movies.data.results ?? [],
        tv: tv.data.results ?? [],
      })
      setActiveMovie(popular.data.results?.[0] ?? movies.data.results?.[0] ?? tv.data.results?.[0])
      setIsLoading(false)

      queueMicrotask(() => {
        refreshFocusable()
        focusFirstContent()
      })
    })
  })

  createEffect(() => {
    const nextRows = rows()
    if (nextRows.length === 0) return
    queueMicrotask(refreshFocusable)
  })

  onMount(() => {
    const handleSidebarDepth = (event: Event) => {
      const detail = (event as CustomEvent<{ pushedBack?: boolean }>).detail
      setSidebarDepth(Boolean(detail?.pushedBack))
    }

    window.addEventListener('row-navigation-depth', handleSidebarDepth as EventListener)

    return () => {
      window.removeEventListener('row-navigation-depth', handleSidebarDepth as EventListener)
    }
  })

  onMount(() => {
    const handleBackToSidebar = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Backspace') return

      const active = document.activeElement as HTMLElement | null
      if (!active?.closest('[data-focus-section="content"]')) return

      event.preventDefault()
      setSidebarDepth(false)
      queueMicrotask(focusSidebar)
    }

    window.addEventListener('keydown', handleBackToSidebar)

    return () => {
      window.removeEventListener('keydown', handleBackToSidebar)
    }
  })

  const backdrop = () => {
    const movie = activeMovie()
    if (!movie) return ''
    return `${api.backdropUrl(movie.id, 'xlarge')}`
  }

  return (
    <div class="app-layout">
      {/* Background */}
      <div class="layer-bg">
        <Show when={backdrop()}>
          {(url) => <img class="layer-bg-image" src={url()} alt="" />}
        </Show>
        <div class="layer-bg-overlay" />
      </div>

      {/* Sidebar */}
      <Sidebar activeItem="home" pushedBack={sidebarDepth()} />

      {/* Content */}
      <div class="content" data-focus-section="content">
        <div class="content-spacer">
          <Show when={activeMovie()}>
            {(movie) => (
              <div class="hero">
                <img
                  class="hero-logo"
                  src={`${api.logoUrl(movie().id)}?size=small&format=webp&quality=80`}
                  alt={movie().title}
                />
                <div class="hero-desc">{movie().description}</div>
              </div>
            )}
          </Show>
        </div>

        {/*
          rows-scroll скроллит вертикально.
          rows-container НЕ имеет overflow — иначе transform на
          дочерних карточках обрезается scroll-контейнером.
        */}
        <div class="rows-scroll">
          <div class="rows-container">
            <Show
              when={!isLoading()}
              fallback={[
                <MediaRow title="Популярное" items={[]} loading onCardFocus={setActiveMovie} />,
                <MediaRow title="Фильмы" items={[]} loading onCardFocus={setActiveMovie} />,
                <MediaRow title="Сериалы" items={[]} loading onCardFocus={setActiveMovie} />,
              ]}
            >
              {rows().map((row, index) => (
                <MediaRow
                  title={row.title}
                  items={row.items}
                  firstRow={index === 0}
                  onCardFocus={setActiveMovie}
                />
              ))}
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
