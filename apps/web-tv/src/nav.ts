import { init, setFocus, SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation-core'
import { onMount, onCleanup, createSignal } from 'solid-js'

export function initNav() {
  init({ debug: false, visualDebug: false })
}

export function useFocusable(focusKey: string, opts?: {
  onEnterPress?: () => void
  onFocus?: () => void
  parentFocusKey?: string
  onArrowPress?: (direction: string) => boolean
}) {
  const [focused, setFocused] = createSignal(false)

  function ref(el: HTMLElement) {
    onMount(() => {
      SpatialNavigation.addFocusable({
        focusKey,
        node: el,
        parentFocusKey: opts?.parentFocusKey ?? 'ROOT',
        onEnterPress: opts?.onEnterPress ?? (() => {}),
        onEnterRelease: () => {},
        onArrowPress: (direction: string) => opts?.onArrowPress ? opts.onArrowPress(direction) : true,
        onArrowRelease: () => {},
        onFocus: ({ node: n }: { node: HTMLElement }) => {
          setFocused(true)
          n?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
          opts?.onFocus?.()
        },
        onBlur: () => setFocused(false),
        onUpdateFocus: () => {},
        onUpdateHasFocusedChild: () => {},
        saveLastFocusedChild: false,
        trackChildren: false,
        autoRestoreFocus: true,
        isFocusBoundary: false,
        focusBoundaryDirections: [],
        preferredChildFocusKey: undefined,
        focusable: true,
        forceFocus: false,
      })
    })
    onCleanup(() => SpatialNavigation.removeFocusable({ focusKey }))
  }

  return { ref, focused }
}

export { setFocus }
