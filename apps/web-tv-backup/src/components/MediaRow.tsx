import { useMemo, useRef, useState } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ApiMovie } from '@neomovies/api-client'
import { PosterCard } from './PosterCard'
import { MoreCard } from './MoreCard'
import './MediaRow.css'

type MediaRowProps = {
  rowId: string
  title: string
  items: ApiMovie[]
  loading?: boolean
  onRowShiftChange?: (shifted: boolean) => void
  onCardFocus: (movie: ApiMovie) => void
}

export function MediaRow({ rowId, title, items, loading = false, onRowShiftChange, onCardFocus }: MediaRowProps) {
  const rowFocusKey = `row-${rowId}`
  const trackRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)
  const [translateX, setTranslateX] = useState(0)

  const { ref } = useFocusable({
    focusKey: rowFocusKey,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: `${rowFocusKey}-card-0`,
    onFocus: (_layout, _props, details) => {
      const rowElement = details.node as HTMLDivElement | undefined
      rowElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
      onRowShiftChange?.(false)
    },
  })

  const { ref: moreButtonRef, focused: moreButtonFocused } = useFocusable({
    focusKey: `row-${rowId}-more-button`,
  })

  const skeletons = useMemo(() => [0, 1, 2, 3, 4], [])

  const syncRowPosition = (element: HTMLButtonElement) => {
    const trackElement = trackRef.current
    const viewportElement = viewportRef.current

    if (!trackElement || !viewportElement) return

    // Card position relative to track
    const trackRect = trackElement.getBoundingClientRect()
    const cardRect = element.getBoundingClientRect()

    const cardLeft = cardRect.left - trackRect.left + offsetRef.current
    const cardRight = cardLeft + element.offsetWidth

    const viewportWidth = viewportElement.clientWidth
    const safeLeft = 132   // sidebar width
    const safeRight = 40   // right padding

    const visibleLeft = offsetRef.current + safeLeft
    const visibleRight = offsetRef.current + viewportWidth - safeRight

    let nextOffset = offsetRef.current

    if (cardLeft < visibleLeft) {
      // Card is off to the left
      nextOffset = Math.max(0, cardLeft - safeLeft)
    } else if (cardRight > visibleRight) {
      // Card is off to the right — scroll so card right edge is inside safe zone
      nextOffset = cardRight - viewportWidth + safeRight
    }

    const maxOffset = Math.max(0, trackElement.scrollWidth - viewportWidth)
    const clampedOffset = Math.min(Math.max(0, nextOffset), maxOffset)

    offsetRef.current = clampedOffset
    setTranslateX(-clampedOffset)
    onRowShiftChange?.(clampedOffset > 24)
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="row">
      <div className="row-head">
        <div className="row-title">{title}</div>
        <button
          ref={moreButtonRef as React.RefObject<HTMLButtonElement>}
          type="button"
          className={`row-more ${moreButtonFocused ? 'is-focused' : ''}`}
        >
          Еще
        </button>
      </div>

      <div ref={viewportRef} className="row-viewport">
        <div
          ref={trackRef}
          className="row-track"
          style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
        >
          {loading ? (
            skeletons.map((item) => <div key={item} className="card-skeleton" />)
          ) : (
            <>
              {items.map((movie, index) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  focusKey={`${rowFocusKey}-card-${index}`}
                  cardIndex={index}
                  onEnterView={syncRowPosition}
                  onFocused={onCardFocus}
                />
              ))}
              <MoreCard
                focusKey={`${rowFocusKey}-more`}
                cardIndex={items.length}
                onEnterView={syncRowPosition}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
