import { For } from 'solid-js'
import type { ApiMovie } from '@neomovies/api-client'
import { PosterCard } from './PosterCard'
import './styles/MediaRow.css'

type MediaRowProps = {
  title: string
  items: ApiMovie[]
  firstRow?: boolean
  onCardFocus: (movie: ApiMovie) => void
}

export function MediaRow(props: MediaRowProps) {
  return (
    <div class="row">
      <div class="row-title">{props.title}</div>
      <div class="row-viewport">
        <div class="row-track">
          <For each={props.items}>
            {(movie, index) => (
              <PosterCard
                movie={movie}
                autofocus={props.firstRow && index() === 0}
                onFocus={() => props.onCardFocus(movie)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
