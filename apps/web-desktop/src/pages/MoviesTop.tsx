import { useCallback } from 'react'
import { moviesAPI } from '../api'
import { CatalogPage } from '../features/catalog/catalog-page'

export const MoviesTop = () => {
  const fetchPage = useCallback((page: number) => moviesAPI.getTopRated(page), [])

  return (
    <CatalogPage
      title="Топ фильмов"
      subtitle="Лучшие фильмы с высоким рейтингом, собранные в отдельный desktop-каталог."
      emptyText="Топ фильмов сейчас недоступен."
      cacheKey="neo_catalog_top_movies_v1"
      fetchPage={fetchPage}
    />
  )
}
