import { useEffect, useState } from 'react'

function readGap(style: CSSStyleDeclaration, property: 'columnGap' | 'rowGap') {
  const value = Number.parseFloat(style[property])
  return Number.isFinite(value) ? value : 0
}

export function useSkeletonCount(ref: React.RefObject<HTMLElement | null>, minimum = 4) {
  const [count, setCount] = useState(minimum)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateCount = () => {
      const firstItem = element.firstElementChild as HTMLElement | null
      if (!firstItem) {
        setCount(minimum)
        return
      }

      const style = window.getComputedStyle(element)
      const itemRect = firstItem.getBoundingClientRect()
      const columns = Math.max(1, Math.ceil(element.clientWidth / (itemRect.width + readGap(style, 'columnGap'))))
      const rows = Math.max(1, Math.ceil(element.clientHeight / (itemRect.height + readGap(style, 'rowGap'))))

      setCount(Math.max(minimum, columns * rows))
    }

    updateCount()

    const observer = new ResizeObserver(updateCount)
    observer.observe(element)

    const mutationObserver = new MutationObserver(updateCount)
    mutationObserver.observe(element, { childList: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [minimum, ref])

  return count
}
