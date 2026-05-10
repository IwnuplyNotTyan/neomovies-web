export function AllCard(props: { active?: boolean }) {
  return (
    <article class={`tv-card tv-card-all shrink-0 ${props.active ? 'tv-card-active' : ''}`}>
      <div class="tv-card-all-inner">
        <div class="tv-card-all-title">Все</div>
        <div class="tv-card-all-subtitle">Открыть полный список</div>
      </div>
    </article>
  )
}
