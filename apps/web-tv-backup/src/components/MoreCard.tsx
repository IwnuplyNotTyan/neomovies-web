import './styles/MoreCard.css'

type MoreCardProps = {
  onFocus: (el: HTMLElement) => void
}

export function MoreCard(props: MoreCardProps) {
  return (
    <button
      type="button"
      class="more-card focusable"
      data-nav-end="true"
      data-focus-role="row-more-card"
      onFocus={(e) => props.onFocus(e.currentTarget)}
    >
      <div class="more-card-box">
        <span class="more-card-title">Еще</span>
      </div>
    </button>
  )
}
