import { For, Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { api, createPopular, createTopMovies, createTopTv, fetchPopularPage, fetchTopMoviesPage, fetchTopTvPage } from './data'
import { MediaCard } from './components/MediaCard'
import { AllCard } from './components/AllCard'
import { SidebarNav } from './components/SidebarNav'
import { HeroPanel } from './components/HeroPanel'
import type { ApiMovie } from '@neomovies/api-client'

type Route = 'home' | 'popular' | 'movies' | 'tv' | 'favorites' | 'search'

export default function App() {
  const [popular] = createPopular()
  const [topMovies] = createTopMovies()
  const [topTv] = createTopTv()

  const [route, setRoute] = createSignal<Route>('home')
  const [activeRow, setActiveRow] = createSignal(0)
  const [activeCol, setActiveCol] = createSignal(0)
  const [navFocus, setNavFocus] = createSignal(false)
  const [activeNav, setActiveNav] = createSignal(1)

  const [gridItems, setGridItems] = createSignal<ApiMovie[]>([])
  const [gridPage, setGridPage] = createSignal(1)
  const [gridCol, setGridCol] = createSignal(0)
  const [gridRow, setGridRow] = createSignal(0)
  const [gridLoading, setGridLoading] = createSignal(false)
  const [gridHasMore, setGridHasMore] = createSignal(true)
  const gridCols = 6
  const keyThrottleMs = 90

  const [bgUrl, setBgUrl] = createSignal('')
  const [prevBgUrl, setPrevBgUrl] = createSignal('')
  const [bgSwap, setBgSwap] = createSignal(false)

  let rowRefPopular!: HTMLDivElement
  let rowRefMovies!: HTMLDivElement
  let rowRefTv!: HTMLDivElement
  let rowsRef!: HTMLElement
  let gridRef!: HTMLElement
  let lastKeyAt = 0
  let bgDebounceTimer: ReturnType<typeof setTimeout> | undefined

  const popularList = createMemo(() => popular()?.data.results ?? [])
  const moviesList = createMemo(() => topMovies()?.data.results ?? [])
  const tvList = createMemo(() => topTv()?.data.results ?? [])

  const currentRowsList = createMemo(() => {
    if (activeRow() === 0) return popularList().slice(0, 7)
    if (activeRow() === 1) return moviesList().slice(0, 7)
    return tvList().slice(0, 7)
  })
  const activeRowsMovie = createMemo(() => currentRowsList()[activeCol()])
  const activeGridMovie = createMemo(() => gridItems()[gridRow() * gridCols + gridCol()])
  const activeMovie = createMemo(() => (route() === 'home' ? activeRowsMovie() : activeGridMovie()))
  const virtualWindow = createMemo(() => {
    const totalRows = Math.ceil(gridItems().length / gridCols)
    const startRow = Math.max(0, gridRow() - 2)
    const endRow = Math.min(totalRows - 1, gridRow() + 3)
    const start = startRow * gridCols
    const end = (endRow + 1) * gridCols
    return { start, end, items: gridItems().slice(start, end) }
  })

  const navHash = (idx: number) => idx === 0 ? '#/search' : idx === 1 ? '#' : idx === 2 ? '#/movies' : idx === 3 ? '#/tv' : '#/favorites'
  const hashToRoute = (h: string): Route => h === '#/popular' ? 'popular' : h === '#/movies' ? 'movies' : h === '#/tv' ? 'tv' : h === '#/favorites' ? 'favorites' : h === '#/search' ? 'search' : 'home'
  const routeToNav = (r: Route) => r === 'search' ? 0 : r === 'favorites' ? 4 : r === 'tv' ? 3 : r === 'movies' ? 2 : 1

  const loadGrid = async (reset = false) => {
    const r = route()
    if (!(r === 'popular' || r === 'movies' || r === 'tv')) return
    if (gridLoading()) return
    if (!reset && !gridHasMore()) return
    setGridLoading(true)
    const page = reset ? 1 : gridPage() + 1
    const data = r === 'popular' ? await fetchPopularPage(page) : r === 'movies' ? await fetchTopMoviesPage(page) : await fetchTopTvPage(page)
    const next = data.data.results ?? []
    const metaAny = data.data as any
    const totalPages = Number(metaAny?.pages ?? metaAny?.total_pages ?? 0)
    const reachedByMeta = totalPages > 0 && page >= totalPages
    const reachedByEmpty = next.length === 0
    setGridItems((prev) => {
      const merged = reset ? next : [...prev, ...next]
      const seen = new Set<string>()
      return merged.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    })
    setGridPage(page)
    setGridHasMore(!(reachedByMeta || reachedByEmpty))
    setGridLoading(false)
  }

  const scrollToRowCard = (rowIndex = activeRow(), behavior: ScrollBehavior = 'smooth') => {
    const rowRef = rowIndex === 0 ? rowRefPopular : rowIndex === 1 ? rowRefMovies : rowRefTv
    const el = rowRef?.querySelector(`[data-card-index="${activeCol()}"]`) as HTMLElement | null
    if (!el || !rowRef) return
    const targetLeft = el.offsetLeft - (rowRef.clientWidth - el.clientWidth) / 2
    const nextLeft = Math.max(0, Math.min(targetLeft, rowRef.scrollWidth - rowRef.clientWidth))
    rowRef.scrollTo({ left: nextLeft, behavior })
  }
  const scrollRowsToActiveRow = (rowIndex = activeRow(), behavior: ScrollBehavior = 'smooth') => {
    if (!rowsRef) return
    const rowEl = rowsRef.querySelector(`[data-row-index="${rowIndex}"]`) as HTMLElement | null
    if (!rowEl) return
    rowsRef.scrollTo({ top: rowEl.offsetTop, behavior })
  }

  const scrollGridToActive = () => {
    if (!gridRef) return
    const idx = gridRow() * gridCols + gridCol()
    const el = gridRef.querySelector(`[data-grid-index="${idx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }

  onMount(() => {
    const syncRoute = () => {
      const nextRoute = hashToRoute((window.location.hash || '#').toLowerCase())
      setRoute(nextRoute)
      setActiveNav(routeToNav(nextRoute))
      if (nextRoute === 'popular' || nextRoute === 'movies' || nextRoute === 'tv') {
        setGridCol(0); setGridRow(0); setGridHasMore(true); void loadGrid(true)
      }
    }
    syncRoute()
    window.addEventListener('hashchange', syncRoute)

    window.addEventListener('keydown', (e) => {
      const now = Date.now()
      if (e.repeat && now - lastKeyAt < keyThrottleMs) return
      if (now - lastKeyAt < keyThrottleMs) return
      lastKeyAt = now

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        if (route() === 'popular') {
          window.location.hash = '#'
          setNavFocus(false)
          return
        }
        setNavFocus(true)
        return
      }
      if (e.repeat && navFocus()) return
      if (navFocus()) {
        if (e.key === 'ArrowUp') { const n = Math.max(0, activeNav() - 1); setActiveNav(n); window.location.hash = navHash(n); return }
        if (e.key === 'ArrowDown') { const n = Math.min(4, activeNav() + 1); setActiveNav(n); window.location.hash = navHash(n); return }
        if (e.key === 'ArrowRight') { setNavFocus(false); return }
      }

      if (route() === 'home') {
        if (e.key === 'ArrowLeft' && activeCol() === 0) { setNavFocus(true); return }
        if (e.key === 'ArrowRight') {
          const maxCol = currentRowsList().length
          if (activeCol() >= maxCol) return
          setActiveCol((v) => Math.min(v + 1, maxCol))
          queueMicrotask(scrollToRowCard)
          return
        }
        if (e.key === 'ArrowLeft') {
          if (activeCol() === 0) { setNavFocus(true); return }
          setActiveCol((v) => Math.max(v - 1, 0))
          queueMicrotask(scrollToRowCard)
          return
        }
        if (e.key === 'ArrowDown') {
          const nextRow = Math.min(activeRow() + 1, 2)
          setActiveRow(nextRow)
          queueMicrotask(() => {
            scrollRowsToActiveRow(nextRow)
            scrollToRowCard(nextRow)
          })
          return
        }
        if (e.key === 'ArrowUp') {
          if (activeRow() === 0) { setNavFocus(true); return }
          const prevRow = Math.max(activeRow() - 1, 0)
          setActiveRow(prevRow)
          queueMicrotask(() => {
            scrollRowsToActiveRow(prevRow)
            scrollToRowCard(prevRow)
          })
          return
        }
        if (e.key === 'Enter' && activeCol() === currentRowsList().length) {
          const r = activeRow() === 0 ? '#/popular' : activeRow() === 1 ? '#/movies' : '#/tv'
          window.location.hash = r
        }
        return
      }

      if (e.key === 'ArrowLeft' && gridCol() === 0) { setNavFocus(true); return }
      if (e.key === 'ArrowRight') {
        const nextCol = Math.min(gridCol() + 1, gridCols - 1)
        const nextIndex = gridRow() * gridCols + nextCol
        if (nextIndex >= gridItems().length) {
          if (gridHasMore()) void loadGrid(false)
          return
        }
        setGridCol(nextCol)
        if (nextIndex + gridCols >= gridItems().length && gridHasMore()) void loadGrid(false)
        queueMicrotask(scrollGridToActive)
        return
      }
      if (e.key === 'ArrowLeft') { setGridCol((v) => Math.max(v - 1, 0)); queueMicrotask(scrollGridToActive); return }
      if (e.key === 'ArrowDown') {
        const nextRow = gridRow() + 1
        const nextIndex = nextRow * gridCols + gridCol()
        if (nextIndex >= gridItems().length) {
          if (gridHasMore()) {
            void loadGrid(false)
          }
          return
        }
        setGridRow(nextRow)
        if ((nextRow + 2) * gridCols >= gridItems().length && gridHasMore()) void loadGrid(false)
        queueMicrotask(scrollGridToActive)
        return
      }
      if (e.key === 'ArrowUp') { setGridRow((v) => Math.max(v - 1, 0)); queueMicrotask(scrollGridToActive); return }
    })
  })

  createEffect(() => {
    const m = activeMovie()
    const next = m ? api.backdropUrl(m.id, 'xlarge') : ''
    if (!next) return
    if (bgDebounceTimer) clearTimeout(bgDebounceTimer)
    bgDebounceTimer = setTimeout(() => {
      if (bgUrl() === next) return
      const img = new Image()
      img.onload = () => { setPrevBgUrl(bgUrl()); setBgUrl(next); setBgSwap(true); setTimeout(() => { setPrevBgUrl(''); setBgSwap(false) }, 800) }
      img.src = next
    }, 160)
    if (!bgUrl()) { setBgUrl(next); return }
  })

  return (
    <main class="tv-root">
      <Show when={prevBgUrl()}><img src={prevBgUrl()} class={`tv-bg ${bgSwap() ? 'opacity-0' : 'opacity-100'}`} alt="" /></Show>
      <Show when={bgUrl()}><img src={bgUrl()} class="tv-bg opacity-100" alt="" /></Show>
      <div class="tv-shade-main" /><div class="tv-shade-top" /><div class="tv-shade-bottom" /><div class="tv-shade-left" /><div class="tv-shade-right" />

      <SidebarNav activeNav={activeNav} />

      <Show when={route() === 'home'}>
        <HeroPanel movie={activeMovie()} />
      </Show>

      <Show when={route() === 'home'}>
        <section class="tv-rows" ref={rowsRef}>
          <div class="flex flex-col gap-3.5" data-row-index={0}>
            <h2 class="tv-row-title">Популярное</h2>
            <div class="tv-track" ref={rowRefPopular}>
              <For each={popularList().slice(0, 7)}>{(movie, i) => <div data-card-index={i()}><MediaCard movie={movie} imageSource="backdrop" active={!navFocus() && activeRow() === 0 && i() === activeCol()} /></div>}</For>
              <div data-card-index={popularList().slice(0, 7).length}><AllCard active={!navFocus() && activeRow() === 0 && activeCol() === popularList().slice(0, 7).length} /></div>
            </div>
          </div>
          <div class="flex flex-col gap-3.5" data-row-index={1}>
            <h2 class="tv-row-title">Топ фильмов</h2>
            <div class="tv-track" ref={rowRefMovies}>
              <For each={moviesList().slice(0, 7)}>{(movie, i) => <div data-card-index={i()}><MediaCard movie={movie} imageSource="backdrop" active={!navFocus() && activeRow() === 1 && i() === activeCol()} /></div>}</For>
              <div data-card-index={moviesList().slice(0, 7).length}><AllCard active={!navFocus() && activeRow() === 1 && activeCol() === moviesList().slice(0, 7).length} /></div>
            </div>
          </div>
          <div class="flex flex-col gap-3.5" data-row-index={2}>
            <h2 class="tv-row-title">Топ сериалов</h2>
            <div class="tv-track" ref={rowRefTv}>
              <For each={tvList().slice(0, 7)}>{(movie, i) => <div data-card-index={i()}><MediaCard movie={movie} imageSource="backdrop" active={!navFocus() && activeRow() === 2 && i() === activeCol()} /></div>}</For>
              <div data-card-index={tvList().slice(0, 7).length}><AllCard active={!navFocus() && activeRow() === 2 && activeCol() === tvList().slice(0, 7).length} /></div>
            </div>
          </div>
        </section>
      </Show>

      <Show when={route() === 'popular' || route() === 'movies' || route() === 'tv'}>
        <section class="absolute bottom-8 top-8 left-32 right-8 z-[2] overflow-hidden">
          <h2 class="tv-row-title mb-4">{route() === 'popular' ? 'Популярное' : route() === 'movies' ? 'Топ фильмов' : 'Топ сериалов'}</h2>
          <div ref={gridRef} class="grid max-h-[86vh] grid-cols-6 gap-4 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Show when={gridLoading() && gridItems().length === 0}>
              <For each={Array.from({ length: 18 })}>
                {() => (
                  <div class="tv-card tv-card-poster animate-pulse">
                    <div class="tv-card-image bg-white/10" />
                    <div class="tv-card-meta">
                      <div class="h-6 w-2/3 rounded bg-white/12" />
                      <div class="h-4 w-1/4 rounded bg-white/10" />
                    </div>
                  </div>
                )}
              </For>
            </Show>
            <For each={virtualWindow().items}>
              {(m, i) => {
                const absoluteIndex = () => virtualWindow().start + i()
                return <div data-grid-index={absoluteIndex()}><MediaCard movie={m} variant="poster" active={!navFocus() && absoluteIndex() === (gridRow() * gridCols + gridCol())} /></div>
              }}
            </For>
          </div>
        </section>
      </Show>
    </main>
  )
}
