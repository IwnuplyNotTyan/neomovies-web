import { useEffect, useMemo, useState } from 'react'
import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ApiMovie } from '@neomovies/api-client'
import { moviesAPI } from '../api/movies'
import { PosterCard } from './PosterCard'
import './SearchView.css'

const SEARCH_HISTORY_KEY = 'neo_tv_search_history_v1'

function readHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    return raw ? JSON.parse(raw) as string[] : []
  } catch {
    return []
  }
}

function writeHistory(items: string[]) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, 8)))
}

type SearchViewProps = {
  onBackToSidebar: () => void
  onOpenDetails: (movie: ApiMovie, focusKey: string) => void
  onCardFocus: (movie: ApiMovie) => void
  withSidebar?: boolean
  onFocusChange?: (focusKey: string) => void
}

type KeyboardLanguage = 'ru' | 'en' | 'uk'

const layouts: Record<KeyboardLanguage, string[][]> = {
  ru: [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'х'],
  ],
  en: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '-'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', "'", '?', '.'],
  ],
  uk: [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з'],
    ['ф', 'і', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ї'],
  ],
}

function SearchKey({
  focusKey,
  label,
  wide = false,
  onPress,
  onMoveToSidebar,
  onMoveToResults,
  onFocusChange,
  moveToResultsOnRight = false,
}: {
  focusKey: string
  label: string
  wide?: boolean
  onPress: () => void
  onMoveToSidebar?: () => void
  onMoveToResults?: () => void
  onFocusChange?: (focusKey: string) => void
  moveToResultsOnRight?: boolean
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: () => onFocusChange?.(focusKey),
    onEnterPress: onPress,
    onArrowPress: (direction) => {
      if (direction === 'left' && onMoveToSidebar) {
        onMoveToSidebar()
        return false
      }
      if (direction !== 'right' || !onMoveToResults || !moveToResultsOnRight) return true
      onMoveToResults()
      return false
    },
  })

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`search-key ${wide ? 'search-key-wide' : ''} ${focused ? 'is-focused' : ''}`}
    >
      {label}
    </button>
  )
}

export function SearchView({ onBackToSidebar, onOpenDetails, onCardFocus, withSidebar = true, onFocusChange }: SearchViewProps) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<KeyboardLanguage>('ru')
  const [results, setResults] = useState<ApiMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [activePage, setActivePage] = useState(1)
  const [lastResultsFocusKey, setLastResultsFocusKey] = useState('')
  const [history, setHistory] = useState<string[]>(() => readHistory())

  const searchFocusKey = 'search-view'
  const keyboardFocusKey = 'search-keyboard'
  const firstResultFocusKey = 'search-result-0'
  const keyboardRows = layouts[language]
  const canMoveToResults = results.length > 0
  const moveToSidebarSearch = () => setFocus('sidebar-search')

  const { ref } = useFocusable({
    focusKey: searchFocusKey,
    focusable: false,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: `${keyboardFocusKey}-lang-ru`,
  })

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      setActivePage(1)
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      setLoading(true)
      void moviesAPI.searchMovies(trimmed, 1)
        .then((response) => {
          if (cancelled) return
          setResults((response.data.results ?? []).slice(0, 18))
          setActivePage(1)
          if (trimmed) {
            const nextHistory = [trimmed, ...history.filter((item) => item !== trimmed)]
            setHistory(nextHistory.slice(0, 8))
            writeHistory(nextHistory)
          }
        })
        .catch(() => {
          if (cancelled) return
          setResults([])
        })
        .finally(() => {
          if (cancelled) return
          setLoading(false)
        })
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    const nextHistory = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 8)
    if (nextHistory.join('\n') === history.join('\n')) return
    setHistory(nextHistory)
    writeHistory(nextHistory)
  }, [history, query])

  useEffect(() => {
    requestAnimationFrame(() => {
      setFocus(`${keyboardFocusKey}-lang-${language}`)
    })
  }, [language])

  const headerText = useMemo(() => {
    if (!query.trim()) return 'Начни вводить название фильма или сериала'
    if (loading) return 'Ищем...'
    if (results.length === 0) return 'Ничего не найдено'
    return `Найдено: ${results.length}`
  }, [loading, query, results.length])

  const appendChar = (char: string) => setQuery((prev) => `${prev}${char}`)

  const langButtons: Array<{ id: KeyboardLanguage; label: string }> = [
    { id: 'ru', label: 'RU' },
    { id: 'en', label: 'EN' },
    { id: 'uk', label: 'UK' },
  ]

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="search-view">
      <div className="search-view-copy">
        <span className="search-view-kicker">Поиск</span>
        <h1 className="search-view-title">Поиск</h1>
      </div>

      <div className="search-query-panel">
        <div className="search-query-label">Запрос</div>
        <div className="search-query-value">{query || '...'}</div>
        <div className="search-query-meta">{headerText}</div>
      </div>

      <div className="search-layout">
        <div className="search-keyboard-panel">
          <div className="search-language-row">
            {langButtons.map((item) => {
              const focusKey = `${keyboardFocusKey}-lang-${item.id}`
              const { ref, focused } = useFocusable({
                focusKey,
                onFocus: () => onFocusChange?.(focusKey),
                onEnterPress: () => setLanguage(item.id),
                onArrowPress: (direction) => {
                  if (direction === 'left' && item.id === 'ru') {
                    moveToSidebarSearch()
                    return false
                  }
                  if (direction === 'right' && item.id === 'uk' && canMoveToResults) {
                    setFocus(lastResultsFocusKey || firstResultFocusKey)
                    return false
                  }
                  return true
                },
              })

              return (
                <button
                  key={item.id}
                  ref={ref as React.RefObject<HTMLButtonElement>}
                  type="button"
                  className={`search-language-button ${language === item.id ? 'is-active' : ''} ${focused ? 'is-focused' : ''}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="search-keys-grid">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="search-keys-row">
                {row.map((key, keyIndex) => (
                  <SearchKey
                    key={`${rowIndex}-${keyIndex}`}
                    focusKey={`${keyboardFocusKey}-key-${rowIndex}-${keyIndex}`}
                    label={key}
                    onPress={() => appendChar(key)}
                    onMoveToSidebar={keyIndex === 0 ? moveToSidebarSearch : undefined}
                    onMoveToResults={canMoveToResults ? () => setFocus(lastResultsFocusKey || firstResultFocusKey) : undefined}
                    onFocusChange={onFocusChange}
                    moveToResultsOnRight={keyIndex === row.length - 1}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="search-actions-row">
            <SearchKey
              focusKey={`${keyboardFocusKey}-space`}
              label="Пробел"
              wide
              onPress={() => appendChar(' ')}
              onMoveToSidebar={moveToSidebarSearch}
              onMoveToResults={canMoveToResults ? () => setFocus(lastResultsFocusKey || firstResultFocusKey) : undefined}
              onFocusChange={onFocusChange}
              moveToResultsOnRight={false}
            />
            <SearchKey
              focusKey={`${keyboardFocusKey}-backspace`}
              label="Стереть"
              wide
              onPress={() => setQuery((prev) => prev.slice(0, -1))}
              onMoveToResults={canMoveToResults ? () => setFocus(lastResultsFocusKey || firstResultFocusKey) : undefined}
              onFocusChange={onFocusChange}
              moveToResultsOnRight
            />
            <SearchKey
              focusKey={`${keyboardFocusKey}-clear`}
              label="Очистить"
              wide
              onPress={() => setQuery('')}
              onMoveToResults={canMoveToResults ? () => setFocus(lastResultsFocusKey || firstResultFocusKey) : undefined}
              onFocusChange={onFocusChange}
              moveToResultsOnRight
            />
          </div>

        </div>

        <div className="search-results-panel">
          {loading ? <div className="search-results-empty">Загрузка...</div> : null}
          {!loading && results.length === 0 ? (
            <div className="search-results-empty">Начни вводить запрос.</div>
          ) : null}

          <div className="search-results-grid">
            {results.map((movie, index) => {
              const focusKey = `search-result-${index}`
              return (
                <PosterCard
                  key={`${movie.id}-${index}`}
                  movie={movie}
                  focusKey={focusKey}
                  cardIndex={index}
                  variant="search"
                  onEnterView={() => {}}
                  onFocused={(focusedMovie) => {
                    setLastResultsFocusKey(focusKey)
                    onFocusChange?.(focusKey)
                    onCardFocus(focusedMovie)
                  }}
                  onContentFocus={(nextFocusKey) => {
                    setLastResultsFocusKey(nextFocusKey)
                    onFocusChange?.(nextFocusKey)
                  }}
                  onEnterPress={onOpenDetails}
                  onArrowPress={(direction) => {
                    if (direction === 'left' && index % 3 === 0) {
                      setFocus(`${keyboardFocusKey}-space`)
                      return false
                    }
                    if (direction === 'up') {
                      const nextIndex = index - 3
                      if (nextIndex < 0) return true
                      setFocus(`search-result-${nextIndex}`)
                      return false
                    }
                    if (direction === 'down') {
                      const nextIndex = index + 3
                      if (nextIndex >= results.length) return true
                      setFocus(`search-result-${nextIndex}`)
                      return false
                    }
                    return true
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
      <button type="button" className="search-hidden-back" onClick={onBackToSidebar} aria-hidden="true" tabIndex={-1} />
    </section>
  )
}
