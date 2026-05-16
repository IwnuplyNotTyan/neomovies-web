import type { ApiMovie } from '@neomovies/api-client'

export type HomeRows = {
  popular: ApiMovie[]
  movies: ApiMovie[]
  tv: ApiMovie[]
}

export type HomeRow = {
  id: string
  title: string
  items: ApiMovie[]
}
