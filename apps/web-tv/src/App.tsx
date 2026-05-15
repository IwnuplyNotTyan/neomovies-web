import { Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { api, createPopular, createTopMovies, createTopTv } from './data'
import { Sidebar } from './components/Sidebar'
import { MediaRow } from './components/MediaRow'
import { focusFirstContent, initSpatialNavigation, refreshFocusable } from './engine/spatial'
import type { ApiMovie } from '@neomovies/api-client'
import './styles/App.css'

export default function App() {
  const [popular] = createPopular()
  const [topMovies] = createTopMovies()
  const [topTv] = createTopTv()
  
  const [activeMovie, setActiveMovie] = createSignal<ApiMovie>()

  const rows = createMemo(() => {
    const p = popular()?.data.results ?? []
    const m = topMovies()?.data.results ?? []
    const t = topTv()?.data.results ?? []
    return [
      { id: 'popular', title: 'Популярное', items: p.slice(0, 15) },
      { id: 'movies', title: 'Фильмы', items: m.slice(0, 15) },
      { id: 'tv', title: 'Сериалы', items: t.slice(0, 15) }
    ].filter(r => r.items.length > 0)
  })

  onMount(() => {
    initSpatialNavigation()
    setTimeout(() => {
      refreshFocusable()
      focusFirstContent()
    }, 200)
  })

  createEffect(() => {
    rows()
    queueMicrotask(refreshFocusable)
  })

  const backdrop = () => {
    const movie = activeMovie()
    if (!movie) return ''
    return `${api.backdropUrl(movie.id, 'xlarge')}`
  }

  return (
    <div class="app-layout">
      {/* Lampa-style Background */}
      <div class="layer-bg">
        <Show when={backdrop()}>
          {(url) => <img class="layer-bg-image" src={url()} alt="" />}
        </Show>
        <div class="layer-bg-overlay" />
      </div>

      {/* Sidebar Layer */}
      <Sidebar activeItem="home" />

      {/* Content Layer */}
      <div class="content" data-focus-section="content">
        <div class="content-spacer">
           <Show when={activeMovie()}>
             {(movie) => (
               <div class="hero">
                  <img class="hero-logo" src={`${api.logoUrl(movie().id)}?size=small&format=webp&quality=80`} />
                  <div class="hero-desc">{movie().description}</div>
               </div>
             )}
           </Show>
        </div>
        <div class="rows-container">
          {rows().map((row, index) => (
             <MediaRow 
               title={row.title} 
               items={row.items} 
               firstRow={index === 0}
               onCardFocus={setActiveMovie} 
             />
          ))}
        </div>
      </div>
    </div>
  )
}




