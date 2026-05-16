import { createResource } from 'solid-js'
import { createApiClient } from '@neomovies/api-client'

const env = (import.meta as any)?.env ?? {}
const rawApiBase = (env.VITE_API_URL || env.VITE_API_BASE_URL) as string | undefined

const resolvedBase = rawApiBase && rawApiBase.trim().length > 0 
  ? rawApiBase.trim().replace(/\/$/, '') 
  : 'https://api.neomovies.ru'
export const api = createApiClient(resolvedBase)
export const apiBaseUrl = resolvedBase

export function createPopular() {
  return createResource(() => api.popular())
}
export const fetchPopularPage = (page: number) => api.popular(page)

export function createTopMovies() {
  return createResource(() => api.topMovies())
}
export const fetchTopMoviesPage = (page: number) => api.topMovies(page)

export function createTopTv() {
  return createResource(() => api.topTv())
}
export const fetchTopTvPage = (page: number) => api.topTv(page)

export function createSearch(query: () => string) {
  return createResource(
    () => query().length > 1 ? query() : null,
    (q) => api.search(q)
  )
}
