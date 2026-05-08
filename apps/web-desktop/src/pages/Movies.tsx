import { useCallback } from 'react'
import { moviesAPI } from '../api'
import { CatalogPage } from '../features/catalog/catalog-page'

export const Movies = () => {
  const fetchPage = useCallback((page: number) => moviesAPI.getPopular(page), [])

  return (
    <CatalogPage
      title="Популярное"
      subtitle="Подборка того, что сейчас чаще всего смотрят и открывают в NeoMovies."
      emptyText="Популярные фильмы сейчас недоступны."
      cacheKey="neo_catalog_popular_movies_v1"
      fetchPage={fetchPage}
    />
  )
}
