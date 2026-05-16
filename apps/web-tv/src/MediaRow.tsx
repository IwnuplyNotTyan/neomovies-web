'use no memo'

import { useCallback, useMemo, useRef, useState } from 'react'
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

const TRACK_PADDING_LEFT = 132
const SAFE_RIGHT = 40

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
      rowElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      onRowShiftChange?.(false)
    },
  })

  const { ref: moreButtonRef, focused: moreButtonFocused } = useFocusable({
    focusKey: `row-${rowId}-more-button`,
  })

  const skeletons = useMemo(() => [0, 1, 2, 3, 4], [])

  const syncRowPosition = useCallback((element: HTMLButtonElement) => {
    const trackElement = trackRef.current
    const viewportElement = viewportRef.current

    console.log(`[${rowFocusKey}] syncRowPosition called`, {
      element,
      trackElement,
      viewportElement,
      currentOffset: offsetRef.current,
    })

    if (!trackElement || !viewportElement) {
      console.warn(`[${rowFocusKey}] MISSING REFS — track: ${!!trackElement}, viewport: ${!!viewportElement}`)
      return
    }

    let rawLeft = 0
    let node: HTMLElement | null = element
    while (node && node !== trackElement) {
      rawLeft += node.offsetLeft
      node = node.offsetParent as HTMLElement | null
    }

    const cardLeft = rawLeft - TRACK_PADDING_LEFT
    const cardRight = cardLeft + element.offsetWidth
    const viewportWidth = viewportElement.clientWidth
    const usableWidth = viewportWidth - TRACK_PADDING_LEFT - SAFE_RIGHT
    const currentOffset = offsetRef.current

    console.log(`[${rowFocusKey}] card pos`, {
      rawLeft,
      cardLeft,
      cardRight,
      viewportWidth,
      usableWidth,
      currentOffset,
      trackScrollWidth: trackElement.scrollWidth,
    })

    let nextOffset = currentOffset
    if (cardLeft < currentOffset) {
      nextOffset = Math.max(0, cardLeft)
    } else if (cardRight > currentOffset + usableWidth) {
      nextOffset = cardRight - usableWidth
    }

    const contentWidth = trackElement.scrollWidth - TRACK_PADDING_LEFT - SAFE_RIGHT
    const maxOffset = Math.max(0, contentWidth - usableWidth)
    const clamped = Math.min(Math.max(0, nextOffset), maxOffset)

    console.log(`[${rowFocusKey}] translate`, { nextOffset, clamped, maxOffset })

    offsetRef.current = clamped
    setTranslateX(-clamped)
    onRowShiftChange?.(clamped > 24)
  }, [onRowShiftChange, rowFocusKey])

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
