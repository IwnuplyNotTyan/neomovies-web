import { createApiClient } from '@neomovies/api-client'

const env = import.meta.env
const rawApiBase = env.VITE_API_URL || env.VITE_API_BASE_URL

const resolvedBase = rawApiBase && rawApiBase.trim().length > 0
  ? rawApiBase.trim().replace(/\/$/, '')
  : 'https://api.neomovies.ru'

export const api = createApiClient(resolvedBase)

export async function fetchHomeRows() {
  const [popular, movies, tv] = await Promise.all([
    api.popular(1),
    api.topMovies(1),
    api.topTv(1),
  ])

  return {
    popular: popular.data.results ?? [],
    movies: movies.data.results ?? [],
    tv: tv.data.results ?? [],
  }
}
