import { useEffect, useMemo, useState } from 'react'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { api } from './api'
import { Sidebar } from './components/Sidebar'
import { Hero } from './components/Hero'
import { MediaRow } from './components/MediaRow'
import { useHomeRows } from './hooks/useHomeRows'

export default function App() {
  const { rows, activeMovie, setActiveMovie, isLoading } = useHomeRows()
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [lastContentFocusKey, setLastContentFocusKey] = useState('row-popular-card-0')

  const backdrop = useMemo(() => {
    if (!activeMovie) return ''
    return api.backdropUrl(activeMovie.id, 'xlarge')
  }, [activeMovie])

  useEffect(() => {
    if (isLoading || rows.length === 0) return
    setFocus('row-popular-card-0')
  }, [isLoading, rows.length])

  useEffect(() => {
    const handleSidebarBack = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Backspace') return

      event.preventDefault()
      setSidebarHidden(false)
      requestAnimationFrame(() => {
        setFocus('sidebar-home')
      })
    }

    window.addEventListener('keydown', handleSidebarBack)
    return () => {
      window.removeEventListener('keydown', handleSidebarBack)
    }
  }, [])

  return (
    <div className="app-layout">
      <div className="layer-bg">
        {backdrop ? <img className="layer-bg-image" src={backdrop} alt="" /> : null}
        <div className="layer-bg-overlay" />
      </div>

      <Sidebar activeItem="home" hidden={sidebarHidden} returnFocusKey={lastContentFocusKey} />

      <div className="content">
        <div className="content-spacer">
          <Hero movie={activeMovie} />
        </div>

        <div className="rows-scroll">
          <div className="rows-container">
            {isLoading
              ? [
                  <MediaRow key="s1" rowId="popular" title="Популярное" items={[]} loading onCardFocus={setActiveMovie} onSidebarHiddenChange={setSidebarHidden} />,
                  <MediaRow key="s2" rowId="movies" title="Фильмы" items={[]} loading onCardFocus={setActiveMovie} onSidebarHiddenChange={setSidebarHidden} />,
                  <MediaRow key="s3" rowId="tv" title="Сериалы" items={[]} loading onCardFocus={setActiveMovie} onSidebarHiddenChange={setSidebarHidden} />,
                ]
              : rows.map((row) => (
                  <MediaRow
                    key={row.id}
                    rowId={row.id}
                    title={row.title}
                    items={row.items}
                    onSidebarHiddenChange={setSidebarHidden}
                    onCardFocus={setActiveMovie}
                    onContentFocus={setLastContentFocusKey}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
