import { useEffect, useState } from 'react'
import type { ApiMovie } from '@neomovies/api-client'
import { fetchHomeRows } from '../api'
import { categoryTitles } from '../categoryConfig'
import type { CategoryId, HomeRow, HomeRows } from '../types'

const EMPTY_ROWS: HomeRows = {
  popular: [],
  movies: [],
  tv: [],
}

export function useHomeRows() {
  const [data, setData] = useState<HomeRows>(EMPTY_ROWS)
  const [activeMovie, setActiveMovie] = useState<ApiMovie | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void fetchHomeRows().then((nextRows) => {
      if (cancelled) return

      setData(nextRows)
      setActiveMovie(nextRows.popular[0] ?? nextRows.movies[0] ?? nextRows.tv[0] ?? null)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const rows: HomeRow[] = [
    { id: 'popular' as CategoryId, title: categoryTitles.popular, items: data.popular.slice(0, 15) },
    { id: 'movies' as CategoryId, title: categoryTitles.movies, items: data.movies.slice(0, 15) },
    { id: 'tv' as CategoryId, title: categoryTitles.tv, items: data.tv.slice(0, 15) },
  ].filter((row) => row.items.length > 0)

  return {
    rows,
    activeMovie,
    setActiveMovie,
    isLoading,
  }
}
