import { Play } from 'lucide-solid'
import { Show } from 'solid-js'
import type { ApiMovie } from '@neomovies/api-client'
import { api } from '../data'

export function HeroPanel(props: { movie?: ApiMovie }) {
  return (
    <section class="absolute top-[50%] left-32 z-[2] max-w-[760px] -translate-y-full">
      <Show when={props.movie}>
        {(movie) => (
          <div class="flex flex-col items-start gap-3">
            <div class="w-[420px]"><img src={`${api.logoUrl(movie().id)}?size=small&format=webp&quality=62`} alt={movie().title} class="block h-auto max-h-[86px] w-auto max-w-[420px] object-contain object-left" /></div>
            <Show when={movie().description}><p class="max-w-[700px] text-[20px] font-normal leading-relaxed text-white/62 line-clamp-3">{movie().description}</p></Show>
            <button class="mt-1 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3 text-[22px] font-semibold text-black/90"><Play size={20} fill="currentColor" /><span>Смотреть</span></button>
          </div>
        )}
      </Show>
    </section>
  )
}
