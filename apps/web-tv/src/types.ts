import type { ApiMovie } from '@neomovies/api-client'

export type CategoryId = 'popular' | 'movies' | 'tv'

export type HomeRows = {
  popular: ApiMovie[]
  movies: ApiMovie[]
  tv: ApiMovie[]
}

export type HomeRow = {
  id: CategoryId
  title: string
  items: ApiMovie[]
}

export type CategoryPage = {
  items: ApiMovie[]
  page: number
  totalPages: number
}

export type PlayerKey = 'cdn' | 'alloha' | 'collaps' | 'lumex'

export type PlayerState = {
  selectedPlayer: PlayerKey
  playerUrl: string | null
  playerHtml: string | null
  cdnAvailable: boolean
}
