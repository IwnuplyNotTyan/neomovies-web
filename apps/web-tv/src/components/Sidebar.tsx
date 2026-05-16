import { Heart, Home, Search, Tv, User, Film } from 'lucide-react'
import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import './Sidebar.css'

type SidebarProps = {
  activeItem: string
  hidden?: boolean
  returnFocusKey?: string
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
}

function SidebarButton({ itemKey, active, icon: Icon, returnFocusKey }: SidebarButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: `sidebar-${itemKey}`,
    onArrowPress: (direction) => {
      if (direction !== 'right' || !returnFocusKey) return true

      requestAnimationFrame(() => {
        setFocus(returnFocusKey)
      })

      return false
    },
  })

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

export function Sidebar({ activeItem, hidden = false, returnFocusKey }: SidebarProps) {
  const { ref } = useFocusable({
    focusKey: 'sidebar',
    trackChildren: true,
    // saveLastFocusedChild so when coming back it remembers which button was focused
    saveLastFocusedChild: true,
    // preferred key = active item, used only on first focus, then saveLastFocusedChild takes over
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
          />
        ))}
      </div>
    </aside>
  )
}
