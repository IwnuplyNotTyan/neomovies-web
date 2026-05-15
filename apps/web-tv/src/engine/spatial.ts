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

  started = true
}

export function refreshFocusable() {
  if (!started) return
  SpatialNavigation.makeFocusable()
}

export function focusFirstContent() {
  if (!started) return
  SpatialNavigation.focus('[data-autofocus="true"]')
}