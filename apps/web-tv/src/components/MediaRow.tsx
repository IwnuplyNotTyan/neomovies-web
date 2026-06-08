import { useRef, useState } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ApiMovie } from '@neomovies/api-client'
import { useSkeletonCount } from '../hooks/useSkeletonCount'
import { PosterCard } from './PosterCard'
import { MoreCard } from './MoreCard'
import './MediaRow.css'

type MediaRowProps = {
  rowId: string
  title: string
  items: ApiMovie[]
  loading?: boolean
  onSidebarHiddenChange?: (hidden: boolean) => void
  onCardFocus: (movie: ApiMovie) => void
  onContentFocus?: (focusKey: string) => void
  onOpenCategory?: () => void
  onOpenDetails?: (movie: ApiMovie, focusKey: string) => void
}

function getOffsetInsideTrack(element: HTMLElement, trackElement: HTMLElement) {
  let offset = 0
  let node: HTMLElement | null = element

  while (node && node !== trackElement) {
    offset += node.offsetLeft
    node = node.offsetParent as HTMLElement | null
  }

  return offset
}

function getTrackInsets(trackElement: HTMLElement) {
  const style = window.getComputedStyle(trackElement)

  return {
    left: Number.parseFloat(style.paddingLeft) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
  }
}

function clampOffset(offset: number, trackElement: HTMLElement, viewportElement: HTMLElement) {
  const insets = getTrackInsets(trackElement)
  const usableWidth = viewportElement.clientWidth - insets.left - insets.right
  const contentWidth = trackElement.scrollWidth - insets.left - insets.right
  const maxOffset = Math.max(0, contentWidth - usableWidth)

  return Math.min(Math.max(0, offset), maxOffset)
}

export function MediaRow({
  rowId,
  title,
  items,
  loading = false,
  onSidebarHiddenChange,
  onCardFocus,
  onContentFocus,
  onOpenCategory,
  onOpenDetails,
}: MediaRowProps) {
  const rowFocusKey = `row-${rowId}`
  const trackRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)
  const horizontalMoveRef = useRef(false)
  const [translateX, setTranslateX] = useState(0)
  const skeletonCount = useSkeletonCount(viewportRef, 5)
  const [animateTrack, setAnimateTrack] = useState(false)

  const { ref } = useFocusable({
    focusKey: rowFocusKey,
    focusable: false,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: `${rowFocusKey}-card-0`,
  })

  const scrollRowIntoView = (element: HTMLElement) => {
    element.closest('.row')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }

  const syncRowPosition = (element: HTMLButtonElement) => {
    scrollRowIntoView(element)

    const trackElement = trackRef.current
    const viewportElement = viewportRef.current
    if (!trackElement || !viewportElement) return

    const insets = getTrackInsets(trackElement)
    const cardLeft = getOffsetInsideTrack(element, trackElement) - insets.left
    const cardRight = cardLeft + element.offsetWidth
    const usableWidth = viewportElement.clientWidth - insets.left - insets.right
    const visibleRight = offsetRef.current + usableWidth
    const currentOffset = offsetRef.current

    let nextOffset = currentOffset
    if (cardLeft < currentOffset) {
      nextOffset = Math.max(0, cardLeft)
    } else if (cardRight > visibleRight) {
      nextOffset = cardRight - usableWidth
    }

    const clamped = clampOffset(nextOffset, trackElement, viewportElement)
    const shouldAnimate = horizontalMoveRef.current

    horizontalMoveRef.current = false
    offsetRef.current = clamped
    setAnimateTrack(shouldAnimate)
    setTranslateX(-clamped)
    onSidebarHiddenChange?.(clamped > 0)
  }

  const handleItemArrow = (direction: string) => {
    if (direction === 'left' || direction === 'right') {
      horizontalMoveRef.current = true
    }
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="row">
      <h2 className="row-title">{title}</h2>

      <div ref={viewportRef} className="row-viewport">
        <div
          ref={trackRef}
          className={`row-track ${animateTrack ? 'row-track-animate' : ''}`}
          style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
        >
          {loading ? (
            Array.from({ length: skeletonCount }, (_, item) => <div key={item} className="card-skeleton" />)
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
                  onSidebarHiddenChange={onSidebarHiddenChange}
                  onContentFocus={onContentFocus}
                  onArrowMove={handleItemArrow}
                  onEnterPress={onOpenDetails}
                />
              ))}
              <MoreCard
                focusKey={`${rowFocusKey}-more`}
                onEnterView={syncRowPosition}
                onContentFocus={onContentFocus}
                onArrowMove={handleItemArrow}
                onEnter={onOpenCategory}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
