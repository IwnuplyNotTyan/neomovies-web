import SpatialNavigation from 'spatial-navigation-js'

let started = false

export function initSpatialNavigation() {
  if (started || typeof window === 'undefined') return

  SpatialNavigation.init()

  // Sidebar always returns focus to the currently selected menu item
  SpatialNavigation.add('sidebar', {
    selector: '[data-focus-section="sidebar"] .focusable',
    enterTo: 'default-element',
    defaultElement: '.sidebar-button.is-active',
    leaveFor: {
      right: '@content'
    }
  })

  // Content area rows
  SpatialNavigation.add('content', {
    selector: '[data-focus-section="content"] .focusable',
    enterTo: 'last-focused',
    leaveFor: {
      left: '@sidebar'
    }
  })

  document.addEventListener('sn:willmove', ((event: Event) => {
    const detail = (event as CustomEvent<{ direction?: string, cause?: HTMLElement }>).detail
    const cause = detail?.cause
    if (!cause) return

    if (detail.direction === 'up' && cause.classList.contains('card')) {
      const row = cause.closest<HTMLElement>('[data-row-id]')
      const rowId = row?.dataset.rowId
      if (!rowId) return

      const headButton = document.querySelector<HTMLElement>(`.row-more[data-row-head="${rowId}"]`)
      if (!headButton) return

      event.preventDefault()
      headButton.focus()
      return
    }

    if (detail.direction === 'down' && cause.classList.contains('row-more')) {
      const rowId = cause.getAttribute('data-row-head')
      if (!rowId) return

      const firstCard = document.querySelector<HTMLElement>(`[data-row-id="${rowId}"] .card.focusable`)
      if (!firstCard) return

      event.preventDefault()
      firstCard.focus()
    }
  }) as EventListener)

  started = true
}

export function refreshFocusable() {
  if (!started) return
  SpatialNavigation.makeFocusable()
}

export function focusFirstContent() {
  if (!started) return
  SpatialNavigation.focus('.card[data-autofocus="true"]')
}

export function focusSidebar() {
  if (!started) return
  SpatialNavigation.focus('.sidebar-button.is-active')
}
