import { Play } from 'lucide-solid'
import { Show } from 'solid-js'
import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../data'

type HeroProps = {
  movie?: ApiMovie
}

export function Hero(props: HeroProps) {
  return (
    <section class="hero">
      <Show
        when={props.movie}
        fallback={
          <>
            <div class="hero-logo-wrap">
              <div class="hero-logo hero-logo-skeleton" />
            </div>
            <p class="hero-description">Интерфейс и подборки должны жить даже без сети. Контент подтянется, как только API снова станет доступен.</p>
            <div class="hero-actions">
              <button type="button" class="focusable hero-button">
                <Play size={20} fill="currentColor" />
                <span>Открыть</span>
              </button>
            </div>
          </>
        }
      >
        {(movie) => (
          <>
            <div class="hero-logo-wrap">
              <img
                class="hero-logo"
                src={`${api.logoUrl(movie().id)}?size=small&format=webp&quality=70`}
                alt={movie().title}
              />
            </div>
            <p class="hero-description">{movie().description || 'Подборка для большого экрана без лишнего шума в интерфейсе.'}</p>
            <div class="hero-actions">
              <button type="button" class="focusable hero-button">
                <Play size={20} fill="currentColor" />
                <span>Смотреть</span>
              </button>
            </div>
          </>
        )}
      </Show>
    </section>
  )
}
