import { createResource } from 'solid-js'
import { createApiClient } from '@neomovies/api-client'

const env = (import.meta as any)?.env ?? {}
const rawApiBase = (env.VITE_API_URL || env.VITE_API_BASE_URL) as string | undefined
const apiBase = rawApiBase && rawApiBase.trim().length > 0 ? rawApiBase.trim().replace(/\/$/, '') : undefined
const isDev = Boolean(env.DEV)
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const resolvedBase =
  apiBase ??
  ((isDev || isLocalHost) ? 'http://localhost:3001' : 'https://api.neomovies.ru')
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
