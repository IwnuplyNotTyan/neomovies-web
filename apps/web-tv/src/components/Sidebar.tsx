import Film from 'lucide-react/dist/esm/icons/film.js'
import Heart from 'lucide-react/dist/esm/icons/heart.js'
import Home from 'lucide-react/dist/esm/icons/home.js'
import Search from 'lucide-react/dist/esm/icons/search.js'
import Tv from 'lucide-react/dist/esm/icons/tv.js'
import User from 'lucide-react/dist/esm/icons/user.js'
import { useEffect } from 'react'
import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { CategoryId } from '../types'
import './Sidebar.css'

const getCategoryId = (itemKey: string): CategoryId | null => {
  if (itemKey === 'popular' || itemKey === 'movies' || itemKey === 'tv') return itemKey
  return null
}

type SidebarProps = {
  activeItem: string
  hidden?: boolean
  returnFocusKey?: string
  onOpenCategory?: (categoryId: CategoryId) => void
  onOpenHome?: () => void
  onOpenSearch?: () => void
  suppressCategoryOpen?: boolean
}

const items = [
  { key: 'search', icon: Search },
  { key: 'home', icon: Home },
  { key: 'movies', icon: Film },
  { key: 'tv', icon: Tv },
  { key: 'favorites', icon: Heart },
]

type SidebarButtonProps = {
  itemKey: string
  active: boolean
  icon: typeof Search
  returnFocusKey?: string
  onOpenCategory?: (categoryId: CategoryId) => void
  onOpenHome?: () => void
  onOpenSearch?: () => void
  suppressCategoryOpen?: boolean
}

function SidebarButton({ itemKey, active, icon: Icon, returnFocusKey, onOpenCategory, onOpenHome, onOpenSearch, suppressCategoryOpen = false }: SidebarButtonProps) {
  const categoryId = getCategoryId(itemKey)

  const returnToContent = () => {
    if (!returnFocusKey) return false

    requestAnimationFrame(() => {
      setFocus(returnFocusKey)
    })

    return true
  }

  const { ref, focused } = useFocusable({
    focusKey: `sidebar-${itemKey}`,
    onArrowPress: (direction) => {
      if (direction !== 'right') return true
      return !returnToContent()
    },
  })

  useEffect(() => {
    if (!focused) return
    if (categoryId && !suppressCategoryOpen) onOpenCategory?.(categoryId)
    if (itemKey === 'home') onOpenHome?.()
    if (itemKey === 'search') {
      requestAnimationFrame(() => {
        onOpenSearch?.()
      })
    }
  }, [categoryId, focused, itemKey, onOpenCategory, onOpenHome, onOpenSearch, suppressCategoryOpen])

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`sidebar-button ${active ? 'is-active' : ''} ${focused ? 'is-focused' : ''}`}
    >
      <Icon size={22} strokeWidth={2.2} />
    </button>
  )
}

export function Sidebar({ activeItem, hidden = false, returnFocusKey, onOpenCategory, onOpenHome, onOpenSearch, suppressCategoryOpen = false }: SidebarProps) {
  const activeCategoryId = getCategoryId(activeItem)

  const { ref } = useFocusable({
    focusKey: 'sidebar',
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: `sidebar-${activeItem}`,
  })

  return (
    <aside
      ref={ref as React.RefObject<HTMLElement>}
      className={`sidebar ${hidden ? 'sidebar-hidden' : ''}`}
    >
      <div className="sidebar-top">
        <div className="sidebar-button sidebar-profile is-active">
          <User size={24} />
        </div>
      </div>

      <div className="sidebar-nav">
        {items.map((item) => (
          <SidebarButton
            key={item.key}
            itemKey={item.key}
            active={activeItem === item.key}
            icon={item.icon}
            returnFocusKey={returnFocusKey}
            onOpenCategory={onOpenCategory}
            onOpenHome={onOpenHome}
            onOpenSearch={onOpenSearch}
            suppressCategoryOpen={suppressCategoryOpen && item.key === activeCategoryId}
          />
        ))}
      </div>
    </aside>
  )
}
