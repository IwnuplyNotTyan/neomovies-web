import type { Movie } from '../types'

const STORAGE_KEY = 'neo_recently_viewed_v1'
const MAX_ITEMS = 10

interface RecentlyViewedCache {
  items: Movie[]
  lastUpdated: number
}

function loadFromStorage(): Movie[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed: RecentlyViewedCache = JSON.parse(data)
    return parsed.items || []
  } catch {
    return []
  }
}

function saveToStorage(items: Movie[]): void {
  try {
    const data: RecentlyViewedCache = {
      items: items.slice(0, MAX_ITEMS),
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // silent fail
  }
}

function getMovieId(movie: Movie): string {
  if (typeof movie.id === 'string') return movie.id
  if (movie.kinopoisk_id) return `kp_${movie.kinopoisk_id}`
  if (movie.filmId) return String(movie.filmId)
  return String(movie.id)
}

function normalizeMovieId(id: string): string {
  return id.replace(/^kp_/, '')
}

function idsEqual(a: Movie, b: Movie): boolean {
  return normalizeMovieId(getMovieId(a)) === normalizeMovieId(getMovieId(b))
}

export const recentlyViewedCache = {
  get(): Movie[] {
    return loadFromStorage()
  },

  add(movie: Movie): void {
    const items = loadFromStorage()
    const existingIndex = items.findIndex(item => idsEqual(item, movie))
    
    if (existingIndex !== -1) {
      items.splice(existingIndex, 1)
    }
    
    items.unshift(movie)
    
    const trimmed = items.slice(0, MAX_ITEMS)
    saveToStorage(trimmed)
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}