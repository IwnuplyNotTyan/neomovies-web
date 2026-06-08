import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import './MoreCard.css'

type MoreCardProps = {
  focusKey: string
  onEnterView: (element: HTMLButtonElement) => void
  onContentFocus?: (focusKey: string) => void
  onArrowMove?: (direction: string) => void
  onEnter?: () => void
}

export function MoreCard({ focusKey, onEnterView, onContentFocus, onArrowMove, onEnter }: MoreCardProps) {
  const handleFocus = () => {
    if (ref.current) onEnterView(ref.current as HTMLButtonElement)
    onContentFocus?.(focusKey)
  }

  const handleArrowPress = (direction: string) => {
    onArrowMove?.(direction)
    return true
  }

  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: handleFocus,
    onEnterPress: onEnter,
    onArrowPress: handleArrowPress,
  })

  return (
    <button ref={ref} type="button" className={`more-card ${focused ? 'is-focused' : ''}`}>
      <div className="more-card-box">
        <span className="more-card-title">Еще</span>
      </div>
    </button>
  )
}
