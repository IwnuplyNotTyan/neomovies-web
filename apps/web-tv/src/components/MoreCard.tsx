import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import './MoreCard.css'

type MoreCardProps = {
  focusKey: string
  onEnterView: (element: HTMLButtonElement) => void
  onContentFocus?: (focusKey: string) => void
  onArrowMove?: (direction: string) => void
}

export function MoreCard({ focusKey, onEnterView, onContentFocus, onArrowMove }: MoreCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: () => {
      // details.node is undefined in norigin v3 — use ref.current directly
      if (ref.current) onEnterView(ref.current as HTMLButtonElement)
      onContentFocus?.(focusKey)
    },
    onArrowPress: (direction) => {
      onArrowMove?.(direction)
      return true
    },
  })

  return (
    <button ref={ref} type="button" className={`more-card ${focused ? 'is-focused' : ''}`}>
      <div className="more-card-box">
        <span className="more-card-title">Еще</span>
      </div>
    </button>
  )
}
